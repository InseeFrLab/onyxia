import { connect } from "react-redux";
import MesSecrets from "./mes-secrets.component";
import {
  checkVaultStatus,
  getVaultSecretsList,
  getVaultSecret,
  updateVaultSecret,
  getUserInfo
} from "js/redux/actions";

const dispatchStateToProps = state => {
  const { sealedStatus, vaultSecretsList, vaultSecret } = state.secrets;
  const { user } = state;
  return { sealedStatus, vaultSecretsList, vaultSecret, getUserInfo, user };
};

export default connect(dispatchStateToProps, {
  checkVaultStatus,
  getVaultSecretsList,
  getVaultSecret,
  updateVaultSecret
})(MesSecrets);
