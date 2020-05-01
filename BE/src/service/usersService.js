const User = require("../db/models/userModel");
const { checkChannelExists } = require("../helpers/channelsServiceHelpers");
const spotifyApi = require("../helpers/spotifyWebApi");
const { checkUserExists } = require("../helpers/usersServiceHelpers");
module.exports = {
	addChannelToUser,
	removeChannelFromUser,
	getUser,
	createSpotifyPlaylist,
};

async function addChannelToUser(channelId, userId) {
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

async function getUser(userId) {
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
async function removeChannelFromUser(channelId, userId) {
	try {
		await checkUserExists(userId);

		await checkChannelExists(channelId);

		await User.update(
			{ _id: userId },
			{ $pull: { subbedChannels: channelId } }
		);
	} catch (err) {
		throw err;
	}
}

async function createSpotifyPlaylist(playlistName, userSpotifyId, userDbId) {
	try {
		await checkUserExists(userDbId);

		// hit spotify api to create new playlist
		const newPlaylistData = await spotifyApi.createPlaylist(
			userSpotifyId,
			playlistName,
			{ public: false }
		);

		// update user with new spotify playlist data
		await User.updateOne(
			{ _id: userDbId },
			{ hasPlaylist: true, spotifyPlaylistId: newPlaylistData.body.id }
		);
	} catch (err) {
		console.log(err);
		throw err;
	}
}
