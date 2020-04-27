const User = require("../db/models/userModel");
const { checkChannelExists } = require("../helpers/channelsServiceHelpers");
const { checkUserExists } = require("../helpers/usersServiceHelpers");

module.exports = { addChannelToUser, removeChannelFromUser, getUser };

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
