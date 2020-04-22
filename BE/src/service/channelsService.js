const Channel = require("../db/models/channelModel");

module.exports = {
	createChannel,
	getAllChannels,
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
		throw { message: err.message, status: 400 };
	}
}
