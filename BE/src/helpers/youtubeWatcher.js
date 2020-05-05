const axios = require("axios");
const convert = require("xml-js");
require("dotenv").config();
const Channel = require("../db/models/channelModel");
const User = require("../db/models/userModel");
const mongoose = require("mongoose");
const SpotifyWebApi = require("spotify-web-api-node");
const {
	checkTokenExpiration,
	refreshSessionAccessToken,
	fetchActiveSessions,
} = require("../helpers/utils");

module.exports = { scrapeChannels };

function getLatestVideoFromXMLFeed(channelXMLFeed) {
	// convert xml to js object
	const allXMLElements = convert.xml2js(channelXMLFeed.data).elements[0]
		.elements;

	// grab latest video uploaded from xml
	const latestVideo = allXMLElements.find((el) => {
		return el.name === "entry" && el.elements && el.elements.length === 9;
	});

	// destructure video id and title from nested elements in xml
	const { text: videoId } = latestVideo.elements[1].elements[0];
	const { text: videoTitle } = latestVideo.elements[3].elements[0];

	return { videoTitle, videoId };
}

async function scrapeChannels(db) {
	const tempSpotifyApi = new SpotifyWebApi({
		clientId: process.env.CLIENT_ID,
		clientSecret: process.env.CLIENT_SECRET,
		redirectUri: process.env.REDIRECT_URI,
	});

	// fetch all channel ids
	const channels = await await Channel.find({}).lean().exec();
	// fetch all active sessions
	const activeSessionDocs = await mongoose.connection
		.collection("sessions")
		.find({})
		.toArray();

	// grab session data out of session
	const activeSessionTokens = await fetchActiveSessions();

	channels.forEach(async (channel) => {
		// get feed xml from youtube channel xml feed
		const page = await axios.get(
			`https://www.youtube.com/feeds/videos.xml?channel_id=${channel.ytId}`
		);

		// get title and id of most recent upload
		const { videoTitle, videoId } = getLatestVideoFromXMLFeed(page);

		// set latest channel video id to fetched channel id
		if (!channel.latestUploadId || channel.latestUploadId != videoId) {
			await Channel.updateOne(
				{ _id: channel._id },
				{ latestUploadId: videoId }
			);
		}

		// get all user ids of users watching channel
		const subscribedUsers = await await User.find({
			subbedChannels: channel._id,
		})
			.lean()
			.exec();

		// add spotify track to each subscribed user playlist
		subscribedUsers.forEach(async (user) => {
			// fetch session from object
			const userSession = activeSessionTokens[user._id];

			// set refresh token
			tempSpotifyApi.setRefreshToken(userSession.refreshToken);

			// get new access token if expired
			if (checkTokenExpiration(userSession.tokenExpirationDate)) {
				try {
					// get new access token and expiration date from token refresh
					const {
						body: { access_token, expires_in },
					} = await tempSpotifyApi.refreshAccessToken();

					// update temporary object properties related to session
					userSession.accessToken = access_token;
					userSession.tokenExpirationDate = new Date(
						Date.now() + expires_in * 1000
					);

					// update session in DB
					refreshSessionAccessToken(userSession.sessionId, {
						access_token,
						expires_in,
					});
				} catch (error) {
					console.log(error);
				}
			}

			tempSpotifyApi.setAccessToken(userSession.accessToken);

			console.log(videoTitle);
			// split video title at dash
			const noDashTitle = videoTitle.split("-");

			// strip whitespace
			const noWhiteSpaceTitle = noDashTitle.map((string, i) =>
				noDashTitle[i].trim()
			);

			console.log(noWhiteSpaceTitle);

			// tempSpotifyApi.addTracksToPlaylist(user.play);
		});
	});
}

scrapeChannels();
