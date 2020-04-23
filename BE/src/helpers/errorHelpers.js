class ErrorHandler extends Error {
	constructor(statusCode, message) {
		super();
		this.statusCode = statusCode;
		this.message = message;
	}
}

const handleError = (err, res) => {
	const {
		statusCode = 500,
		message = "We screwed something up. We're looking into it.",
	} = err;

	res.status(statusCode).json({
		status: "error",
		statusCode,
		message,
	});

	throw err;
};

module.exports = { ErrorHandler, handleError };
