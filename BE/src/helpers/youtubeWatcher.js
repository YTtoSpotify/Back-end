const axios = require("axios");
const convert = require("xml-js");
require("dotenv").config();
const Channel = require("../db/models/channelModel");
const User = require("../db/models/userModel");
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

function cleanVideoTitle(videoTitle) {
	// split video title at dash
	const noDashTitle = videoTitle.split("-");
	// strip whitespace and remove all parentheses and their enclosed text
	const cleanedTitles = noDashTitle.map((string, i) => {
		const cleanedTitle = string.replace(/\(([^\)]+)\)/g, "").trim();
		return cleanedTitle;
	});
	return cleanedTitles;
}

const tempSpotifyApi = new SpotifyWebApi({
	clientId: process.env.CLIENT_ID,
	clientSecret: process.env.CLIENT_SECRET,
	redirectUri: process.env.REDIRECT_URI,
});

async function scrapeChannels() {
	try {
		const channels = await Channel.find().sort({ name: "asc" }).lean().exec();

		// fetch active sessions objects
		const activeSessionTokens = await fetchActiveSessions();

		const latestVideosData = await Promise.all(
			channels.map(async (channel) => {
				// get feed xml from youtube channel xml feed
				const page = await axios.get(
					`https://www.youtube.com/feeds/videos.xml?channel_id=${channel.ytId}`
				);

				// get title and id of most recent upload
				const { videoTitle, videoId } = getLatestVideoFromXMLFeed(page);

				return {
					videoTitle,
					videoId,
					channelId: channel._id,
				};
			})
		);

		await latestVideosData.forEach(async (video) => {
			// fetch all users subbed to channel that uploaded video
			const users = await User.find({
				subbedChannels: video.channelId,
			})
				.lean()
				.exec();

			await users.forEach(async (user) => {
				// get session associated with user
				const userSession = activeSessionTokens[user._id];

				// set refresh token
				tempSpotifyApi.setRefreshToken(userSession.refreshToken);

				// check if token expired
				if (checkTokenExpiration(userSession.tokenExpirationDate)) {
					// get new access token and expiration timestamp
					const {
						body: { access_token, expires_in },
					} = await tempSpotifyApi.refreshAccessToken();

					// update userSession in local object
					userSession.accessToken = access_token;
					userSession.tokenExpirationDate = new Date(
						Date.now() + expires_in * 1000
					);

					// update session in db
					await refreshSessionAccessToken(userSession.sessionId, {
						access_token,
						expires_in,
					});
				}

				// set access token
				tempSpotifyApi.setAccessToken(userSession.accessToken);

				//get cleaned artist and song names
				const [artistName, songName] = cleanVideoTitle(video.videoTitle);

				const songs = await tempSpotifyApi.searchTracks(
					`track: ${songName} artist: ${artistName}`,
					{ limit: 1 }
				);

				const song = songs.body.tracks.items[0];

				if (song) {
					const songDBChannel = await Channel.findOneAndUpdate(
						{ _id: video.channelId },
						{ latestUploadId: video.videoId }
					)
						.lean()
						.exec();

					if (!(songDBChannel.latestUploadId === video.videoId)) {
						// add song to playlist
						try {
							await tempSpotifyApi.addTracksToPlaylist(
								user.spotifyPlaylistId,
								[song.uri]
							);
						} catch (err) {
							throw err;
						}
					}
				}
			});
		});
	} catch (err) {
		throw err;
	}
}

// scrapeChannels();
