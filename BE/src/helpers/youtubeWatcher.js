const axios = require("axios");
const Channel = require("../db/models/channelModel");
const User = require("../db/models/userModel");
const SpotifyWebApi = require("spotify-web-api-node");
require("dotenv").config();

const {
	refreshSessionAccessToken,
	fetchActiveSessions,
	cleanVideoTitle,
	getLatestVideoFromXMLFeed,
} = require("../helpers/utils");

module.exports = { scrapeChannels };

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
						{ latestUploadId: video.videoId },
						{ useFindAndModify: false }
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

scrapeChannels();
