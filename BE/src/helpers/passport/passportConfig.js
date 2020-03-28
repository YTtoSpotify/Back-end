const passport = require("passport");
const SpotifyStrategy = require("passport-spotify").Strategy;
require("dotenv").config();

const clientID = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const callbackURL = process.env.REDIRECT_URI;

// this converts whatever is passed into 'done' into a bytestream(raw bit data), to be rebuilt by the deserialization function
passport.serializeUser((user, done) => {
	done(null, user);
});

// this assigns req.user as whatever came through from the callback in serializeUser
passport.deserializeUser((user, done) => {
	done(null, user);
});

passport.use(
	new SpotifyStrategy(
		{ clientID, clientSecret, callbackURL },
		(accessToken, refreshToken, expiresIn, profile, done) => {
			const tokens = { accessToken, refreshToken };
			const returnData = { tokens, expiresIn, profile };
			return done(null, returnData);
		},
		{ failureMessage: true, successMessage: true }
	)
);

module.exports = passport;
