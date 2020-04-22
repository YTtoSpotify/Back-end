module.exports = { serverErr };

function serverErr(err, res) {
	if (err.message && err.status) {
		return res.status(err.status).json({
			message: err.message,
		});
	} else {
		return res.status(500).json({
			message: "We screwed something up. We'll look into it.",
		});
	}
}
