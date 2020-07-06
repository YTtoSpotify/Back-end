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

let corsOptions = {
	credentials: true,
	origin: ["http://localhost:4200", "https://yttospotify.netlify.app/"],
};
app.use(cors(corsOptions));

// ROUTES
app.use("/api/auth", authRouter);
app.use("/api/channels", channelRouter);
app.use("/api/user", userRouter);

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

app.get("/", (req, res) => {
	res.status(200).json({ message: `Server running on port ${port}` });
});

app.listen(port, async () => {
	console.info(`Server running on port ${port}`);
});
