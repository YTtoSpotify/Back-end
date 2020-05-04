const YouTubeWatch = require("youtube-watch");
require("dotenv").config();

const yw = new YouTubeWatch({
	secretKey: process.env.PUBHUBSECRET,
	hubCallback: process.env.PUBHUBCALLBACK,
	hubPort: 5050,
});

module.exports = yw;
