import VaultAPI, {
	getVaultToken,
	initVaultData,
	resetVaultPwd,
	getVersionsList,
	getPasswordByVersion,
} from './vault-api';
export default () => new VaultAPI();
export {
	getVaultToken,
	initVaultData,
	resetVaultPwd,
	getVersionsList,
	getPasswordByVersion,
};
