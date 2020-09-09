
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState, AppThunk } from "./store";
import { id } from "evt/tools/typeSafety/id";
import { actions as appActions } from "./app";
import { axiosAuth } from "js/utils/axios-config";
import localApi_todo_rename from "./api";
import { PUSHER } from "js/components/notifications";
import * as messages from "js/components/messages";
import * as api from 'js/api/my-lab';

//TODO: Rename franglish
export type State = {
	mesServices: State.Service[];
	//TODO rename selected<->Service
	serviceSelected: Pick<State.Service, "id"> | null;
};

export namespace State {

	export type Service = {
		id: "cloudshell";
	};

}

export const name = "myLab";

const slice = createSlice({
	name,
	"initialState": id<State>({
		"mesServices": [],
		"serviceSelected": null
	}),
	"reducers": {
		"setServiceSelected": (
			state,
			{ payload }: PayloadAction<{ service: State["serviceSelected"]; }>
		) => {
			const { service } = payload;
			state.serviceSelected = service;
		},
		"deleteMonService": (
			state,
			{ payload }: PayloadAction<{ service: Pick<State["mesServices"][number], "id">; }>
		) => {

			const { service } = payload;

			state.mesServices = state.mesServices.filter(
				({ id }) => id !== service.id
			);

		},
		"updateMonService": (
			state,
			{ payload }: PayloadAction<{ service: State["mesServices"][number]; }>
		) => {

			const { service } = payload;

			for (let i = 0; i < state.mesServices.length; i++) {
				if (state.mesServices[i].id !== service.id) {
					continue;
				}
				state.mesServices[i] = service;
			}


		},



	}
});




const { actions: syncActions } = slice;

const asyncActions = {
	//TODO: Only dispatching app action, missing local dispatch or should be moved
	"creerNouveauService": (
		payload: {
			service: {
				category: "group" | "service";
				catalogId: "inseefrlab-datascience";
				name: string;
				currentVersion: number;
				postInstallNotes?: string;
			};
			options: {
				onyxia: {
					friendly_name: "rstudio-example"
				},
				service: {
					cpus: number;
					mem: number;
				};
			};
			dryRun?: boolean;
		}
	): AppThunk => async dispatch => {

		const { service, options } = payload;
		const dryRun = payload.dryRun ?? false;

		dispatch(appActions.startWaiting());

		//TODO: The response is supposed to be an object containing at lease { id }, check if true.
		const response = await axiosAuth.put(
			service.category === "group" ?
				localApi_todo_rename.nouveauGroupe :
				localApi_todo_rename.nouveauService,
			{
				"catalogId": service.catalogId,
				"packageName": service.name,
				"packageVersion": service.currentVersion,
				dryRun,
				options
			}
		).catch((error: Error) => error);

		dispatch(appActions.stopWaiting());

		if (response instanceof Error) {

			PUSHER.push(<messages.ServiceEchecMessage nom={ service.name } />);

			return;

		}

		if (dryRun) {
			//TODO: Debatable...
			return;
		}

		PUSHER.push(<messages.ServiceCreeMessage id={ response.id } message = { service.postInstallNotes } />);

	},
	"requestDeleteMonService": (
		payload: {
			service: { id: "cloudshell"; }
		}
	): AppThunk => async dispatch => {

		const { service } = payload;

		dispatch(appActions.cardStartWaiting(service.id));

		await api.deleteServices(service.id);

		dispatch(appActions.cardStopWaiting(service.id));

		dispatch(syncActions.deleteMonService({ service }));

		PUSHER.push(<messages.ServiceSupprime id={ service.id } />);

	}



};

export const actions = {
	...id<Pick<typeof syncActions, "setServiceSelected" | "updateMonService">>(syncActions),
	...asyncActions
};

export const select = (state: RootState) => state.myFiles;

export const reducer = slice.reducer;
