import type { Region } from "js/model/Region";
import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import { id } from "evt/tools/typeSafety/id";
import type { RootState } from "./store";

export type State = {
	regions: Region[];
	selectedRegion: Region | undefined;
};

export const name = "regions"; //TODO: French

const slice = createSlice({
	name,
	"initialState": id<State>({
		"regions": [],
		"selectedRegion": undefined
	}),
	"reducers": {
		"newRegions": (
			state,
			{ payload }: PayloadAction<{ regions: Region[]; }>
		) => {
			const { regions } = payload;

			state.selectedRegion = regions?.[0] ?? state.selectedRegion;

			state.regions = regions;

		},
		"regionChanged": (
			state,
			{ payload }: PayloadAction<{ newRegion: Region; }>
		) => {

			const { newRegion } = payload;

			state.selectedRegion = newRegion;

		}
	}
});

const { actions: syncActions } = slice;

export const actions = {
	syncActions
};

export const select = (state: RootState) => state.myFiles;

export const reducer = slice.reducer;
