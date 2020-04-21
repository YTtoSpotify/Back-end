const passport = require("passport");
const SpotifyStrategy = require("passport-spotify").Strategy;
require("dotenv").config();
const User = require("../../db/models/userModel");

const clientID = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const callbackURL = process.env.REDIRECT_URI;

// this converts whatever is passed into 'done' into a bytestream(raw bit data), to be rebuilt by the deserialization function
// also creates the sesssion with whatever we pass into done
passport.serializeUser(({ id }, done) => {
	done(null, id);
});

// this assigns req.user with whatever we pass through done
passport.deserializeUser(async (id, done) => {
	const user = await User.findById(id);
	// need to find the actual user in mongo db here
	done(null, user);
});

const config = {
	clientID,
	clientSecret,
	callbackURL,
};

passport.use(
	new SpotifyStrategy(
		config,
		async (accessToken, refreshToken, expiresIn, profile, done) => {
			const {
				username,
				id: spotifyId,
				photos,
				emails,
				displayName,
			} = profile;

			try {
				let user = await User.findOne({ spotifyId });
				if (!user) {
					user = await new User({
						subbedChannels: [],
						email: emails[0].value,
						displayName,
						username,
						spotifyId,
						photo: photos[0],
					}).save();
				}
				return done(null, user);
			} catch (err) {
				return done(err, null);
				throw err;
			}
		}
	)
);

module.exports = passport;
