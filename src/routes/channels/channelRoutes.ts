const router = require("express").Router();
import {
	getAvailableChannels,
	getUserChannels,
	createChannel,
} from "../../service/channelsService";

import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../interfaces/passportInterfaces";
import { isAuthenticated } from "../../helpers/utils";
import { ErrorHandler } from "../../helpers/errorHelpers";
import scrapeChannels from "../../helpers/youtubeWatcher";
import config from "../../config";
import { addChannelToUser } from "../../service/usersService";
router.get(
	"",
	isAuthenticated,
	async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		let page = parseInt(req.query.page as string) || 1;
		const nameFilter = req.query.nameFilter as string;

		if (nameFilter) page = 1;

		try {
			const paginationData = await getAvailableChannels(
				page,
				nameFilter,
				req.user.subbedChannels
			);
			return res.status(200).json({
				...paginationData,
			});
		} catch (err) {
			return next(err);
		}
	}
);

router.get(
	"/userChannels",
	isAuthenticated,
	async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		const page = parseInt(req.query.page as string) || 1;
		const nameFilter = req.query.nameFilter as string;

		try {
			const paginationData = await getUserChannels(
				page,
				nameFilter,
				req.user.subbedChannels
			);

			return res.status(200).json({
				...paginationData,
			});
		} catch (err) {
			return next(err);
		}
	}
);
router.get(
	"/scrape",
	async (req: Request, res: Response, next: NextFunction) => {
		//@ts-ignore
		const host = req.headers["user-agent"];

		try {
			// deny request if not from authorized origin
			if (!host?.includes(config.authorizedRequestHost)) {
				throw new ErrorHandler(401, "Unauthorized request origin");
			}
			// scrape channels for new songs
			await scrapeChannels();
			return res.status(200).json({ message: "Ran channel scrape" });
		} catch (err) {
			return next(err);
		}
	}
);

router.post(
	"/createChannel",
	isAuthenticated,
	async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		const channelUrl = req.body.channelUrl;

		try {
			const channelData = await createChannel(channelUrl);

			await addChannelToUser(channelData!.id, req.user._id);
			const paginationData = await getAvailableChannels(
				1,
				"",
				req.user.subbedChannels
			);

			return res.status(200).json(paginationData);
		} catch (err) {
			return next(err);
		}
	}
);

// Either add a guard to this or remove it and just add items manually in DB
// router.delete("/delete/:channelId", async (req, res) => {
// 	try {
// 		const channel = await deleteChannel(req.params.channelId);
// 		return res
// 			.status(200)
// 			.json({ message: `Channel ${channel.name} successfully deleted` });
// 	} catch (err) {
// 		handleError(err, res);
// 	}
// });

export default router;
