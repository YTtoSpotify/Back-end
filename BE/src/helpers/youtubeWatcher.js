const axios = require("axios");
const Channel = require("../db/models/channelModel");
const User = require("../db/models/userModel");
const spotifyApi = require("./spotifyWebApi");
require("dotenv").config();

const {
	refreshSessionAccessToken,
	fetchActiveSessions,
	cleanVideoTitle,
	getLatestVideoFromXMLFeed,
	isSongInSpotifyPlaylist,
	checkTokenExpiration,
} = require("../helpers/utils");

module.exports = { scrapeChannels };

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

				//get cleaned artist and song names
				const [artistName, songName] = cleanVideoTitle(video.videoTitle);

				// I could cache this and just grab it after the first call
				// this doesn't need to be fetched for every user, it just needs a uid for each user, meaning we fetch for the first loop iteration and grab from cache for the rest
				const songs = await spotifyApi.searchTracks(
					`track: ${songName} artist: ${artistName}`,
					{ limit: 1 }
				);

				const song = songs.body.tracks.items[0];

				if (song) {
					// cache = set with song uid's
					// store in cache if not there already

					// update only once
					const songDBChannel = await Channel.findOneAndUpdate(
						{ _id: video.channelId },
						{ latestUploadId: video.videoId },
						{ useFindAndModify: false }
					)
						.lean()
						.exec();

					// this could be stored in a cache with key spotifyPlaylistId, value songUris
					const {
						body: { items },
					} = await spotifyApi.getPlaylistTracks(user.spotifyPlaylistId);

					const songUris = items.map((trackObject) => {
						return trackObject.track.uri;
					});

					// validate that song is not in playlist already and song is not the previous latest upload
					// playlist check ensures if channels upload same song it is not added to the playlist twice
					// latest upload check ensures that songs don't get added again after bi-weekly playlist wipe
					if (
						!isSongInSpotifyPlaylist(songUris, song.uri) &&
						!(songDBChannel.latestUploadId === video.videoId)
					) {
						// add song to playlist
						try {
							await spotifyApi.addTracksToPlaylist(
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
