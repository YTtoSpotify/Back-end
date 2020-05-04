const passport = require("passport");
const SpotifyStrategy = require("passport-spotify").Strategy;
require("dotenv").config();
const User = require("../../db/models/userModel");
const spotifyApi = require("../spotifyWebApi");

const clientID = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const callbackURL = process.env.REDIRECT_URI;

// this converts whatever is passed into 'done' into a bytestream(raw bit data), to be rebuilt by the deserialization function
// also creates the sesssion with whatever we pass into done
passport.serializeUser(
	({ _id: id, accessToken, refreshToken, tokenExpirationDate }, done) => {
		done(null, { id, accessToken, refreshToken, tokenExpirationDate });
	}
);

// this assigns req.user with whatever we pass through done
passport.deserializeUser(
	async ({ id, accessToken, refreshToken, tokenExpirationDate }, done) => {
		const user = await User.findById(id).lean().exec();

		done(null, { ...user, accessToken, refreshToken, tokenExpirationDate });
	}
);

const config = {
	clientID,
	clientSecret,
	callbackURL,
};

passport.use(
	new SpotifyStrategy(
		config,
		async (accessToken, refreshToken, expiresIn, profile, done) => {
			// grab data from profile for DB users
			const {
				username,
				id: spotifyId,
				photos,
				emails,
				displayName,
			} = profile;

			// create first and last names for DB user
			const userNameArray = displayName.split(" ");
			const firstName = userNameArray[0];
			const lastName = userNameArray[userNameArray.length - 1];

			// assign token expiration date(60 minutes)
			const tokenExpirationDate = new Date(Date.now() + expiresIn * 1000);

			try {
				// check if user exists
				let user = await User.findOne({ spotifyId }).lean().exec();

				// create user if not
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

				return done(null, {
					...user,
					accessToken,
					refreshToken,
					tokenExpirationDate,
				});
			} catch (err) {
				return done(err, null);
			}
		}
	)
);

module.exports = passport;
