const Channel = require("../db/models/channelModel");
const { ErrorHandler } = require("../helpers/errorHelpers");

module.exports = { checkChannelExists, handlePaginationData };

async function checkChannelExists(channelId) {
	const idString = channelId.toString();

	if (idString.length !== 12 && idString.length !== 24)
		throw new ErrorHandler(400, "Invalid channel id.");

	if (!(await Channel.exists({ _id: idString })))
		throw new ErrorHandler(404, "Channel not found");
}

async function handlePaginationData(filterObject, page) {
	const channelsPerPage = 8;

	try {
		let channels = await Channel.find(filterObject)
			.skip(channelsPerPage * page - channelsPerPage)
			.limit(channelsPerPage)
			.sort("name");

		const numOfChannels = await Channel.countDocuments(filterObject);

		const totalPagesCount = Math.ceil(numOfChannels / channelsPerPage);

		return { channels, totalPagesCount, numOfChannels, currentPage: page };
	} catch (err) {
		throw err;
	}
}
