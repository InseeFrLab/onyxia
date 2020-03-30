const readConfig = (key) =>
	(window && window._env_ && window._env_[key]) ||
	process.env[`REACT_APP_${key}`];

const conf = {
	API: {
		BASE_URL: readConfig('BASE_API_URL'),
		SERVICES_URL: readConfig('SERVICES_URL'),
	},
	APP: {
		MAX_INSTANCES: readConfig('INSTANCES_MAX'),
		DNS: readConfig('DNS'),
		GIT_PATH: readConfig('GIT_PATH'),
		PASSWORD: readConfig('PASSWORD'),
		GRAFANA_URI: readConfig('GRAFANA_BASE_URI'),
	},
	ENDPOINTS: {
		SALON_RC: readConfig('SALON_ROCKETCHAT'),
	},
	KUBERNETES: {
		KUB_KC_CLIENT_ID: readConfig('KUB_KC_CLIENT_ID'),
		KUB_KC_URL: readConfig('KUB_KC_URL'),
		KUB_API_SERVER: readConfig('KUB_APISERVER_URL'),
	},
	VAULT: {
		VAULT_BASE_URI: readConfig('VAULT_BASE_URI'),
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
			ROCKETCHAT: readConfig('ONYXIA_ROCKETCHAT'),
		},
		SWAGGER_API: readConfig('SWAGGER_API'),
		GHOST_URL: readConfig('GHOST_URL'),
		GRAFANA_URL: readConfig('GRAFANA_URL'),
	},
};

export default conf;
