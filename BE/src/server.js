require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./db/connectDB");
const authRouter = require("./routes/auth/authRoutes");
const channelRouter = require("./routes/channels/channelRoutes");
const userRouter = require("./routes/user/userRoutes");
const hubRouter = require("./routes/youtubeHub/hubRoutes");

const { handleError } = require("./helpers/errorHelpers");
const xmlParser = require("express-xml-bodyparser");
const Channel = require("./db/models/channelModel");
const sessionInstance = require("./helpers/sessionCreate");
const passport = require("./helpers/passport/passportConfig");
const yw = require("./helpers/youtubeWatcher");
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
app.use("/api/hub", hubRouter);
//GLOBAL MIDDLEWARE
app.use((err, req, res, next) => {
	handleError(err, res);
});

// yw.on("start", async () => {
// 	try {
// 		const allChannels = await Channel.find({}).lean().exec();

// 		const allChannelIds = allChannels.map((channel) => {
// 			return channel.ytId;
// 		});

// 		console.log(allChannelIds);
// 		yw.watch(["UCbVdf1NvbcAw3qPT_wO7ETg"]);
// 	} catch (err) {
// 		console.log(err);
// 	}
// });

// yw.on("notified", (video) => {
// 	console.log(
// 		` ******************* Channel: ${video.author}, Title: ${video.title}`
// 	);
// 	console.log(video);
// 	// TODO find all users with channel id and deposit the song into their spotify playlist
// });

// yw.on("err", () => console.log(err));

// yw.start();

const port = process.env.PORT || 5000;

app.get("/", (req, res) => {
	res.status(200).json({ message: `Server running on port ${port}` });
});

app.listen(port, async () => {
	console.info(`Server running on port ${port}`);
});
