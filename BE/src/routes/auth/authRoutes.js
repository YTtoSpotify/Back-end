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
		return res.status(401).json({ error: "Unauthenticated" });
	}
};

router.get("/checkAuth", isAuthenticated, (req, res) => {
	res.status(200).json({
		status: "Login Successful"
	});
});

router.get(
	"/",
	passport.authenticate("spotify", {
		scope,
		showDialog: true,
		display: "popup"
	}),
	(req, res) => {}
);

router.get("/callback", passport.authenticate("spotify", {}), (req, res) => {
	const tokenString = qs.stringify(req.user.tokens);

	res.redirect(`http://localhost:4200/login?${tokenString}`);
});
module.exports = router;
