const readConfig = key => window._env_[key] || process.env["REACT_APP_" + key];

const conf = {
  API: {
    BASE_URL: readConfig("BASE_API_URL")
  },
  CHAT: {
    URL: readConfig("CHAT_URL")
  },
  AUTHENTICATION: {
    TYPE: readConfig("AUTH_TYPE"),
    OIDC: {
      realm: readConfig("AUTH_OIDC_REALM"),
      "auth-server-url": readConfig("AUTH_OIDC_URL"),
      "ssl-required": readConfig("AUTH_OIDC_SSL_REQUIRED"),
      resource: readConfig("AUTH_OIDC_RESOURCE"),
      "public-client": readConfig("AUTH_OIDC_PUBLIC_CLIENT") === "true",
      "confidential-port": readConfig("AUTH_OIDC_CONFIDENTIAL_PORT")
    }
  }
};

export default conf;
