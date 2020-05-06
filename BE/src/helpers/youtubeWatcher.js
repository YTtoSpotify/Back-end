const axios = require("axios");
const Channel = require("../db/models/channelModel");
const User = require("../db/models/userModel");
const spotifyApi = require("./spotifyWebApi");
require("dotenv").config();
const NodeCache = require("node-cache");

const {
	refreshSessionAccessToken,
	fetchActiveSessions,
	getLatestVideoFromXMLFeed,
	checkTokenExpiration,
	addSongToUserPlaylist,
} = require("../helpers/utils");

module.exports = { scrapeChannels };

async function scrapeChannels() {
	try {
		const songCache = new NodeCache();
		// fetch all channels
		const channels = await Channel.find().sort({ name: "asc" }).lean().exec();

		// fetch active sessions objects
		const activeSessionTokens = await fetchActiveSessions();

		// get xml data for each channel's latest video
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

			await Promise.all(
				users.map(async (user) => {
					// get session associated with user
					const userSession = activeSessionTokens[user._id];

					// set refresh token
					spotifyApi.setRefreshToken(userSession.refreshToken);

					// check if token is expired
					if (checkTokenExpiration(userSession.tokenExpirationDate)) {
						// get new access token and expiration timestamp
						const {
							body: { access_token, expires_in },
						} = await spotifyApi.refreshAccessToken();

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
					spotifyApi.setAccessToken(userSession.accessToken);

					// add song to user playlist
					await addSongToUserPlaylist(user, video, songCache);
				})
			);

			// update video channel latest uploaded video id
			await Channel.updateOne(
				{
					_id: video.channelId,
				},
				{
					latestUploadId: video.videoId,
				},
				{
					useFindAndModify: false,
				}
			)
				.lean()
				.exec();
		});
	} catch (err) {
		throw err;
	}
}
