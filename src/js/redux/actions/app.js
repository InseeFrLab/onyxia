import { axiosAuth } from 'js/utils';
import api from './../api';
import { getKeycloak, clearLocalToken } from 'js/utils';
import { PUSHER } from 'js/components/notifications';
import * as constantes from './constantes';

export const authenticationFail = (error) => ({
	type: constantes.AUTHENTICATED_FAIL,
	payload: { error },
});

export const setAuthenticated = (payload) => ({
	type: constantes.SET_AUTHENTICATED,
	payload,
});

export const requestError = (error) => ({
	type: constantes.REQUEST_ERROR,
	payload: { error },
});

export const startWaiting = () => ({
	type: constantes.START_WAITING,
});

export const stopWaiting = () => ({
	type: constantes.STOP_WAITING,
});

export const cardStartWaiting = (id) => ({
	type: constantes.CARD_START_WAITING,
	payload: { id },
});

export const cardStoptWaiting = (id) => ({
	type: constantes.CARD_STOP_WAITING,
	payload: { id },
});

export const setRedirectUri = (uri) => ({
	type: constantes.SET_REDIRECT_URI,
	payload: { uri },
});

export const displayLogin = (display) => ({
	type: constantes.DISPLAY_LOGIN,
	payload: { display },
});

export const getUserInfo = () => async (dispatch) =>
	axiosAuth
		.get(api.userInfo)
		.then((user) => dispatch(setUserInfo(user)))
		.catch((err) => {
			// TODO
		});

const setUserInfo = (user) => ({
	type: constantes.SET_USER_INFO,
	payload: { user },
});

export const applicationResize = (width) => ({
	type: constantes.APP_RESIZE,
	payload: { width },
});

// export const consumeMessageIntraining = () => ({
// 	type: constantes.CONSUME_MESSAGE_INFORMATION,
// });

export const updateUser = () => (dispatch) => {
	dispatch(startWaiting());
	axiosAuth
		.get(api.updateUser)
		.then((user) => {
			dispatch(stopWaiting());
			dispatch(updateUserDone(user));
			PUSHER.push('mise à jour réussie.');
			// dispatch(produceMessageIntraining('mise à jour réussie.'));
		})
		.catch((err) => {
			// TODO
		});
	return false;
};

export const updateUserDone = (user) => ({
	type: constantes.USER_UPDATE,
	payload: { user },
});

export const logout = () => () => {
	clearLocalToken();
	getKeycloak().logout({ redirectUri: `${window.location.origin}/accueil` });
	return false;
};

export const setFavicon = (url) => ({
	type: constantes.SET_FAVICON,
	payload: { url },
});

export const startVisite = () => ({ type: constantes.START_VISITE });
export const stopVisite = () => ({ type: constantes.STOP_VISITE });
