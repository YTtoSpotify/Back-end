import { Schema, model } from "mongoose";
import { IUser } from "../../interfaces/dbModelInterfaces";

const userSchema: Schema = new Schema({
	subbedChannels: [{ type: [Schema.Types.ObjectId], ref: "Channel" }],
	email: { type: String, unique: true },
	displayName: String,
	username: String,
	spotifyId: String,
	photo: String,
	hasPlaylist: { type: Boolean, default: false },
	spotifyPlaylistId: { type: String, index: true },
	recentlySavedSongUris: [Schema.Types.String],
	firstName: String,
	lastName: String,
});

const User = model<IUser>("User", userSchema);

export default User;
