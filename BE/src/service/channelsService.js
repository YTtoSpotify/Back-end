const Channel = require("../db/models/channelModel");
module.exports = {
	createChannel,
	getChannels,
	getUserChannels,
	deleteChannel,
};

const {
	checkChannelExists,
	handlePaginationData,
} = require("../helpers/channelsServiceHelpers");
const { ErrorHandler } = require("../helpers/errorHelpers");

async function createChannel(channel) {
	try {
		if (!channel) throw new ErrorHandler(400, "Missing new channel data");
		await new Channel(channel).save();
	} catch (err) {
		throw err;
	}
}

async function getChannels(page = 1, nameFilter = "") {
	try {
		const paginationData = await handlePaginationData(
			{
				name: new RegExp(nameFilter, "i"),
			},
			page
		);
		return paginationData;
	} catch (err) {
		throw new ErrorHandler(err.statusCode, err.statusText);
	}
}

async function getUserChannels(page = 1, nameFilter = "", userChannelsArr) {
	try {
		const paginationData = await handlePaginationData(
			{
				_id: { $in: [...userChannelsArr] },
				name: new RegExp(nameFilter, "i"),
			},
			page
		);
		return paginationData;
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
