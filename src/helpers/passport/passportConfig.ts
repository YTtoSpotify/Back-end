const passport = require("passport");
const SpotifyStrategy = require("passport-spotify").Strategy;

import config from "../../config";
import User from "../../db/models/userModel";
const passportConfig = {
	clientID: config.clientID,
	clientSecret: config.clientSecret,
	callbackURL: config.callbackURL,
};

interface ISpotifyUserProfile {
	username: string;
	id: string;
	photos: string[];
	emails: { value: string }[];
	displayName: string;
}

interface IUserSession {
	_id: string;
	accessToken: string;
	refreshToken: string;
	tokenExpirationDate: string;
}
// this converts whatever is passed into 'done' into a bytestream(raw bit data), to be rebuilt by the deserialization function
// also creates the sesssion with whatever we pass into done
passport.serializeUser((sessionData: IUserSession, done: Function) => {
	const {
		_id: id,
		accessToken,
		refreshToken,
		tokenExpirationDate,
	} = sessionData;
	done(null, { id, accessToken, refreshToken, tokenExpirationDate });
});

// this assigns req.user with whatever we pass through done
passport.deserializeUser(async (sessionData: IUserSession, done: Function) => {
	const {
		_id: id,
		accessToken,
		refreshToken,
		tokenExpirationDate,
	} = sessionData;

	const user = await User.findById(id).lean().exec();

	done(null, { ...user, accessToken, refreshToken, tokenExpirationDate });
});

passport.use(
	new SpotifyStrategy(
		passportConfig,
		async (
			accessToken: string,
			refreshToken: string,
			expiresIn: number,
			profile: ISpotifyUserProfile,
			done: Function
		) => {
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
