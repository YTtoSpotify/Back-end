const mongoose = require("mongoose");

const channelSchema = mongoose.Schema({
	name: String,
	img: String,
	url: String,
	ytId: String,
});

const Channel = mongoose.model("Channel", channelSchema);

module.exports = Channel;
