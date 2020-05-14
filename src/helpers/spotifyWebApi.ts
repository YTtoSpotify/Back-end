import SpotifyWebApi from "spotify-web-api-node";
import config from "../config";

const { clientID: clientId, clientSecret, redirectUri } = config;

const spotifyApi = new SpotifyWebApi({ clientId, clientSecret, redirectUri });

export default spotifyApi;
