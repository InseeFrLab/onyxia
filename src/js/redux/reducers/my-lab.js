import * as types from 'js/redux/actions/constantes';

const initial = {
	catalogue: [],
	mesServices: [],
	mesGroupes: [],
	groupe: null,
	serviceSelected: null,
	serviceCree: false,
	serviceCreationEchec: false,
	mesServicesWaiting: [],
	mesServicesTypeRequest: null,
	refresh: false,
};

export default (state = initial, action) => {
	switch (action.type) {
		case types.CATALOGUE_LOADED: {
			return {
				...state,
				catalogue: action.payload.catalogue,
				serviceSelected: null,
				serviceCreationEchec: false,
			};
		}
		case types.SERVICE_CHARGE: {
			return { ...state, serviceSelected: action.payload.service };
		}

		case types.MES_SERVICES_LOADED: {
			return {
				...state,
				mesServices: action.payload.services,
				mesGroupes: action.payload.groupes,
			};
		}
		case types.UPDATE_MON_SERVICE: {
			return {
				...state,
				mesServices: [
					...state.mesServices.map((s) =>
						s.id === action.payload.service.id ? action.payload.service : s
					),
				],
			};
		}
		case types.CARD_STOP_WAITING: {
			return {
				...state,
				mesServicesWaiting: state.mesServicesWaiting.filter(
					(id) => id !== action.payload.id
				),
			};
		}
		case types.CARD_START_WAITING: {
			return {
				...state,
				mesServicesWaiting: [...state.mesServicesWaiting, action.payload.id],
			};
		}
		case types.DELETE_MON_SERVICE: {
			return {
				...state,
				mesServices: state.mesServices.filter(
					(s) => s.id !== action.payload.service.id
				),
			};
		}
		case types.MON_GROUPE_CHARGE: {
			return {
				...state,
				mesServices: action.payload.groupe.apps,
				mesGroupes: [],
			};
		}
		case types.STOP_ALL_WAITING_CARDS: {
			return { ...state, mesServicesWaiting: [] };
		}
		case types.MES_SERVICES_CHECK_REQUEST: {
			const {
				type: mesServicesTypeRequest,
				services: mesServices,
				groupes: mesGroupes,
				groupe,
			} = action.payload;
			return {
				...state,
				mesServicesTypeRequest,
				mesServices,
				mesGroupes,
				groupe,
			};
		}
		case types.RESET_MES_SERVICES_TYPES_REQUEST: {
			return { ...state, mesServicesTypeRequest: null };
		}

		case types.BROWSING_DATA: {
			return { ...state, sandbox: action.payload.sandbox };
		}

		case types.FILE_DOWNLOADED: {
			return { ...state, fileContent: action.payload.content };
		}

		default:
			return state;
	}
};
