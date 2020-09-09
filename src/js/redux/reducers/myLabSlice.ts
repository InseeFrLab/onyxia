
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import { id }  from "evt/tools/typeSafety/id";

//TODO: Rename franglish
export type State = {
	catalogue: {__brand:"0";}[];
	mesServices: {__brand:"1";}[];
	mesGroupes: {__brand:"2";}[];
	groupe: {__brand:"3";};
	serviceSelected: {__brand:"4"};
	serviceCree: boolean;
	serviceCreationEchec: boolean;
	mesServicesWaiting: {__brand:"5";}[];
	mesServicesTypeRequest: {__brand:"6";};
	refresh: boolean;
};

export const name= "myLab";

const slice = createSlice({
	name,
	"initialState": id<State>({
		"catalogue": [],
		"mesServices": [],
		"mesGroupes": [],
		"groupe": null as any,
		"serviceSelected": null as any,
		"serviceCree": false,
		"serviceCreationEchec": false,
		"mesServicesWaiting": [],
		"mesServicesTypeRequest": null as any,
		"refresh": false
	}),
	"reducers": {


	}
});


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
				mesGroupes: action.payload.groupes || [],
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
