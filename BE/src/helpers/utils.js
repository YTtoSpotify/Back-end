module.exports = { isAuthenticated, handleSpotifyApiTokens };

const { ErrorHandler } = require("./errorHelpers");
const spotifyApi = require("./spotifyWebApi");
function isAuthenticated(req, res, next) {
	if (req.isAuthenticated()) next();
	else {
		throw new ErrorHandler(403, "User not logged in");
	}
}

function handleSpotifyApiTokens(req, res, next) {
	const { accessToken, refreshToken } = req.user;

	if (!spotifyApi.getAccessToken()) spotifyApi.setAccessToken(accessToken);
	if (!spotifyApi.getRefreshToken()) spotifyApi.setRefreshToken(refreshToken);

	next();
}
