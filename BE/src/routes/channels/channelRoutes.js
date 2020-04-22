const router = require("express").Router();
const { createChannel } = require("../../service/channelsService.js");
const { serverErr } = require("../../helpers/utils.js");

router.post("/new", async (req, res) => {
	try {
		await createChannel(req.body.channel);
		return res.status(200).json({ message: "Channel created successfully." });
	} catch (err) {
		serverErr(err, res);
	}
});

module.exports = router;
