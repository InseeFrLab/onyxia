
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
	mesServicesWaiting: string[]; //Array of ids
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
		"serviceSelected": null,
		"mesServicesWaiting": []
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

			const { mesServices } = state;

			const serviceToDelete= mesServices.find(({ id })=> id === service.id );

			if( serviceToDelete === undefined ){
				return;
			}

			mesServices.splice(mesServices.indexOf(serviceToDelete),1);

		},
		"updateMonService": (
			state,
			{ payload }: PayloadAction<{ service: State["mesServices"][number]; }>
		) => {


			const { service } = payload;

			const { mesServices } = state;

			const oldService = mesServices.find(({ id })=> id === service.id);

			if( oldService === undefined ){
				return;
			}

			mesServices[mesServices.indexOf(oldService)]= service;

		},
		"cardStartWaiting": (
			state,
			{ payload }: PayloadAction<{ id: State["mesServicesWaiting"][number]; }>
		) => {

			const { id }  = payload;

			state.mesServicesWaiting.push(id);

		},
		"cardStopWaiting": (
			state,
			{ payload }: PayloadAction<{ id: State["mesServicesWaiting"][number]}>
		) => {

			const { id } = payload;

			const { mesServicesWaiting } = state;

			const index = mesServicesWaiting.indexOf(id);

			if( index < 0 ){
				return;
			}

			mesServicesWaiting.splice(index, 1);
			

		}




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

		dispatch(syncActions.cardStartWaiting({ "id": service.id }));

		await api.deleteServices(service.id);

		dispatch(syncActions.cardStopWaiting({ "id": service.id }));

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
