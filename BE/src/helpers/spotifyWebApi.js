require("dotenv").config();
const SpotifyWebApi = require("spotify-web-api-node");

const {
	CLIENT_ID: clientId,
	CLIENT_SECRET: clientSecret,
	REDIRECT_URI: redirectUri,
} = process.env;

const spotifyApi = new SpotifyWebApi({ clientId, clientSecret, redirectUri });

module.exports = spotifyApi;
