import * as types from './../actions/constantes';

const initial = {
	serviceSelectionne: null,
};

export default (state = initial, action) => {
	switch (action.type) {
		case types.SERVICE_SELECTIONNE: {
			return { ...state, serviceSelectionne: action.payload.service };
		}
		default:
			return state;
	}
};
