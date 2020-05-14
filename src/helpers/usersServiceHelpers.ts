import User from "../db/models/userModel";
import { ErrorHandler } from "./errorHelpers";

export async function checkUserExists(userId: number) {
	const idString = userId.toString();

	if (idString.length !== 12 && idString.length !== 24)
		throw new ErrorHandler(400, "Invalid user id.");

	try {
		if (!(await User.exists({ _id: idString })))
			throw new ErrorHandler(404, "User not found");
	} catch (err) {
		throw err;
	}
}
