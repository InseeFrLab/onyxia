import { combineReducers } from 'redux';
import app from './app';
import myLab from './my-lab';
import mesFichiers from './mes-fichiers';
import secrets from './secrets';
import cloudShell from './cloud-shell';
import user from './user';

export default combineReducers({
	app,
	myLab,
	mesFichiers,
	secrets,
	cloudShell,
	user,
});
export * from './app';
export { VAULT_STATUS } from './secrets';
