import { Document, Schema, Model, Types } from "mongoose";

export interface IUserSchema extends Document {
	subbedChannels: Types.Array<Schema.Types.ObjectId | IChannelSchema>;
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

export interface IUserModel extends Model<IUserSchema> {}

export interface IChannelSchema extends Document {
	name: string;
	img: string;
	url: string;
	ytId: string;
	latestUploadId: string;
}

export interface IChannelModel extends Model<IChannelSchema> {}

export interface NewChannel {}
