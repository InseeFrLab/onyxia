import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as React from "react";
import type { PayloadAction } from "@reduxjs/toolkit";
import { id } from "tsafe/id";
import { restApiPaths } from "js/restApiPaths";
import { PUSHER } from "js/components/notifications";
import * as messages from "js/components/messages";
import * as api from "js/api/my-lab";
import { assert } from "tsafe/assert";
import { actions as appActions } from "./app";
import memoize from "memoizee";

/** We avoid importing app right away to prevent require cycles */
const getAxiosInstance = memoize(
    () => import("core/adapters/officialOnyxiaApiClient").then(ns => ns.prAxiosInstance),
    {
        "promise": true
    }
);

//TODO: Rename franglish, all theses states can be deleted, they are never used.
export type State = {
    mesServices: State.Service[];
    //TODO rename selected<->Service
    serviceSelected: Pick<State.Service, "id"> | null;
    mesServicesWaiting: string[]; //Array of ids
};

export declare namespace State {
    export type Service = {
        id: "cloudshell";
    };
}

export const name = "myLab";

const asyncThunks = {
    /*
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
	*/
    ...(() => {
        const typePrefix = "creerNouveauService";

        return {
            [typePrefix]: createAsyncThunk(
                `${name}/${typePrefix}`,
                async (
                    payload: {
                        service: {
                            category: "group" | "service";
                            catalogId: string;
                            name: string;
                            currentVersion: number;
                            postInstallNotes?: string;
                        };
                        options: {
                            onyxia: {
                                friendly_name: "rstudio-example";
                            };
                            service: {
                                cpus: number;
                                mem: number;
                            };
                        };
                        dryRun?: boolean;
                    },
                    { dispatch }
                ): Promise<object | undefined> => {
                    const { service, options, dryRun = false } = payload;

                    assert(
                        typeof service === "object" &&
                            typeof options === "object" &&
                            typeof dryRun === "boolean"
                    );

                    dispatch(appActions.startWaiting());

                    const services = await (
                        await getAxiosInstance()
                    )
                        .put<State.Service[]>(
                            service.category === "group"
                                ? restApiPaths.nouveauGroupe
                                : restApiPaths.nouveauService,
                            {
                                "catalogId": service.catalogId,
                                "packageName": service.name,
                                "packageVersion": service.currentVersion,
                                dryRun,
                                options
                            }
                        )
                        .then(
                            ({ data }) => data,
                            (error: Error) => error
                        );

                    dispatch(appActions.stopWaiting());

                    if (services instanceof Error) {
                        PUSHER.push(
                            React.createElement(messages.ServiceEchecMessage, {
                                "nom": service.name
                            })
                        );

                        return;
                    }

                    if (dryRun) {
                        return services;
                    }

                    PUSHER.push(
                        React.createElement(messages.ServiceCreeMessage, {
                            "id": service.name,
                            "message": service.postInstallNotes
                        })
                    );

                    return services;
                }
            )
        };
    })(),
    ...(() => {
        const typePrefix = "requestDeleteMonService";

        return {
            [typePrefix]: createAsyncThunk(
                `${name}/${typePrefix}`,
                async (
                    payload: {
                        service: { id: "cloudshell" };
                    },
                    { dispatch }
                ) => {
                    const { service } = payload;

                    dispatch(syncActions.cardStartWaiting({ "id": service.id }));

                    await api.deleteServices(service.id);

                    dispatch(syncActions.cardStopWaiting({ "id": service.id }));

                    dispatch(syncActions.deleteMonService({ service }));

                    PUSHER.push(
                        React.createElement(messages.ServiceSupprime, {
                            "id": service.id
                        })
                    );
                }
            )
        };
    })()
};

const slice = createSlice({
    name,
    "initialState": id<State>({
        "mesServices": [],
        "serviceSelected": null,
        "mesServicesWaiting": []
    }),
    "reducers": {
        /*
		{
          type: 'onyxia/myLab/setSelectedService',
          payload: {
            service: null
          }
        }
		*/
        "setServiceSelected": (
            state,
            { payload }: PayloadAction<{ service: State["serviceSelected"] }>
        ) => {
            const { service } = payload;
            state.serviceSelected = service;
        },
        "deleteMonService": (
            state,
            {
                payload
            }: PayloadAction<{
                service: Pick<State["mesServices"][number], "id">;
            }>
        ) => {
            const { service } = payload;

            assert(typeof service === "object");

            const { mesServices } = state;

            const serviceToDelete = mesServices.find(({ id }) => id === service.id);

            if (serviceToDelete === undefined) {
                return;
            }

            mesServices.splice(mesServices.indexOf(serviceToDelete), 1);
        },
        "updateMonService": (
            state,
            { payload }: PayloadAction<{ service: State["mesServices"][number] }>
        ) => {
            const { service } = payload;

            assert(typeof service === "object");

            const { mesServices } = state;

            const oldService = mesServices.find(({ id }) => id === service.id);

            if (oldService === undefined) {
                return;
            }

            mesServices[mesServices.indexOf(oldService)] = service;
        },
        "cardStartWaiting": (
            state,
            { payload }: PayloadAction<{ id: State["mesServicesWaiting"][number] }>
        ) => {
            const { id } = payload;

            assert(typeof id === "string");

            state.mesServicesWaiting.push(id);
        },
        "cardStopWaiting": (
            state,
            { payload }: PayloadAction<{ id: State["mesServicesWaiting"][number] }>
        ) => {
            const { id } = payload;

            assert(typeof id === "string");

            const { mesServicesWaiting } = state;

            const index = mesServicesWaiting.indexOf(id);

            if (index < 0) {
                return;
            }

            mesServicesWaiting.splice(index, 1);
        }
    }
});

const { actions: syncActions } = slice;

export const actions = {
    ...id<Pick<typeof syncActions, "setServiceSelected" | "updateMonService">>(
        syncActions
    ),
    ...asyncThunks
};

export const thunks = {};

export const reducer = slice.reducer;
