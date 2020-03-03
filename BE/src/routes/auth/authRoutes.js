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
		failureRedirect: "http://localhost:3000",
		showDialog: true,
		display: "popup"
	}),
	(req, res) => {}
);

router.get(
	"/callback",
	passport.authenticate("spotify", { failureRedirect: "/authFail" }),
	(req, res) => {
		const tokenString = qs.stringify(req.user);
		console.log(req.user);

		res.redirect("checkAuth");
	}
);
module.exports = router;
