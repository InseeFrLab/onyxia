// import { VAULT_STATUS } from "js/redux/reducers";
import createVaultApi from "js/vault-client";
import { axiosAuth } from "js/utils";
import * as constantes from "./constantes";
import { startWaiting, stopWaiting } from "./app";
import conf from "./../../configuration"
const VAULT_BASE_URI = conf.VAULT.VAULT_BASE_URI;
const VAULT = createVaultApi();

export const checkVaultStatus = () => async dispatch =>
  dispatch({
    type: constantes.CHECK_VAULT_STATUS,
    payload: {
      status: await axiosAuth.get(`${VAULT_BASE_URI}/v1/sys/seal-status`)
    }
  });

export const getVaultSecretsList = path => async dispatch => {
  dispatch(startWaiting());
  const secrets = await VAULT.getSecretsList(path);
  dispatch(stopWaiting());
  dispatch({
    type: constantes.GET_VAULT_SECRETS_LIST,
    payload: { secrets }
  });

  return secrets;
};

export const getVaultSecret = path => async dispatch => {
  dispatch(startWaiting());
  const secrets = await VAULT.getSecret(path);
  dispatch(stopWaiting());
  dispatch({
    type: constantes.GET_VAULT_SECRET,
    payload: { secrets }
  });

  return secrets;
};

export const updateVaultSecret = ({ location, data }) => async dispatch => {
  dispatch(startWaiting());
  await VAULT.uploadSecret(location, data);
  dispatch(stopWaiting());
};

export const createPath = path => async dispatch => { };

export const newVaultToken = token => async dispatch =>
  dispatch({
    type: constantes.NEW_VAULT_TOKEN,
    payload: {
      token
    }
  });
