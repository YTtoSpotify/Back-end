require("dotenv").config();
const router = require("express").Router();
const passport = require("../../helpers/passport/passportConfig");

const scope = [
	"user-read-private",
	"user-read-email",
	"playlist-modify-public",
	"playlist-modify-private",
];

const isAuthenticated = (req, res, next) => {
	if (req.isAuthenticated()) next();
	else {
		return res.status(403).json({ isAuthenticated: false });
	}
};

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
		failureRedirect: "http://localhost:4200/login",
		successRedirect: "http://localhost:4200/authenticate",
	}),
	(req, res) => {}
);

router.get("/profile", (req, res) => {
	return res.status(200).json({ user: req.user });
});

router.get("/logout", (req, res) => {
	req.logout();
	res.redirect("http://localhost:4200/login");
});

module.exports = router;
