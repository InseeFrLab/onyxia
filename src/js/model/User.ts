export interface User {
	S3: {
		AWS_EXPIRATION: string;
		AWS_ACCESS_KEY_ID: string;
		AWS_SECRET_ACCESS_KEY: string;
		AWS_SESSION_TOKEN: string;
		AWS_S3_ENDPOINT: string;
	};
	USERNAME: string;
	VAULT: { DATA: { data: { password: string } } };
	IDEP: string;
	USERMAIL: string;
	IP: string;
	KUBERNETES: {
		KUB_SERVER_NAME: string;
		KUB_SERVER_URL: string;
	};
}
