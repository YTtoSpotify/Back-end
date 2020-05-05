module.exports = {
	isAuthenticated,
	handleSpotifyApiTokens,
	checkTokenExpiration,
	refreshSessionAccessToken,
	fetchActiveSessions,
};

const mongoose = require("mongoose");

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
			.update({ _id: sessionId }, { session: sessionString });
	} catch (err) {
		console.log(err);
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
		console.log(err);
		throw err;
	}
}
