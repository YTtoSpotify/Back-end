import { IChannelSchema } from "./../interfaces/dbModelInterfaces";
import Channel from "../db/models/channelModel";
import User from "../db/models/userModel";
import spotifyApi from "./spotifyWebApi";
import NodeCache from "node-cache";

import {
	refreshSessionAccessToken,
	fetchActiveSessions,
	isTokenExpired,
	addSongToUserPlaylist,
	getLatestUploads,
} from "./utils";

export default async function scrapeChannels() {
	try {
		const songCache = new NodeCache();
		// fetch all channels
		const channels = (await Channel.find()
			.sort({ name: "asc" })
			.lean()
			.exec()) as IChannelSchema[];

		// fetch active sessions objects
		const activeSessionTokens = await fetchActiveSessions();

		const latestVideosData = await getLatestUploads(channels);

		for (const video of latestVideosData) {
			// fetch all users subbed to channel that uploaded video
			const users = await User.find({
				subbedChannels: video.channelId,
			});

			for (const user of users) {
				// get session associated with user
				const userSession = activeSessionTokens[user._id];

				spotifyApi.setRefreshToken(userSession.refreshToken);

				// check if token is expired
				if (isTokenExpired(userSession.tokenExpirationDate)) {
					// get new access token and expiration timestamp
					const {
						body: { access_token, expires_in },
					} = await spotifyApi.refreshAccessToken();

					// update userSession in local object
					userSession.accessToken = access_token;
					userSession.tokenExpirationDate = new Date(
						Date.now() + expires_in * 1000
					).toString();

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
			}
		}
	} catch (err) {
		console.log(err);
		throw err;
	}
}
