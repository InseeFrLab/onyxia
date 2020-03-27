import { axiosAuth, axiosPublicFolder } from 'js/utils/axios-config';
const LOCAL_STORE = {};

/*
 * only for http GET request
 */
const get = (withAuth) => (url) => {
	if (url in LOCAL_STORE) {
		return Promise.resolve(LOCAL_STORE[url]);
	}
	const method = withAuth ? axiosAuth : axiosPublicFolder;

	return method.get(url).then((response) => {
		LOCAL_STORE[url] = response;
		return response;
	});
};

export default () => ({ get: get(false), getAuth: get(true) });
