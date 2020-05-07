const router = require("express").Router();
import {
	getAvailableChannels,
	getUserChannels,
} from "../../service/channelsService";

import { Request, Response } from "express";
import { AuthenticatedRequest } from "../../interfaces/passportInterfaces";
const { isAuthenticated } = require("../../helpers/utils.js");
const { handleError } = require("../../helpers/errorHelpers");

router.get(
	"",
	isAuthenticated,
	async (req: AuthenticatedRequest, res: Response) => {
		const page = parseInt(req.query.page as string) || 1;
		const nameFilter = req.query.nameFilter as string;

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
			return handleError(err, res);
		}
	}
);

router.get(
	"/userChannels",
	isAuthenticated,
	async (req: AuthenticatedRequest, res: Response) => {
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
			return handleError(err, res);
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

module.exports = router;
