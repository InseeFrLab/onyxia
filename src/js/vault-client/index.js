import VaultAPI, {
	getVaultToken,
	initVaultPwd,
	resetVaultPwd,
	getVersionsList,
	getPasswordByVersion,
} from './vault-api';
export default () => new VaultAPI();
export {
	getVaultToken,
	initVaultPwd,
	resetVaultPwd,
	getVersionsList,
	getPasswordByVersion,
};
