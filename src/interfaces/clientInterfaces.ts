import { IChannelSchema, IUserSchema } from "./dbModelInterfaces";
export interface IClientChannel extends IChannelSchema {
	isUserSub: boolean;
}

export interface IClientUser extends IUserSchema {
	subbedChannels: number[];
	accessToken: string;
	refreshToken: string;
	tokenExpirationDate: string;
}
