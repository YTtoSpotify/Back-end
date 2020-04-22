const Channel = require("../db/models/channelModel");

module.exports = {
	createChannel,
	getAllChannels,
	deleteChannel,
};

async function createChannel(channel) {
	try {
		if (!channel) throw { message: "Missing new channel data.", status: 400 };
		await new Channel(channel).save();
	} catch (err) {
		throw { message: err.message, status: 400 };
	}
}

async function getAllChannels() {
	try {
		const channels = await Channel.find();
		return channels;
	} catch (err) {
		throw { message: err.message, status: 404 };
	}
}

async function deleteChannel(channelId) {
	try {
		const channel = await Channel.findByIdAndDelete(channelId);

		if (!channel) throw { message: "Channel does not exist", status: 404 };

		return channel;
	} catch (err) {
		throw { message: err.message, status: 404 };
	}
}
