import { IChannelSchema } from "./dbModelInterfaces";
export interface IClientChannel extends IChannelSchema {
	isUserSub: boolean;
}
