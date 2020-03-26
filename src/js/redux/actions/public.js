import getDataStore from 'js/data-store';
import * as constantes from './constantes';
import { startWaiting, stopWaiting } from './app';
import conf from 'js/configuration';
const BASE_URI = conf.API.BASE_URL;

export const setServiceSelectionne = (service) => ({
	type: constantes.SERVICE_SELECTIONNE,
	payload: { service },
});

export const loadServiceCollaboratif = (id) => async (dispatch) => {
	dispatch(startWaiting());
	const { data } = await getDataStore().get(
		`${BASE_URI}/public/our-lab/apps${id}`
	);

	dispatch(stopWaiting());
	if (data) {
		dispatch(setServiceSelectionne(data));
	}

	return data;
};
