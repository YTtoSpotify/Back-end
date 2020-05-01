const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
	subbedChannels: [{ type: [mongoose.Schema.Types.ObjectId], ref: "Channel" }],
	email: String,
	displayName: String,
	username: String,
	spotifyId: String,
	photo: String,
	hasPlaylist: { type: Boolean, default: false },
	spotifyPlaylistId: String,
	firstName: String,
	lastName: String,
});

const User = mongoose.model("User", userSchema);

module.exports = User;
