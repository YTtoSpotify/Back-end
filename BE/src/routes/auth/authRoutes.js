require("dotenv").config();
const qs = require("query-string");
const router = require("express").Router();
const passport = require("../../helpers/passport/passportConfig");

const scope = [
	"user-read-private",
	"user-read-email",
	"playlist-modify-public",
	"playlist-modify-private"
];

const isAuthenticated = (req, res, next) => {
	if (req.isAuthenticated) return next();
	else {
		return res
			.status(403)
			.json({ isLoggedIn: false })
			.redirect("http://localhost:4200");
	}
};

router.get("/checkAuth", isAuthenticated, (req, res) => {
	res.status(200).json({
		isLoggedIn: true
	});
});

router.get(
	"/",
	passport.authenticate("spotify", {
		scope,
		showDialog: true,
		display: "popup"
	}),
	(req, res) => {
		// this is never called because the middleware hands control over to spotify and spotify redirects to /callback
	}
);

router.get(
	"/callback",
	passport.authenticate("spotify", { failureRedirect: "/" }),
	(req, res) => {
		const tokenString = qs.stringify(req.user.tokens);

		res.redirect(`http://localhost:4200/login?${tokenString}`);
	}
);

router.get("/logout", (req, res) => {
	req.logout();
	res.redirect("http://localhost:4200");
});
module.exports = router;
