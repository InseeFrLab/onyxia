import { Region } from 'js/model/Region';
import { NEW_REGIONS, REGION_CHANGED } from './constantes';

export const newRegions = (regions: Region[]) => ({
	type: NEW_REGIONS,
	payload: { regions },
});

export const regionChanged = (newRegion: Region) => ({
	type: REGION_CHANGED,
	payload: { newRegion },
});
