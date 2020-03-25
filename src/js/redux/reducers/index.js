import { combineReducers } from 'redux';
import app from './app';
import publicReducer from './public';
import myLab from './my-lab';
import mesFichiers from './mes-fichiers';
import secrets from './secrets';
import cloudShell from './cloud-shell';
import user from './user';

export default combineReducers({
	app,
	public: publicReducer,
	myLab,
	mesFichiers,
	secrets,
	cloudShell,
	user,
});
export * from './app';
export { VAULT_STATUS } from './secrets';
