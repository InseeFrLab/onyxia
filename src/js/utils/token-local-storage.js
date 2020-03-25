const LOCAL_STORAGE_TOKEN_ID_KEY = 'onyxia/localStorage/user/token';

export const gelLocalToken = () =>
	localStorage ? localStorage.getItem(LOCAL_STORAGE_TOKEN_ID_KEY) : undefined;

export const setLocalToken = (token) => {
	if (localStorage) {
		localStorage.setItem(LOCAL_STORAGE_TOKEN_ID_KEY, token);
	}
};

export const clearLocalToken = () =>
	localStorage.removeItem(LOCAL_STORAGE_TOKEN_ID_KEY);
