class ErrorHandler extends Error {
	constructor(statusCode, message) {
		super();
		this.statusCode = statusCode;
		this.message = message;
	}
}

const handleError = (err, res) => {
	let { statusCode, message } = err;

	// handles internal server errors
	if (!statusCode) {
		statusCode = 500;
		message = "We screwed something up: we're looking into it";
	}

	res.status(statusCode).json({
		status: "error",
		statusCode,
		message,
	});

	throw err;
};

module.exports = { ErrorHandler, handleError };
