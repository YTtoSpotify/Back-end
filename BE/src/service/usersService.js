const User = require("../db/models/userModel");
const { checkChannelExists } = require("../helpers/channelsServiceHelpers");
const { checkUserExists } = require("../helpers/usersServiceHelpers");

module.exports = { addChannelToUser };

async function addChannelToUser(channelId, userId) {
	try {
		await checkUserExists(userId);

		await checkChannelExists(channelId);

		await User.update(
			{ _id: userId },
			{ $addToSet: { subbedChannels: channelId } }
		);
	} catch (err) {
		throw err;
	}
}
