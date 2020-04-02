const BETA_TEST_KEY = 'betatest';

export const hasOptedInForBetaTest = () => {
	if (window.localStorage) {
		return window.localStorage.getItem(BETA_TEST_KEY) === 'true';
	}
	return false;
};

export const changeBetaTestStatus = (optedIn) => {
	if (window.localStorage) {
		return Promise.resolve(window.localStorage.setItem(BETA_TEST_KEY, optedIn));
	}
	return Promise.resolve(false);
};
