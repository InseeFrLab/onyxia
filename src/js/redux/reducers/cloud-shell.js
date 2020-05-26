import * as types from 'js/redux/actions/constantes';

const initial = {
	active: false,
	status: undefined,
	packageToDeploy: undefined,
};

export default (state = initial, action) => {
	switch (action.type) {
		case types.CLOUDSHELL_STATUS_CHANGE:
			return {
				...state,
				status: action.payload.status,
				packageToDeploy: action.payload.packageToDeploy,
				url: action.payload.url,
			};
		case types.CLOUDSHELL_STOPPED:
			return { active: false };
		default:
			return state;
	}
};
