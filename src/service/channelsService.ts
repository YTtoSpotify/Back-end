import { NewChannel } from "./../interfaces/dbModelInterfaces";
import { default as axios } from "axios";
import { ErrorHandler } from "./../helpers/errorHelpers";
import Channel from "../db/models/channelModel";
import {
	checkChannelExists,
	handlePaginationData,
} from "../helpers/channelsServiceHelpers";
import { isValidYTUrl, getIdOrUsernameFromUrl } from "../helpers/utils";
import config from "../config";

interface YTChannelResponse {
	items?: {
		id: string;
		snippet: {
			title: string;
			thumbnails: {
				default: {
					url: string;
				};
			};
		};
		topicCategories: string[];
	}[];
}

export async function getAvailableChannels(
	page = 1,
	nameFilter = "",
	userChannelsIdArr: number[]
) {
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
}

export async function getUserChannels(
	page = 1,
	nameFilter = "",
	userChannelsIdArr: number[]
) {
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
}

export async function deleteChannel(channelId: string) {
	await checkChannelExists(channelId);

	const channel = await Channel.findByIdAndDelete(channelId);

	return channel;
}

export async function createChannel(channelUrl: string) {
	// check if url is valid
	if (!isValidYTUrl(channelUrl))
		throw new ErrorHandler(400, "Invalid channel URL");

	// extract id or username from url
	const searchTerm = getIdOrUsernameFromUrl(channelUrl);
	const searchQuery =
		searchTerm.type === "username"
			? `forUsername=${searchTerm.value}`
			: `id=${searchTerm.value}`;
	// fetch channel
	const channelData: YTChannelResponse = await axios.get(
		`https://www.googleapis.com/youtube/v3/channels?${searchQuery}&part=snippet&key=${config.youtubeAppKey}`
	);
	// check if channel exists
	if (!channelData.items)
		throw new ErrorHandler(404, "Channel does not exist");
	if (channelData.items) {
		// check if channel is a music channel
		const isMusicChannel = channelData.items[0].topicCategories.includes(
			"https://en.wikipedia.org/wiki/Music"
		);
		if (!isMusicChannel) {
			throw new ErrorHandler(400, "Channel is not a music channel");
		} else {
			const { snippet, id: ytId } = channelData.items[0];
			const newChannel: NewChannel = {
				name: snippet.title,
				img: snippet.thumbnails.default.url,
				url: channelUrl,
				ytId,
			};
			await new Channel(newChannel).save();
		}
	}
}

// TODO test successful creation of channels
