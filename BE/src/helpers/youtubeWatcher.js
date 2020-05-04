const YouTubeWatch = require("youtube-watch");
require("dotenv").config();

const yw = new YouTubeWatch({
	secretKey: process.env.PUBHUBSECRET,
	hubCallback: process.env.PUBHUBCALLBACK,
});

module.exports = yw;
