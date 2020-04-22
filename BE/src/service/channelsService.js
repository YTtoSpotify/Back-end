const Channel = require("../db/models/channelModel");

module.exports = {
	createChannel,
	getChannels,
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

async function getChannels(page = 1, nameFilter = false) {
	const channelsPerPage = 8;

	try {
		let channels;

		if (nameFilter) {
			channels = await Channel.find({
				name: new RegExp(nameFilter, "i"),
			})
				.skip(channelsPerPage * page - channelsPerPage)
				.limit(channelsPerPage);
		} else {
			channels = await Channel.find()
				.skip(channelsPerPage * page - channelsPerPage)
				.limit(channelsPerPage)
				.sort("name");
		}

		const numOfChannels = await Channel.count();

		const totalPagesCount = Math.ceil(numOfChannels / channelsPerPage);

		return { channels, totalPagesCount, numOfChannels };
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
