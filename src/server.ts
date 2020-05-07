require("dotenv").config();
import express, { NextFunction, Request, Response } from "express";
const cors = require("cors");
const connectDB = require("./db/connectDB");
const authRouter = require("./routes/auth/authRoutes");
const channelRouter = require("./routes/channels/channelRoutes");
const userRouter = require("./routes/user/userRoutes");

const { handleError } = require("./helpers/errorHelpers");
const xmlParser = require("express-xml-bodyparser");
const sessionInstance = require("./helpers/sessionCreate");
const passport = require("./helpers/passport/passportConfig");
const { scrapeChannels } = require("./helpers/youtubeWatcher");
const app = express();

// mongoDB initial connection
connectDB();
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
//GLOBAL MIDDLEWARE
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
	handleError(err, res);
});

const port = process.env.PORT || 5000;

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

console.log(millisTill10);
setInterval(() => {
	scrapeChannels();
}, millisTill10);

app.get("/", (req, res) => {
	res.status(200).json({ message: `Server running on port ${port}` });
});

app.listen(port, async () => {
	console.info(`Server running on port ${port}`);
});
