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
	clearUserPlaylist,
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

		// get all users that need playlist reset
		const allUsersWithPlaylist = await User.find({
			hasPlaylist: true,
		});
		const resetPlaylistUsers: Set<string> = new Set([]);

		allUsersWithPlaylist.forEach((user) => {
			resetPlaylistUsers.add(user.id);
		});

		const latestVideosData = await getLatestUploads(channels);

		for (const video of latestVideosData) {
			// fetch all users subbed to channel that uploaded video
			const users = await User.find({
				subbedChannels: video.channelId,
				hasPlaylist: true,
			});

			for (const user of users) {
				// get session associated with user
				const userSession = activeSessionTokens![user.id];

				if (userSession) {
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

					// clear user playlist if needed
					if (resetPlaylistUsers.has(user.id)) {
						await clearUserPlaylist(user);
						resetPlaylistUsers.delete(user.id);
					}

					// add song to user playlist
					await addSongToUserPlaylist(user, video, songCache);
				}
			}
		}
		console.log("ran scrape");
	} catch (err) {}
}
