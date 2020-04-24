const router = require("express").Router();
const {
	getChannels,
	getUserChannels,
} = require("../../service/channelsService.js");
const { isAuthenticated } = require("../../helpers/utils.js");
const { handleError } = require("../../helpers/errorHelpers");

router.get("", isAuthenticated, async (req, res) => {
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
		handleError(err, res);
	}
});

router.get("/userChannels", isAuthenticated, async (req, res) => {
	const page = parseInt(req.query.page) || 1;
	const nameFilter = req.query.nameFilter;

	try {
		const {
			channels,
			totalPagesCount,
			numOfChannels,
		} = await getUserChannels(page, nameFilter, req.user.subbedChannels);

		return res.status(200).json({
			channels,
			currentPage: page,
			pages: totalPagesCount,
			numOfChannels,
		});
	} catch (err) {
		handleError(err, res);
	}
});

// Either add a guard to this or remove it and just add items manually in DB
// router.post("/new", async (req, res) => {
// 	try {
// 		await createChannel(req.body.channel);
// 		return res.status(200).json({ message: "Channel created successfully." });
// 	} catch (err) {
// 		handleError(err, res);
// 	}
// });
// Either add a guard to this or remove it and just add items manually in DB
// router.delete("/delete/:channelId", async (req, res) => {
// 	try {
// 		const channel = await deleteChannel(req.params.channelId);
// 		return res
// 			.status(200)
// 			.json({ message: `Channel ${channel.name} successfully deleted` });
// 	} catch (err) {
// 		handleError(err, res);
// 	}
// });

module.exports = router;
