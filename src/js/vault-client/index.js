import VaultAPI, {
	getVaultToken,
	initVaultProfile,
	resetVaultPwd,
} from './vault-api';
export default () => new VaultAPI();
export { getVaultToken, initVaultProfile, resetVaultPwd };
