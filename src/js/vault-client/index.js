import VaultAPI, {
	getVaultToken,
	initVaultPwd,
	resetVaultPwd,
	getVersionsList,
} from './vault-api';
export default () => new VaultAPI();
export { getVaultToken, initVaultPwd, resetVaultPwd, getVersionsList };
