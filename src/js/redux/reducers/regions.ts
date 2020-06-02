import { NEW_REGIONS, REGION_CHANGED } from '../actions/constantes';
import { Region } from 'js/model/Region';

interface RegionsState {
	regions: Region[];
	selectedRegion?: string;
}

const initial: RegionsState = {
	regions: [],
	selectedRegion: undefined,
};

export default (state = initial, action): RegionsState => {
	switch (action.type) {
		case NEW_REGIONS:
			const newState = { ...state };
			if (!newState.selectedRegion && action.payload.regions.length > 0) {
				newState.selectedRegion = action.payload.regions[0];
			}
			return { ...newState, regions: action.payload.regions };
		case REGION_CHANGED:
			return { ...state, selectedRegion: action.payload.newRegion };
		default:
			return state;
	}
};
