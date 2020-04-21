const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
	subbedChannels: Array,
	email: String,
	displayName: String,
	username: String,
	spotifyId: String,
	photo: String,
});

const User = mongoose.model("user", userSchema);

module.exports = User;
