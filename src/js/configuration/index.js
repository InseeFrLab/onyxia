const readConfig = (key) =>
	(window && window._env_ && window._env_[key]) ||
	process.env[`REACT_APP_${key}`];

const conf = {
	API: {
		BASE_URL: readConfig('BASE_API_URL'),
	},
	CONTENT: {
		SERVICES_URL: readConfig('SERVICES_URL'),
		HOMEPAGE_URL: readConfig('HOMEPAGE_URL'),
		TRAININGS_URL: readConfig('TRAININGS_URL'),
	},
	APP: {
		MAX_INSTANCES: readConfig('INSTANCES_MAX'),
		DNS: readConfig('DNS'),
		GIT_PATH: readConfig('GIT_PATH'),
		PASSWORD: readConfig('PASSWORD'),
		MONITORING_URI: readConfig('MONITORING_BASE_URI'),
		CONTACT: readConfig('CONTACT'),
		WARNING_MESSAGE: readConfig('WARNING_MESSAGE'),
	},
	ENDPOINTS: {
		SALON_CHAT: readConfig('SALON_CHAT'),
	},
	KUBERNETES: {
		KUB_SERVER_NAME: readConfig('KUB_SERVER_NAME'),
		KUB_SERVER_URL: readConfig('KUB_SERVER_URL'),
	},
	VAULT: {
		VAULT_BASE_URI: readConfig('VAULT_BASE_URI'),
		VAULT_KV_ENGINE: readConfig('VAULT_KV_ENGINE'),
	},
	CHAT: {
		URL: readConfig('CHAT_URL'),
	},
	AUTHENTICATION: {
		TYPE: readConfig('AUTH_TYPE'),
		OIDC: {
			clientId: readConfig('AUTH_OIDC_CLIENT_ID'),
			realm: readConfig('AUTH_OIDC_REALM'),
			url: readConfig('AUTH_OIDC_URL'),
			'ssl-required': readConfig('AUTH_OIDC_SSL_REQUIRED'),
			resource: readConfig('AUTH_OIDC_RESOURCE'),
			'public-client': readConfig('AUTH_OIDC_PUBLIC_CLIENT') === 'true',
			'confidential-port': readConfig('AUTH_OIDC_CONFIDENTIAL_PORT'),
		},
	},
	MINIO: {
		BASE_URI: readConfig('MINIO_BASE_URI'),
		END_POINT: readConfig('MINIO_END_POINT'),
		PORT: parseInt(readConfig('MINIO_PORT')),
		MINIMUN_DURATION: readConfig('MINIO_END_MINIMUM_DURATION_MS'),
	},
	FOOTER: {
		ONYXIA: {
			GIT: readConfig('ONYXIA_GIT'),
			CHAT: readConfig('ONYXIA_CHAT'),
		},
		SWAGGER_API: readConfig('SWAGGER_API'),
		GHOST_URL: readConfig('GHOST_URL'),
		MONITORING_URL: readConfig('MONITORING_URL'),
	},
};

export default conf;
