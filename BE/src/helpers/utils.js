module.exports = { isAuthenticated, handleSpotifyApiTokens };

const { ErrorHandler } = require("./errorHelpers");
const spotifyApi = require("./spotifyWebApi");
function isAuthenticated(req, res, next) {
	if (req.isAuthenticated()) next();
	else {
		throw new ErrorHandler(403, "User not logged in");
	}
}

async function handleSpotifyApiTokens(req, res, next) {
	const { accessToken, refreshToken, tokenExpirationDate } = req.user;

	if (!spotifyApi.getAccessToken()) spotifyApi.setAccessToken(accessToken);
	if (!spotifyApi.getRefreshToken()) spotifyApi.setRefreshToken(refreshToken);

	const expirationDate = new Date(tokenExpirationDate);

	if (expirationDate.getTime() - Date.now() <= 0) {
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
}
