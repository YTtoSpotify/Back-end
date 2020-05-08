import { IClientChannel } from "./../interfaces/clientInterfaces";
import Channel from "../db/models/channelModel";
import { ErrorHandler } from "../helpers/errorHelpers";

export async function checkChannelExists(channelId: string) {
	const idString = channelId.toString();

	if (idString.length !== 12 && idString.length !== 24)
		throw new ErrorHandler(400, "Invalid channel id.");

	if (!(await Channel.exists({ _id: idString })))
		throw new ErrorHandler(404, "Channel not found");
}

export async function handlePaginationData(filterObject: object, page: number) {
	const channelsPerPage = 8;

	try {
		let channels = (await Channel.find(filterObject)
			.skip(channelsPerPage * page - channelsPerPage)
			.limit(channelsPerPage)
			.sort("name")
			.lean()
			.exec()) as IClientChannel[];

		const numOfChannels = await Channel.countDocuments(filterObject);

		const totalPagesCount = Math.ceil(numOfChannels / channelsPerPage);

		return { channels, totalPagesCount, numOfChannels, currentPage: page };
	} catch (err) {
		throw err;
	}
}
