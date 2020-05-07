import mongoose from "mongoose";
import config from "../config";

mongoose.set("useNewUrlParser", true);
mongoose.set("useUnifiedTopology", true);
mongoose.set("useCreateIndex", true);

const connectDb = async () => {
	try {
		await mongoose.connect(config.dbUri, (err) => {
			console.log("DB connected");
		});
	} catch (err) {
		console.log(err);
		throw err;
	}
};

export default connectDb;
