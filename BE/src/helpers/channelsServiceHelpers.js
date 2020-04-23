const Channel = require("../db/models/channelModel");
const { ErrorHandler } = require("../helpers/errorHelpers");

module.exports = { checkChannelExists };

async function checkChannelExists(channelId) {
	const idString = channelId.toString();

	if (idString.length !== 12 && idString.length !== 24)
		throw new ErrorHandler(400, "Invalid channel id.");

	if (!(await Channel.exists({ _id: idString })))
		throw new ErrorHandler(404, "Channel not found");
}
