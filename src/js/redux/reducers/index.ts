import { combineReducers } from 'redux';
import app from './app';
import myLab from './my-lab';
import mesFichiers from './mes-fichiers';
import secrets from './secrets';
import cloudShell from './cloud-shell';
import user from './user';
import regions from './regions';

const globalReducer = combineReducers({
	app,
	myLab,
	mesFichiers,
	secrets,
	cloudShell,
	user,
	regions,
});
export type RootState = ReturnType<typeof globalReducer>;
export * from './app';
export { VAULT_STATUS } from './secrets';
export default globalReducer;
