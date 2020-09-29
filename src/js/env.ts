const getEnvVar = (key: string) =>
	(window && (window as any)._env_ && (window as any)._env_[key]) ||
	process.env[`REACT_APP_${key}`];

export const env = {
	"API": {
		"BASE_URL": getEnvVar('BASE_API_URL'),
	},
	"CONTENT": {
		"SERVICES_URL": getEnvVar('SERVICES_URL'),
		"HOMEPAGE_URL": getEnvVar('HOMEPAGE_URL'),
		"TRAININGS_URL": getEnvVar('TRAININGS_URL'),
	},
	"APP": {
		"CONTACT": getEnvVar('CONTACT'),
		"WARNING_MESSAGE": getEnvVar('WARNING_MESSAGE'),
	},
	"KUBERNETES": {
		"KUB_SERVER_NAME": getEnvVar('KUB_SERVER_NAME'),
		"KUB_SERVER_URL": getEnvVar('KUB_SERVER_URL'),
	},
	"VAULT": {
		"VAULT_BASE_URI": getEnvVar('VAULT_BASE_URI'),
		"VAULT_KV_ENGINE": getEnvVar('VAULT_KV_ENGINE'),
	},
	"CHAT": {
		"CHAT_URL": getEnvVar('CHAT_URL'),
	},
	"AUTHENTICATION": {
		"TYPE": getEnvVar('AUTH_TYPE'),
		"OIDC": {
			"clientId": getEnvVar('AUTH_OIDC_CLIENT_ID'),
			"realm": getEnvVar('AUTH_OIDC_REALM'),
			"url": getEnvVar('AUTH_OIDC_URL'),
			'ssl-required': getEnvVar('AUTH_OIDC_SSL_REQUIRED'),
			"resource": getEnvVar('AUTH_OIDC_RESOURCE'),
			"public-client": getEnvVar('AUTH_OIDC_PUBLIC_CLIENT') === 'true',
			"confidential-port": getEnvVar('AUTH_OIDC_CONFIDENTIAL_PORT'),
		},
	},
	"MINIO": {
		"BASE_URI": getEnvVar('MINIO_BASE_URI'),
		"END_POINT": getEnvVar('MINIO_END_POINT'),
		"PORT": parseInt(getEnvVar('MINIO_PORT')),
		"MINIMUN_DURATION": getEnvVar('MINIO_END_MINIMUM_DURATION_MS'),
	},
	"FOOTER": {
		"ONYXIA": {
			"GIT": getEnvVar('ONYXIA_GIT'),
			"CHAT_ROOM": getEnvVar('ONYXIA_CHAT_ROOM'),
		},
		"SWAGGER_API": getEnvVar('SWAGGER_API'),
		"BLOG_URL": getEnvVar('BLOG_URL'),
		"MONITORING_URL": getEnvVar('MONITORING_URL')
	},
};

