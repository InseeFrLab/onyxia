import decode from 'jwt-decode';

const TOKEN_STARAGE_ID = 'onyxia/localStorage/user/token';
let LOCAL = null;

export const getToken = () =>
	window.localStorage
		? Promise.resolve(window.localStorage.getItem(TOKEN_STARAGE_ID))
		: Promise.resolve(LOCAL);

export const setToken = (token) => {
	window.localStorage
		? window.localStorage.setItem(TOKEN_STARAGE_ID, token)
		: (LOCAL = token);
};

export const isAuthenticated = () =>
	window.localStorage
		? window.localStorage.getItem(TOKEN_STARAGE_ID) !== null
		: LOCAL !== null;

export const getDecodedToken = async () => decode(await getToken());
