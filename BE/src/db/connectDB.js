require("dotenv").config();
const config = require("./dbConfig");
const mongoose = require("mongoose");

const connectDb = async () => {
	try {
		await mongoose.connect(process.env.MONGODB_URI, config);
		console.log("DB listening");
	} catch (err) {
		console.log(err);
		throw err;
	}
};

module.exports = connectDb;
