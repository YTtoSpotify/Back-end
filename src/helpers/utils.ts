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
		throw new ErrorHandler(403, "User not logged in");
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
			console.log("refreshing token");
			const {
				body: { access_token, expires_in },
			} = await spotifyApi.refreshAccessToken();

			spotifyApi.setAccessToken(access_token);

			// change session access token
			req.session!.passport.user.accessToken = access_token;
			// change session expiration date
			const newExpirationDate = new Date(Date.now() + expires_in * 1000);
			req.session!.passport.user.tokenExpirationDate = newExpirationDate;
		}
		next();
	} catch (err) {
		console.log(err);
		throw err;
	}
}

export function isTokenExpired(tokenExpirationDate: string): boolean {
	const expirationDate = new Date(tokenExpirationDate);
	let isExpired = false;
	console.log(expirationDate.getTime() - Date.now());
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
		throw err;
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
		throw err;
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

export function isSongInSpotifyPlaylist(
	playlistTrackUriArray: string[],
	newTrackUri: string
) {
	// make set of track uids for O(1) checks
	const trackIdSet = new Set(playlistTrackUriArray);

	// return boolean indicating if track is already in playlist
	if (trackIdSet.has(newTrackUri)) {
		return true;
	} else {
		return false;
	}
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

		// validate that song is not in playlist already and song is not the previous latest upload
		// playlist check ensures if channels upload same song it is not added to the playlist twice

		if (
			!isSongInSpotifyPlaylist(songUris, songUri) &&
			!isSongInUserRecents(user.recentlySavedSongUris, songUri)
		) {
			// add song to playlist

			await spotifyApi.addTracksToPlaylist(user.spotifyPlaylistId, [
				songUri,
			]);
			addSongUriToRecents(songUri, user);
		}
	} catch (err) {
		throw err;
	}
}

export async function getLatestUploads(
	channels: IChannelSchema[]
): Promise<{ videoTitle: string; videoId: string; channelId: string }[]> {
	try {
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
	} catch (err) {
		throw err;
	}
}

async function addSongUriToRecents(songUri: string, user: IUserSchema) {
	try {
		const recentSongSet = new Set(user.recentlySavedSongUris);

		if (!recentSongSet.has(songUri)) {
			user.recentlySavedSongUris.push(songUri);
		}

		user.save();
	} catch (err) {
		throw err;
	}
}
