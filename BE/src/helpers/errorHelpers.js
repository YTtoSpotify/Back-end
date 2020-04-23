class ErrorHandler extends Error {
	constructor(statusCode, message) {
		super();
		this.statusCode = statusCode;
		this.message = message;
	}
}

const handleError = (err, res) => {
	let {
		statusCode = 500,
		message = "We screwed something up. We're looking into it.",
	} = err;

	res.status(statusCode).json({
		status: "error",
		statusCode,
		message,
	});
};

module.exports = { ErrorHandler, handleError };
