import { combineReducers } from 'redux';
import app from './app';
import myLab from './my-lab';
import mesFichiers from './mes-fichiers';
import secrets from './secrets';
import user from './user';

export default combineReducers({
	app,
	myLab,
	mesFichiers,
	secrets,
	user,
});
export * from './app';
export { VAULT_STATUS } from './secrets';
