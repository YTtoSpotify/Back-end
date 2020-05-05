const router = require("express").Router();

router
	.route("/YtHubCallback")
	.all((req, res, next) => {
		next();
	})
	.get(async (req, res) => {
		try {
			return res
				.status(200)
				.send(req.query["hub.challenge"] || "no challenge");
		} catch (error) {
			console.log(error);
			return res.status(500).end();
		}
	}) // TODO get this damn route working
	.post(async (req, res) => {
		console.log("hit post callback");
		try {
			console.log(req.body.feed.entry[0]);
			return res.status(200).send("Post hit");
		} catch (error) {
			console.log(error);
			return res.status(500).end();
		}
	});

module.exports = router;
