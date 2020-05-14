import User from "../db/models/userModel";
import { checkChannelExists } from "../helpers/channelsServiceHelpers";
import spotifyApi from "../helpers/spotifyWebApi";
import { checkUserExists } from "../helpers/usersServiceHelpers";
import { createUserPlaylist } from "../helpers/utils";

export async function addChannelToUser(channelId: string, userId: number) {
	try {
		await checkUserExists(userId);

		await checkChannelExists(channelId);

		await User.updateOne(
			{ _id: userId },
			{ $addToSet: { subbedChannels: channelId } }
		);
	} catch (err) {
		throw err;
	}
}

export async function getUser(userId: number) {
	try {
		await checkUserExists(userId);

		const user = await User.findById(userId)
			.populate("subbedChannels")
			.exec();

		return user;
	} catch (err) {
		throw err;
	}
}
export async function removeChannelFromUser(channelId: string, userId: number) {
	try {
		await checkUserExists(userId);

		await checkChannelExists(channelId);

		await User.update(
			{ _id: userId },
			// @ts-ignore
			{ $pull: { subbedChannels: channelId } }
		);
	} catch (err) {
		throw err;
	}
}

export async function createSpotifyPlaylist(
	userSpotifyId: string,
	userDbId: number
) {
	try {
		await checkUserExists(userDbId);

		// hit spotify api to create new playlist
		const newPlaylistId = await createUserPlaylist(userSpotifyId);

		// update user with new spotify playlist data
		await User.updateOne(
			{ _id: userDbId },
			{ hasPlaylist: true, spotifyPlaylistId: newPlaylistId }
		);
	} catch (err) {
		throw err;
	}
}
