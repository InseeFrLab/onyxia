import api from 'js/redux/api';
import getDataStore from 'js/data-store';
import * as constantes from './constantes';
import { startWaiting, stopWaiting } from './app';
import { requestError } from './app';
import conf from 'js/configuration';
const BASE_URI = conf.API.BASE_URL;

export const chargerServices = () => (dispatch, getState) => {
	getDataStore()
		.get(api.services)
		.then((services) => {
			dispatch(servicesCharges(services));
		})
		.catch(function (error) {
			dispatch(requestError(error));
		});
	return false;
};

export const setServiceSelectionne = (service) => ({
	type: constantes.SERVICE_SELECTIONNE,
	payload: { service },
});

export const servicesCharges = (services) => ({
	type: constantes.SERVICES_CHARGES,
	payload: { services },
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
