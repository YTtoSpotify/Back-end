import {
	IChannelSchema,
	IChannelModel,
} from "./../../interfaces/dbModelInterfaces";
import { Schema, model } from "mongoose";

const channelSchema = new Schema({
	name: { type: String, unique: true, required: true, index: true },
	img: { type: String, required: true },
	url: { type: String, required: true },
	ytId: { type: String, required: true, unique: true },
	latestUploadId: { type: String, default: "" },
});

const Channel = model<IChannelSchema, IChannelModel>("Channel", channelSchema);

export default Channel;
