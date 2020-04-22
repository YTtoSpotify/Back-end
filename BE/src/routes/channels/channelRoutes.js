const router = require("express").Router();
const {
	createChannel,
	getChannels,
	deleteChannel,
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
	const page = parseInt(req.query.page) || 1;
	const nameFilter = req.query.nameFilter;

	try {
		const { channels, totalPagesCount, numOfChannels } = await getChannels(
			page,
			nameFilter
		);
		return res.status(200).json({
			channels,
			currentPage: page,
			pages: totalPagesCount,
			numOfChannels,
		});
	} catch (err) {
		serverErr(err, res);
	}
});

router.delete("/delete/:channelId", async (req, res) => {
	try {
		const channel = await deleteChannel(req.params.channelId);
		return res
			.status(200)
			.json({ message: `Channel ${channel.name} successfully deleted` });
	} catch (err) {
		serverErr(err, res);
	}
});

module.exports = router;
