import { config } from "dotenv";
config();

const envConfig = {
	dbUri: process.env.MONGODB_URI as string,
	port: process.env.PORT,
	clientID: process.env.CLIENT_ID as string,
	clientSecret: process.env.CLIENT_SECRET as string,
	callbackURL: process.env.REDIRECT_URI as string,
	cookieSecret: process.env.COOKIE_SECRET as string,
	redirectUri: process.env.REDIRECT_URI as string,
	clientUrl: process.env.CLIENT_URL as string,
	youtubeAppKey: process.env.YT_APP_KEY as string,
	authorizedRequestHost: process.env.AUTHORIZED_HOST_STRING as string,
};

export default envConfig;
