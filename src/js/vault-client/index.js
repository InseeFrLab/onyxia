import VaultAPI, { getVaultToken, initVaultPwd } from './vault-api';
export default () => new VaultAPI();
export { getVaultToken, initVaultPwd };
