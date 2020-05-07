import { Request } from "express";
import { IClientUser } from "./clientInterfaces";
export interface AuthenticatedRequest extends Request {
	user: IClientUser;
}
