export interface IDbSession {
	_id: string;
	session: string;
	expires: Date;
}

export interface IParsedDbSession {
	passport: {
		user: {
			id: string;
			accessToken: string;
			refreshToken: string;
			tokenExpirationDate: Date;
		};
	};
}
