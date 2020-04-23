const Channel = require("../db/models/channelModel");

module.exports = {
	createChannel,
	getChannels,
	deleteChannel,
};

const { checkChannelExists } = require("../helpers/channelsServiceHelpers");
const { ErrorHandler } = require("../helpers/errorHelpers");

async function createChannel(channel) {
	try {
		if (!channel) throw new ErrorHandler(400, "Missing new channel data");
		await new Channel(channel).save();
	} catch (err) {
		throw err;
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

		const numOfChannels = await Channel.count({
			name: new RegExp(nameFilter, "i"),
		});

		const totalPagesCount = Math.ceil(numOfChannels / channelsPerPage);

		return { channels, totalPagesCount, numOfChannels };
	} catch (err) {
		throw new ErrorHandler(err.statusCode, err.statusText);
	}
}

async function deleteChannel(channelId) {
	try {
		await checkChannelExists(channelId);

		const channel = await Channel.findByIdAndDelete(channelId);

		return channel;
	} catch (err) {
		throw err;
	}
}
