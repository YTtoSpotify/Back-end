const mongoose = require("mongoose");

const channelSchema = mongoose.Schema({
	name: { type: String, unique: true, required: true, index: true },
	img: { type: String, required: true },
	url: { type: String, required: true },
	ytId: { type: String, required: true },
	latestUploadId: { type: String, default: "" },
});

const Channel = mongoose.model("Channel", channelSchema);

module.exports = Channel;
