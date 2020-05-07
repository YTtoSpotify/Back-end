import session from "express-session";
import config from "../config";
const MongoStore = require("connect-mongo")(session);

const sessionConfig = {
	secret: config.cookieSecret,
	cookie: { maxAge: 3.154e10, httpOnly: false, secure: false },
	saveUninitialized: false,
	resave: false,
	name: "YT2Spotify",
	store: new MongoStore({
		url: config.dbUri,
		collection: "sessions",
	}),
};

// if ((process.env.ENV = "production")) config.cookie.secure = true;

module.exports = session(sessionConfig);
