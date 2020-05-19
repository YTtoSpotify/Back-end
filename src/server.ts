import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import config from "./config";
import connectDb from "./db/connectDB";
import authRouter from "./routes/auth/authRoutes";
import channelRouter from "./routes/channels/channelRoutes";
import userRouter from "./routes/user/userRoutes";

import { handleError, ErrorHandler } from "./helpers/errorHelpers";
import xmlParser from "express-xml-bodyparser";
import sessionInstance from "./helpers/sessionCreate";
import scrapeChannels from "./helpers/youtubeWatcher";
import passport from "./helpers/passport/passportConfig";
const app = express();

// mongoDB initial connection
connectDb();

// Session connection with MongoDB database
app.use(sessionInstance);

// Init passport and passport sessions
app.use(passport.initialize());
app.use(passport.session());

app.use(express.json());
app.use(xmlParser());

app.use(cors({ credentials: true, origin: "http://localhost:4200" }));

// ROUTES
app.use("/api/auth", authRouter);
app.use("/api/channels", channelRouter);
app.use("/api/user", userRouter);
app.get("/api/scrape", (req: Request, res: Response, next: NextFunction) => {
	const host = req.hostname;
	console.log(host);
	return res.status(200).json({ message: "Success" });
});

//GLOBAL MIDDLEWARE

// Error handling for routes
app.use(
	(err: ErrorHandler, req: Request, res: Response, next: NextFunction) => {
		handleError(err, res);
	}
);

process.on("unhandledRejection", (err) => {
	console.log(err);
});
const port = config.port || 5000;

// run scraper at 10 PM, every day
const now = new Date();
let millisTill10 =
	new Date(
		now.getFullYear(),
		now.getMonth(),
		now.getDate(),
		22,
		0,
		0,
		0
	).getTime() - now.getTime();
if (millisTill10 < 0) {
	// it's after 10pm, try 10pm tomorrow.
	millisTill10 += 86400000;
}

setInterval(() => {
	try {
		scrapeChannels();
	} catch (err) {
		console.log(err);
	}
}, millisTill10);

app.get("/", (req, res) => {
	res.status(200).json({ message: `Server running on port ${port}` });
});

app.listen(port, async () => {
	console.info(`Server running on port ${port}`);
});
