module.exports = {
	isAuthenticated,
	handleSpotifyApiTokens,
	checkTokenExpiration,
	refreshSessionAccessToken,
	fetchActiveSessions,
	cleanVideoTitle,
	getLatestVideoFromXMLFeed,
	isSongInSpotifyPlaylist,
	addSongToUserPlaylist,
};

const convert = require("xml-js");

const mongoose = require("mongoose");
const Channel = require("../db/models/channelModel");

const { ErrorHandler } = require("./errorHelpers");
const spotifyApi = require("./spotifyWebApi");
function isAuthenticated(req, res, next) {
	if (req.isAuthenticated()) next();
	else {
		throw new ErrorHandler(403, "User not logged in");
	}
}

async function handleSpotifyApiTokens(req, res, next) {
	try {
		const { accessToken, refreshToken, tokenExpirationDate } = req.user;

		if (!spotifyApi.getAccessToken()) spotifyApi.setAccessToken(accessToken);
		if (!spotifyApi.getRefreshToken())
			spotifyApi.setRefreshToken(refreshToken);

		if (checkTokenExpiration(tokenExpirationDate)) {
			const {
				body: { access_token, expires_in },
			} = await spotifyApi.refreshAccessToken();

			spotifyApi.setAccessToken(access_token);

			// change session access token
			req.session.passport.user.accessToken = access_token;
			// change session expiration date
			const newExpirationDate = new Date(Date.now() + expires_in * 1000);
			req.session.passport.user.tokenExpirationDate = newExpirationDate;
		}
		next();
	} catch (err) {
		console.log(err);
		throw err;
	}
}

function checkTokenExpiration(tokenExpirationDate) {
	const expirationDate = new Date(tokenExpirationDate);

	let isExpired = false;
	if (expirationDate.getTime() - Date.now() <= 0) {
		isExpired = true;
	}

	return isExpired;
}

async function refreshSessionAccessToken(sessionId, tokenData) {
	try {
		// find session
		const session = await mongoose.connection
			.collection("sessions")
			.find({ _id: sessionId })
			.toArray();

		// parse json for easier manipulation
		const sessionData = JSON.parse(session[0].session);
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

async function fetchActiveSessions() {
	try {
		// fetch all active sessions
		const activeSessionDocsCursor = await mongoose.connection
			.collection("sessions")
			.find({});

		// convert to array
		const activeSessionsArray = await activeSessionDocsCursor.toArray();

		const activeSessionsDict = {};

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

function cleanVideoTitle(videoTitle) {
	// split video title at dash
	const noDashTitle = videoTitle.split("-");
	// strip whitespace and remove all parentheses and their enclosed text
	const cleanedTitles = noDashTitle.map((string, i) => {
		const cleanedTitle = string.replace(/\(([(Lyrics)\)]+)\)/g, "").trim();
		return cleanedTitle;
	});
	return cleanedTitles;
}

function getLatestVideoFromXMLFeed(channelXMLFeed) {
	// convert xml to js object
	const allXMLElements = convert.xml2js(channelXMLFeed.data).elements[0]
		.elements;

	// grab latest video uploaded from xml
	const latestVideo = allXMLElements.find((el) => {
		return el.name === "entry" && el.elements && el.elements.length === 9;
	});

	// destructure video id and title from nested elements in xml
	const { text: videoId } = latestVideo.elements[1].elements[0];
	const { text: videoTitle } = latestVideo.elements[3].elements[0];

	return { videoTitle, videoId };
}

function isSongInSpotifyPlaylist(playlistTrackUriArray, newTrackUri) {
	// make set of track uids for O(1) checks
	const trackIdSet = new Set(playlistTrackUriArray);

	// return boolean indicating if track is already in playlist
	if (trackIdSet.has(newTrackUri)) {
		return true;
	} else {
		return false;
	}
}

async function addSongToUserPlaylist(user, video, cache) {
	//get cleaned artist and song names
	const [artistName, songName] = cleanVideoTitle(video.videoTitle);

	// save key for cache item
	const cacheKey = `${songName} - ${artistName}`;

	let songUri = null;

	try {
		// if song not in cache
		if (!cache.get(cacheKey)) {
			const songQuery = `track: ${songName} artist: ${artistName}`;
			// fetch song from spotify
			const songs = await spotifyApi.searchTracks(songQuery, { limit: 1 });
			// get song object
			const spotifySong = songs.body.tracks.items[0];

			if (spotifySong) {
				// store in cache if spotify has the song
				cache.set(cacheKey, spotifySong.uri);

				songUri = spotifySong.uri;
			}
		} else {
			// get song uri from cache
			const cachedSongUri = cache.get(cacheKey);

			songUri = cachedSongUri;
		}

		const songDBChannel = await Channel.findById(video.channelId)
			.lean()
			.exec();
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
		// latest upload check ensures that songs don't get added again after bi-weekly playlist wipe
		if (
			!isSongInSpotifyPlaylist(songUris, songUri) &&
			!(songDBChannel.latestUploadId === video.videoId)
		) {
			// add song to playlist
			try {
				await spotifyApi.addTracksToPlaylist(user.spotifyPlaylistId, [
					songUri,
				]);
			} catch (err) {
				console.log(err);
			}
		}
	} catch (err) {
		throw err;
	}
}
