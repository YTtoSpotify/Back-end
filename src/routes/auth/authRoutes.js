require("dotenv").config();
const router = require("express").Router();
const passport = require("../../helpers/passport/passportConfig");
const { isAuthenticated } = require("../../helpers/utils");

const scope = [
	"user-read-private",
	"user-read-email",
	"playlist-modify-public",
	"playlist-modify-private",
];

router.get("/checkAuth", isAuthenticated, (req, res) => {
	return res.status(200).json({
		isAuthenticated: true,
	});
});

router.get(
	"/",
	passport.authenticate("spotify", {
		scope,
	}),
	(req, res) => {
		// this is never called because the middleware hands control over to spotify and spotify redirects to /callback
	}
);

router.get(
	"/callback",
	passport.authenticate("spotify", {
		failureRedirect: `${process.env.CLIENT_URL}/login`,
		successRedirect: `${process.env.CLIENT_URL}/authenticate`,
	}),
	(req, res) => {}
);

router.get("/profile", (req, res) => {
	return res.status(200).json({ user: req.user });
});

router.get("/logout", (req, res) => {
	req.logout();
	res.redirect(`${process.env.CLIENT_URL}/login`);
});

module.exports = router;
