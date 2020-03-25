import * as types from './../actions/constantes';

const initial = {
	alpaServices: [],
	betaServices: [],
	stableServices: [],
	serviceSelectionne: null,
};

export default (state = initial, action) => {
	switch (action.type) {
		case types.SERVICE_SELECTIONNE: {
			return { ...state, serviceSelectionne: action.payload.service };
		}
		case types.SERVICES_CHARGES: {
			const { data: services } = action.payload.services;
			return {
				...state,
				alpaServices: getAlphaServices(services),
				betaServices: getBetaServices(services),
				stableServices: getStableServices(services),
			};
		}
		default:
			return state;
	}
};

const getAlphaServices = (services) =>
	services.filter(
		(s) => !s.labels.ONYXIA_STATUS || s.labels.ONYXIA_STATUS === 'alpha'
	);

const getBetaServices = (services) =>
	services.filter((s) => s.labels.ONYXIA_STATUS === 'beta');

const getStableServices = (services) =>
	services.filter((s) => s.labels.ONYXIA_STATUS === 'stable');
