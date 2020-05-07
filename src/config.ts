import { config } from "dotenv";
config();

const envConfig = {
	dbUri: process.env.MONGODB_URI as string,
	port: process.env.PORT,
	clientID: process.env.CLIENT_ID as string,
	clientSecret: process.env.CLIENT_SECRET as string,
	callbackURL: process.env.REDIRECT_URI as string,
	cookieSecret: process.env.COOKIE_SECRET as string,
};

export default envConfig;
