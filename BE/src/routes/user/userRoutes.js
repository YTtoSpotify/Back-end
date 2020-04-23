const router = require("express").Router();

const { addChannelToUser } = require("../../service/usersService");

const { isAuthenticated } = require("../../helpers/utils.js");

const { handleError } = require("../../helpers/errorHelpers");

router.put("/addChannel", isAuthenticated, async (req, res) => {
	try {
		const userId = req.user._id;
		const channelId = req.body.channelId;

		await addChannelToUser(channelId, userId);

		return res.status(200).json({ message: "Channel added!" });
	} catch (err) {
		handleError(err, res);
	}
});

module.exports = router;
