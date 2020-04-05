import VaultAPI, {
	getVaultToken,
	initVaultPwd,
	resetVaultPwd,
} from './vault-api';
export default () => new VaultAPI();
export { getVaultToken, initVaultPwd, resetVaultPwd };
