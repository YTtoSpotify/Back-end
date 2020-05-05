const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
	subbedChannels: [{ type: [mongoose.Schema.Types.ObjectId], ref: "Channel" }],
	email: String,
	displayName: String,
	username: String,
	spotifyId: String,
	photo: String,
	hasPlaylist: { type: Boolean, default: false },
	spotifyPlaylistId: { type: String, index: true },
	firstName: String,
	lastName: String,
});

userSchema.index(
	{ "subbedChannels.1": 1 },
	{ partialFilterExpression: { "subbedChannels.1": { $exists: true } } }
);
const User = mongoose.model("User", userSchema);

module.exports = User;
