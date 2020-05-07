import { Document, Schema } from "mongoose";

export interface IUser extends Document {
	subbedChannels: Schema.Types.ObjectId[] | IChannel[];
	recentlySavedSongUris: string[];
	email: string;
	displayName: string;
	username: string;
	spotifyId: string;
	photo: string;
	spotifyPlaylistId: string;
	hasPlaylist: boolean;
	firstName: string;
	lastName: string;
}

export interface IChannel extends Document {}
