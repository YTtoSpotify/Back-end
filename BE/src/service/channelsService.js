const Channel = require("../db/models/channelModel");

async function createChannel(channel) {
	try {
		if (!channel) throw { message: "Missing new channel data.", status: 400 };
		await new Channel(channel).save();
	} catch (err) {
		throw { message: err.message, status: 400 };
	}
}

module.exports = {
	createChannel,
};
