const passport = require("passport");
const SpotifyStrategy = require("passport-spotify").Strategy;
require("dotenv").config();
const User = require("../../db/models/userModel");

const clientID = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const callbackURL = process.env.REDIRECT_URI;

// this converts whatever is passed into 'done' into a bytestream(raw bit data), to be rebuilt by the deserialization function
// also creates the sesssion with whatever we pass into done
passport.serializeUser(({ _id: id, accessToken, refreshToken }, done) => {
	done(null, { id, accessToken, refreshToken });
});

// this assigns req.user with whatever we pass through done
passport.deserializeUser(async ({ id, accessToken, refreshToken }, done) => {
	const user = await User.findById(id).lean().exec();
	done(null, { ...user, accessToken, refreshToken });
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

			const userNameArray = displayName.split(" ");
			const firstName = userNameArray[0];
			const lastName = userNameArray[userNameArray.length - 1];

			try {
				let user = await User.findOne({ spotifyId }).lean().exec();
				if (!user) {
					user = await new User({
						subbedChannels: [],
						email: emails[0].value,
						displayName,
						username,
						spotifyId,
						photo: photos[0],
						firstName,
						lastName,
					}).save();
				}
				return done(null, { ...user, accessToken, refreshToken });
			} catch (err) {
				return done(err, null);
			}
		}
	)
);

module.exports = passport;
