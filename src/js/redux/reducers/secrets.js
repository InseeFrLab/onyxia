import * as types from "js/redux/actions/constantes";

export const VAULT_STATUS = {
  sealed: "VAULT_STATUS_SEALED",
  unsealed: "VAULT_STATUS_UNSEALED",
  unknow: "VAULT_STATUS_UNKNOW"
};

const initial = {
  sealedStatus: VAULT_STATUS.unknow,
  vaultSecretsList: undefined
};

export default (state = initial, action) => {
  switch (action.type) {
    case types.CHECK_VAULT_STATUS: {
      return {
        ...state,
        sealedStatus: action.status
          ? VAULT_STATUS.sealed
          : VAULT_STATUS.unsealed
      };
    }
    case types.GET_VAULT_SECRETS_LIST: {
      return { ...state, vaultSecretsList: action.payload.secrets || [] };
    }
    case types.GET_VAULT_SECRET: {
      return { ...state, vaultSecret: action.payload.secrets || {}}
    }

    default:
      return state;
  }
};
