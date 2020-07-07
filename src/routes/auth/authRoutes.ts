import { AuthenticatedRequest } from "./../../interfaces/passportInterfaces";
import passport from "../../helpers/passport/passportConfig";
import { isAuthenticated } from "../../helpers/utils";
import config from "../../config";
import { Request, Response } from "express";

const router = require("express").Router();

const scope = [
	"user-read-private",
	"user-read-email",
	"playlist-modify-public",
	"playlist-modify-private",
];

router.get("/checkAuth", isAuthenticated, (req: Request, res: Response) => {
	return res.status(200).json({
		isAuthenticated: true,
	});
});

router.get(
	"/",
	passport.authenticate("spotify", {
		scope,
	}),
	(req: Request, res: Response) => {
		// this is never called because the middleware hands control over to spotify and spotify redirects to /callback
	}
);

router.get(
	"/callback",
	passport.authenticate("spotify", {
		failureRedirect: config.clientUrl,
		successRedirect: `${config.clientUrl}/authenticate`,
	}),
	(req: Request, res: Response) => {}
);

router.get("/profile", (req: AuthenticatedRequest, res: Response) => {
	return res.status(200).json({ user: req.user });
});

router.get("/logout", (req: AuthenticatedRequest, res: Response) => {
	req.logout();
	return res.status(200).end();
});

export default router;
