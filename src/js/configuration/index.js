const readConfig = key => window._env_[key] || process.env["REACT_APP_" + key];

const conf = {
  API: {
    "base_url": readConfig("BASE_API_URL"),
  },
  APP: {
    "max-instances": readConfig("INSTANCES_MAX"),
    dns: readConfig("DNS"),
    "git-path": readConfig("GIT_PATH"),
    password: readConfig("PASSWORD"),
    "grafana-uri": readConfig("GRAFANA_BASE_URI")
  },
  ENDPOINTS: {
    "salon-rc": readConfig("SALON_ROCKETCHAT")
  },
  KUBERNETES: {
    "kub-kc-client-id": readConfig("KUB_KC_CLIENT_ID"),
    "kub-kc-url": readConfig("KUB_KC_URL"),
    "kub-api-server": readConfig("KUB_APISERVER_URL")
  },
  VAULT: {
    "vault-base-uri": readConfig("VAULT_BASE_URI")
  },
  CHAT: {
    "url": readConfig("CHAT_URL")
  },
  AUTHENTICATION: {
    TYPE: readConfig("AUTH_TYPE"),
    OIDC: {
      "realm": readConfig("AUTH_OIDC_REALM"),
      "auth-server-url": readConfig("AUTH_OIDC_URL"),
      "ssl-required": readConfig("AUTH_OIDC_SSL_REQUIRED"),
      "resource": readConfig("AUTH_OIDC_RESOURCE"),
      "public-client": readConfig("AUTH_OIDC_PUBLIC_CLIENT") === "true",
      "confidential-port": readConfig("AUTH_OIDC_CONFIDENTIAL_PORT")
    }
  },
  MINIO: {
    "base-uri": readConfig("MINIO_BASE_URI"),
    "end-point": readConfig("MINIO_END_POINT"),
    "port": readConfig("MINIO_PORT"),
    "minimum-duration": readConfig("MINIO_END_MINIMUM_DURATION_MS")
  },
  FOOTER: {
    ONYXIA: {
      "git": readConfig("ONYXIA_GIT"),
      "rocketchat": readConfig("ONYXIA_ROCKETCHAT"),
    },
    "swagger-api": readConfig("SWAGGER_API"),
    "ghost-url": readConfig("GHOST_URL"),
    "grafana-url": readConfig("GRAFANA_URL")
  }
};


export default conf;
