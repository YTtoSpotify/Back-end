const mongoose = require("mongoose");

const channelSchema = mongoose.Schema({
	name: { type: String, unique: true, required: true },
	img: { type: String, required: true },
	url: { type: String, required: true },
	ytId: { type: String, required: true },
});

const Channel = mongoose.model("Channel", channelSchema);

module.exports = Channel;
