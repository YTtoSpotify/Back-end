module.exports = { isAuthenticated };

const { ErrorHandler } = require("./errorHelpers");

function isAuthenticated(req, res, next) {
	if (req.isAuthenticated()) next();
	else {
		throw new ErrorHandler(403, "User not logged in");
	}
}
