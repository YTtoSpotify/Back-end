import { IChannelSchema, IUserSchema } from "./../interfaces/dbModelInterfaces";
import {
	IDbSession,
	IParsedDbSession,
} from "./../interfaces/sessionInterfaces";
import { NextFunction } from "express";
import { AuthenticatedRequest } from "./../interfaces/passportInterfaces";

import convert from "xml-js";
import axios, { AxiosResponse } from "axios";
import { ErrorHandler } from "./errorHelpers";
import spotifyApi from "./spotifyWebApi";
import mongoose from "mongoose";
import NodeCache from "node-cache";

export function isAuthenticated(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
) {
	if (req.isAuthenticated()) next();
	else {
		next(new ErrorHandler(403, "User not logged in"));
	}
}

export async function handleSpotifyApiTokens(
	req: AuthenticatedRequest,
	res: Response,
	next: NextFunction
) {
	try {
		const { accessToken, refreshToken, tokenExpirationDate } = req.user;

		if (!spotifyApi.getAccessToken()) spotifyApi.setAccessToken(accessToken);

		if (!spotifyApi.getRefreshToken())
			spotifyApi.setRefreshToken(refreshToken);

		if (isTokenExpired(tokenExpirationDate)) {
			const {
				body: { access_token, expires_in },
			} = await spotifyApi.refreshAccessToken();

			spotifyApi.setAccessToken(access_token);

			await refreshSessionAccessToken(req.session!.id, {
				access_token,
				expires_in,
			});
		}
		next();
	} catch (err) {
		next(err);
	}
}

export function isTokenExpired(tokenExpirationDate: string): boolean {
	const expirationDate = new Date(tokenExpirationDate);
	let isExpired = false;

	if (expirationDate.getTime() - Date.now() <= 0) {
		isExpired = true;
	}

	return isExpired;
}

export async function refreshSessionAccessToken(
	sessionId: string,
	tokenData: {
		access_token: string;
		expires_in: number;
	}
) {
	try {
		// find session
		const session: IDbSession = (await mongoose.connection
			.collection("sessions")
			.findOne({ _id: sessionId })) as IDbSession;

		// parse json for easier manipulation
		const sessionData: IParsedDbSession = JSON.parse(session.session);
		sessionData.passport.user.accessToken = tokenData.access_token;
		sessionData.passport.user.tokenExpirationDate = new Date(
			Date.now() + tokenData.expires_in * 1000
		);

		// stringify data
		const sessionString = JSON.stringify(sessionData);

		// update session
		await mongoose.connection
			.collection("sessions")
			.updateOne({ _id: sessionId }, { $set: { session: sessionString } });
	} catch (err) {
		console.log("refreshSessionAccessToken", err);
	}
}

export async function fetchActiveSessions() {
	try {
		// fetch all active sessions
		const activeSessionDocsCursor = await mongoose.connection
			.collection("sessions")
			.find({});

		// convert to array
		const activeSessionsArray = (await activeSessionDocsCursor.toArray()) as IDbSession[];
		const activeSessionsDict: {
			[key: string]: {
				sessionId: string;
				id: string;
				accessToken: string;
				refreshToken: string;
				tokenExpirationDate: string;
			};
		} = {};

		activeSessionsArray.forEach(({ _id: sessionId, session }) => {
			const {
				passport: { user },
			} = JSON.parse(session);
			activeSessionsDict[user.id] = { sessionId, ...user };
		});

		return activeSessionsDict;
	} catch (err) {
		console.log("fetchActiveSessions", err);

		return null;
	}
}

export function cleanVideoTitle(videoTitle: string): string {
	// all values to remove
	const stringsToRemove = new Set([
		"\\(",
		"\\)",
		"&",
		"ft.",
		"feat.",
		",",
		"-",
		"lyrics",
		"stripped down version",
		"official music video",
	]);

	let regexReplaceString = "";

	stringsToRemove.forEach((string) => {
		regexReplaceString += `${string}|`;
	});

	const stripRegex = new RegExp(regexReplaceString, "gi");

	const cleanedTitleString = videoTitle.replace(stripRegex, "");

	return cleanedTitleString;
}

export function getLatestVideoFromXMLFeed(
	channelXMLFeed: AxiosResponse
): { videoTitle: string; videoId: string } {
	// convert xml to js object
	const allXMLElements: convert.Element[] = convert.xml2js(channelXMLFeed.data)
		.elements[0].elements;

	// grab latest video uploaded from xml
	const latestVideo = allXMLElements.find((el: convert.Element) => {
		return el.name === "entry" && el.elements && el.elements.length === 9;
	});

	// destructure video id and title from nested elements in xml
	// @ts-ignore
	const { text: videoId } = latestVideo.elements[1].elements[0];
	// @ts-ignore
	const { text: videoTitle } = latestVideo.elements[3].elements[0];

	return {
		videoTitle: videoTitle as string,
		videoId: videoId as string,
	};
}

export function isSongInUserRecents(
	userRecentsList: string[],
	songUri: string
) {
	return userRecentsList.includes(songUri);
}

export async function addSongToUserPlaylist(
	user: IUserSchema,
	video: { videoTitle: string; videoId: string; channelId: string },
	cache: NodeCache
) {
	//get cleaned artist and song names
	const cleanedTitle = cleanVideoTitle(video.videoTitle);

	// save key for cache item
	const cacheKey = cleanedTitle;

	let songUri: string = "";

	try {
		// if song not in cache
		if (!cache.get(cacheKey)) {
			// fetch song from spotify

			const songs = await spotifyApi.searchTracks(cleanedTitle, {
				limit: 1,
			});
			// get song object
			const spotifySong = songs!.body!.tracks!.items[0] || undefined;

			if (!spotifySong)
				console.log(`************** Could not find song ${cleanedTitle}`);
			if (spotifySong) {
				// store in cache if spotify has the song
				cache.set(cacheKey, spotifySong.uri);

				songUri = spotifySong.uri;
			}
		} else {
			// get song uri from cache
			const cachedSongUri: string = cache.get(cacheKey) as string;

			songUri = cachedSongUri;
		}

		// fetch songs in user playlist
		const {
			body: { items },
		} = await spotifyApi.getPlaylistTracks(user.spotifyPlaylistId);

		// get uris of all songs in user playlist
		const songUris = items.map((trackObject) => {
			return trackObject.track.uri;
		});

		// validate that song has not been added to user playlist recently

		if (
			!isSongInUserRecents(user.recentlySavedSongUris, songUri) &&
			songUri
		) {
			// add song to playlist
			await spotifyApi.addTracksToPlaylist(user.spotifyPlaylistId, [
				songUri,
			]);
			await addSongUriToRecents(songUri, user);
		}
	} catch (err) {
		console.log("addSongToUserPlaylist", err);
	}
}

export async function getLatestUploads(
	channels: IChannelSchema[]
): Promise<{ videoTitle: string; videoId: string; channelId: string }[]> {
	// get xml data for each channel's latest video
	const latestVideosData = await Promise.all(
		await channels.map(async (channel) => {
			// get feed xml from youtube channel xml feed
			const page = await axios.get(
				`https://www.youtube.com/feeds/videos.xml?channel_id=${channel.ytId}`
			);

			// get title and id of most recent upload
			const { videoTitle, videoId } = getLatestVideoFromXMLFeed(page);

			return {
				videoTitle,
				videoId,
				channelId: channel._id,
			};
		})
	);

	return latestVideosData;
}

async function addSongUriToRecents(songUri: string, user: IUserSchema) {
	try {
		const recentSongSet = new Set(user.recentlySavedSongUris);

		if (!recentSongSet.has(songUri)) {
			user.recentlySavedSongUris.push(songUri);
		}

		user.save();
	} catch (err) {
		console.log("addSongUriToRecents", err);
	}
}

export async function clearUserPlaylist(user: IUserSchema) {
	try {
		// unfollow/delete playlist
		const unfollowResult = await spotifyApi.unfollowPlaylist(
			user.spotifyPlaylistId
		);

		const newPlaylistId = await createUserPlaylist(user.spotifyId);

		user.spotifyPlaylistId = newPlaylistId;

		await user.save();
	} catch (err) {
		console.log("clearUserPlaylist", err);
	}
}

export async function createUserPlaylist(
	userSpotifyId: string
): Promise<string> {
	const today = new Date();
	const tomorrow = new Date(today);
	tomorrow.setDate(today.getDate() + 1);

	const newPlaylistData = await spotifyApi.createPlaylist(
		userSpotifyId,
		`Daily Drop: ${tomorrow.toLocaleDateString()}`,
		{
			public: false,
			description:
				"Playlist generated by YT-To-Spotify - discover your favorite new songs, the easy way.",
		}
	);

	return newPlaylistData.body.id;
}

export function isValidYTUrl(url: string): boolean {
	const urlRe = new RegExp(
		"((http|https)://|)(www.|)youtube.com/(channel/|user/)[a-zA-Z0-9-]{1,}",
		"gi"
	);
	const isValid = urlRe.test(url);
	return isValid ? true : false;
}

export function getIdOrUsernameFromUrl(
	url: string
): { type: "username" | "id"; value: string } {
	const splitUrl = url.split("/");

	const searchValue = splitUrl[splitUrl.length - 1];

	if (url.includes("user")) {
		return { type: "username", value: searchValue };
	} else {
		return { type: "id", value: searchValue };
	}
}
