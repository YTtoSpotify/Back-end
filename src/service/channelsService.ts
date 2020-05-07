import { NewChannel } from "./../interfaces/dbModelInterfaces";
import Channel from "../db/models/channelModel";
import {
	checkChannelExists,
	handlePaginationData,
} from "../helpers/channelsServiceHelpers";
const { ErrorHandler } = require("../helpers/errorHelpers");

export async function createChannel(channel: NewChannel) {
	try {
		if (!channel) throw new ErrorHandler(400, "Missing new channel data");
		await new Channel(channel).save();
	} catch (err) {
		throw err;
	}
}

export async function getAvailableChannels(
	page = 1,
	nameFilter = "",
	userChannelsIdArr: number[]
) {
	try {
		const userChannelIds = userChannelsIdArr.map((channel) => {
			return channel.toString();
		});

		const userChannelsSet = new Set(userChannelIds);

		const paginationData = await handlePaginationData(
			{
				name: new RegExp(nameFilter, "i"),
			},
			page
		);

		paginationData.channels = paginationData.channels.map((channel) => {
			const isUserSub = userChannelsSet.has(channel._id.toString());

			channel.isUserSub = isUserSub;
			return channel;
		});

		return paginationData;
	} catch (err) {
		throw err;
	}
}

export async function getUserChannels(
	page = 1,
	nameFilter = "",
	userChannelsIdArr: number[]
) {
	try {
		const paginationData = await handlePaginationData(
			{
				_id: { $in: [...userChannelsIdArr] },
				name: new RegExp(nameFilter, "i"),
			},
			page
		);

		paginationData.channels = paginationData.channels.map((channel) => {
			channel.isUserSub = true;
			return channel;
		});

		return paginationData;
	} catch (err) {
		throw err;
	}
}
export async function deleteChannel(channelId: string) {
	try {
		await checkChannelExists(channelId);

		const channel = await Channel.findByIdAndDelete(channelId);

		return channel;
	} catch (err) {
		throw err;
	}
}
