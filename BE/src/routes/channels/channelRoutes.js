const router = require("express").Router();
const {
	createChannel,
	getAllChannels,
} = require("../../service/channelsService.js");
const { serverErr } = require("../../helpers/utils.js");

router.post("/new", async (req, res) => {
	try {
		await createChannel(req.body.channel);
		return res.status(200).json({ message: "Channel created successfully." });
	} catch (err) {
		serverErr(err, res);
	}
});

router.get("", async (req, res) => {
	try {
		const channels = await getAllChannels();
		return res.status(200).json({ message: "Channels fetched", channels });
	} catch (err) {
		serverErr(err, res);
	}
});

router.delete();
module.exports = router;
