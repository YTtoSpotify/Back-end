class ErrorHandler extends Error {
	constructor(statusCode, message) {
		super();
		this.statusCode = statusCode;
		this.message = message;
	}
}

const handleError = (err, res) => {
	let statusCode = err.statusCode;
	let message = err.message;

	if (!statusCode) {
		statusCode = 500;
		message = "Something went wrong on our end: we're looking into it.";
	}

	res.status(statusCode).json({
		status: "error",
		statusCode,
		message,
	});

	throw err;
};

module.exports = { ErrorHandler, handleError };
