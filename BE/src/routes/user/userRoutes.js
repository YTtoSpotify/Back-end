const router = require("express").Router();

const {
	addChannelToUser,
	removeChannelFromUser,
	getUser,
} = require("../../service/usersService");

const { isAuthenticated } = require("../../helpers/utils.js");

const { handleError } = require("../../helpers/errorHelpers");

router.get("", isAuthenticated, async (req, res) => {
	try {
		const userId = req.user._id;

		const user = await getUser(userId);

		return res.status(200).json(user);
	} catch (err) {
		handleError(err, res);
	}
});

router.put("/addChannel/:channelId", isAuthenticated, async (req, res) => {
	try {
		const userId = req.user._id;
		const channelId = req.params.channelId;

		await addChannelToUser(channelId, userId);

		return res.status(200).json({ message: "Channel added!" });
	} catch (err) {
		handleError(err, res);
	}
});

router.delete(
	"/deleteChannel/:channelId",
	isAuthenticated,
	async (req, res) => {
		try {
			const userId = req.user.id;
			const channelId = req.params.channelId;

			await removeChannelFromUser(channelId, userId);

			return res.status(204).end();
		} catch (err) {
			handleError(err, res);
		}
	}
);

module.exports = router;
