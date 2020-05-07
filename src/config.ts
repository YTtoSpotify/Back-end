import { config } from "dotenv";
config();

const envConfig = {
	dbUri: process.env.MONGODB_URI as string,
	port: process.env.PORT,
};

export default envConfig;
