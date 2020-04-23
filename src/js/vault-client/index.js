import VaultAPI, {
	getVaultToken,
	initVaultData,
	resetVaultData,
	resetVaultPwd,
} from './vault-api';
export default () => new VaultAPI();
export { getVaultToken, initVaultData, resetVaultData, resetVaultPwd };
