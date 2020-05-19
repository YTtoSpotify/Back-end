import User from "../db/models/userModel";
import { checkChannelExists } from "../helpers/channelsServiceHelpers";
import { checkUserExists } from "../helpers/usersServiceHelpers";
import { createUserPlaylist } from "../helpers/utils";

export async function addChannelToUser(channelId: string, userId: number) {
	await checkUserExists(userId);

	await checkChannelExists(channelId);

	await User.updateOne(
		{ _id: userId },
		{ $addToSet: { subbedChannels: channelId } }
	);
}

export async function getUser(userId: number) {
	await checkUserExists(userId);

	const user = await User.findById(userId).populate("subbedChannels").exec();

	return user;
}
export async function removeChannelFromUser(channelId: string, userId: number) {
	await checkUserExists(userId);

	await checkChannelExists(channelId);

	await User.update(
		{ _id: userId },
		// @ts-ignore
		{ $pull: { subbedChannels: channelId } }
	);
}

export async function createSpotifyPlaylist(
	userSpotifyId: string,
	userDbId: number
) {
	await checkUserExists(userDbId);

	// hit spotify api to create new playlist
	const newPlaylistId = await createUserPlaylist(userSpotifyId);

	// update user with new spotify playlist data
	await User.updateOne(
		{ _id: userDbId },
		{ hasPlaylist: true, spotifyPlaylistId: newPlaylistId }
	);
}
