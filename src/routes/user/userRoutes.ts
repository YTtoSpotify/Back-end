import { AuthenticatedRequest } from "./../../interfaces/passportInterfaces";
import { Response, NextFunction } from "express";
const router = require("express").Router();

import { isAuthenticated, handleSpotifyApiTokens } from "../../helpers/utils";
import { handleError } from "../../helpers/errorHelpers";
import {
	getUser,
	addChannelToUser,
	createSpotifyPlaylist,
	removeChannelFromUser,
} from "../../service/usersService";

router.get(
	"",
	isAuthenticated,
	async (req: AuthenticatedRequest, res: Response) => {
		try {
			const userId = req.user._id;

			const user = await getUser(userId);

			return res.status(200).json(user);
		} catch (err) {
			return handleError(err, res);
		}
	}
);

router.put(
	"/addChannel/:channelId",
	[isAuthenticated],
	async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			const userId = req.user._id;
			const channelId = req.params.channelId;

			await addChannelToUser(channelId, userId);

			return res.status(200).json({ message: "Channel added!" });
		} catch (err) {
			return next(err);
		}
	}
);

router.post(
	"/createSpotifyPlaylist",
	[isAuthenticated, handleSpotifyApiTokens],
	async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			await createSpotifyPlaylist(req.user.spotifyId, req.user._id);

			return res.status(200).json({ message: "Spotify playlist created!" });
		} catch (err) {
			return next(err);
		}
	}
);

router.delete(
	"/deleteChannel/:channelId",
	isAuthenticated,
	async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		try {
			const userId = req.user._id;
			const channelId = req.params.channelId;

			await removeChannelFromUser(channelId, userId);

			return res.status(204).end();
		} catch (err) {
			return next(err);
		}
	}
);

export default router;
