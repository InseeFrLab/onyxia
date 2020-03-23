const readConfig = key => window._env_[key] || process.env["REACT_APP_" + key];

const conf = {
  API: {
    base_url: readConfig("BASE_API_URL"),
  },
  APP: {
    max_instances: readConfig("INSTANCES_MAX"),
    dns: readConfig("DNS"),
    git_path: readConfig("GIT_PATH"),
    password: readConfig("PASSWORD"),
    grafana_uri: readConfig("GRAFANA_BASE_URI")
  },
  ENDPOINTS: {
    salon_rc: readConfig("SALON_ROCKETCHAT")
  },
  KUBERNETES: {
    kub_kc_client_id: readConfig("KUB_KC_CLIENT_ID"),
    kub_kc_url: readConfig("KUB_KC_URL"),
    kub_api_server: readConfig("KUB_APISERVER_URL")
  },
  VAULT: {
    vault_base_uri: readConfig("VAULT_BASE_URI")
  },
  CHAT: {
    url: readConfig("CHAT_URL")
  },
  AUTHENTICATION: {
    TYPE: readConfig("AUTH_TYPE"),
    OIDC: {
      realm: readConfig("AUTH_OIDC_REALM"),
      auth_server_url: readConfig("AUTH_OIDC_URL"),
      ssl_required: readConfig("AUTH_OIDC_SSL_REQUIRED"),
      resource: readConfig("AUTH_OIDC_RESOURCE"),
      public_client: readConfig("AUTH_OIDC_PUBLIC_CLIENT") === "true",
      confidential_port: readConfig("AUTH_OIDC_CONFIDENTIAL_PORT")
    }
  },
  MINIO: {
    base_uri: readConfig("MINIO_BASE_URI"),
    end_point: readConfig("MINIO_END_POINT"),
    port: readConfig("MINIO_PORT"),
    minimum_duration: readConfig("MINIO_END_MINIMUM_DURATION_MS")
  },
  FOOTER: {
    ONYXIA: {
      git: readConfig("ONYXIA_GIT"),
      rocketchat: readConfig("ONYXIA_ROCKETCHAT"),
    },
    swagger_api: readConfig("SWAGGER_API"),
    ghost_url: readConfig("GHOST_URL"),
    grafana_url: readConfig("GRAFANA_URL")
  }
};


export default conf;
