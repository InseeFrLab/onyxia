import * as types from "./../actions/constantes";

const initial = {
  USERNAME: "",
  IDEP: undefined,
  USERMAIL: "",
  USERPASSWORD: process.env.REACT_APP_MOT_DE_PASSE,
  USERKEY: "https://example.com/placeholder.gpg",
  STATUS: "",
  GIT: process.env.REACT_APP_GIT_PATH,
  DNS: process.env.REACT_APP_DNS,
  UUID: "",
  IP: "",
  S3: {
    AWS_ACCESS_KEY_ID: undefined,
    AWS_SECRET_ACCESS_KEY: undefined,
    AWS_SESSION_TOKEN: undefined,
    AWS_DEFAULT_REGION: "us-east-1",
    AWS_S3_ENDPOINT: process.env.REACT_APP_MINIO_END_POINT,
    AWS_EXPIRATION: undefined
  },
  SSH: {
    SSH_PUBLIC_KEY: "",
    SSH_KEY_PASSWORD: ""
  },
  KEYCLOAK: {
    KC_ID_TOKEN: undefined,
    KC_REFRESH_TOKEN: undefined,
    KC_ACCESS_TOKEN: undefined
  },
  KUBERNETES: {
    KUB_KC_CLIENT_ID: process.env.REACT_APP_KUB_KC_CLIENT_ID,
    KUB_KC_URL: process.env.REACT_APP_KUB_KC_URL,
    KUB_APISERVER_URL: process.env.REACT_APP_KUB_APISERVER_URL
  },
  VAULT: {
    VAULT_ADDR: process.env.REACT_APP_VAULT_BASE_URI,
    VAULT_TOKEN: undefined
  }
};

export default (state = initial, action) => {
  switch (action.type) {
    case types.SET_AUTHENTICATED: {
      return {
        ...state,
        KEYCLOAK: {
          ...state.KEYCLOAK,
          KC_ID_TOKEN: action.payload.idToken,
          KC_REFRESH_TOKEN: action.payload.refreshToken,
          KC_ACCESS_TOKEN: action.payload.accessToken
        }
      };
    }
    case types.SET_USER_INFO:
    case types.USER_UPDATE:
      return {
        ...state,
        USERMAIL: action.payload.user.email,
        IDEP: action.payload.user.idep,
        USERNAME: action.payload.user.nomComplet,
        IP: action.payload.user.ip,
        SSH: {
          SSH_PUBLIC_KEY: action.payload.user.sshPublicKey,
          SSH_KEY_PASSWORD: action.payload.user.password
        }
      };
    case types.NEW_S3_CREDENTIALS:
      return {
        ...state,
        S3: {
          ...state.S3,
          AWS_ACCESS_KEY_ID: action.payload.credentials.accessKey,
          AWS_SECRET_ACCESS_KEY: action.payload.credentials.secretAccessKey,
          AWS_EXPIRATION: action.payload.credentials.expiration,
          AWS_SESSION_TOKEN: action.payload.credentials.sessionToken
        }
      };
    case types.NEW_VAULT_TOKEN:
      return {
        ...state,
        VAULT: {
          ...state.VAULT,
          VAULT_TOKEN: action.payload.token
        }
      };
    default:
      return state;
  }
};
