import { Response } from "express";

export class ErrorHandler extends Error {
	constructor(public statusCode: number, public message: string) {
		super();
	}
}

export const handleError = (err: ErrorHandler, res: Response) => {
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
