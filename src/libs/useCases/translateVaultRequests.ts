import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { AppThunk } from "../setup";
import type { getVaultClientProxyWithTranslator } from "../ports/VaultClient";
import { createObjectThatThrowsIfAccessed } from "../utils/createObjectThatThrowsIfAccessed";

export type VaultTranslatorState = {
    selectedVaultClientType: Parameters<typeof getVaultClientProxyWithTranslator>[0]["translateForClientType"];
};

export const sliceName = "translateVaultRequests";

const { reducer, actions } = createSlice({
    "name": sliceName,
    "initialState": createObjectThatThrowsIfAccessed<VaultTranslatorState>(
        "A translator should have been selected in the store initialization"
    ),
    "reducers": {
        "translatorSelected": (...[, { payload }]: [any, PayloadAction<VaultTranslatorState>]) => payload,
    }
});

export { reducer };

export const thunks = {
    "selectTranslator":
        (params: { clientType: VaultTranslatorState["selectedVaultClientType"]; }): AppThunk<void> => dispatch => {

            const { clientType } = params;


            switch (clientType) {
                case "CLI":
                    dispatch(
                        actions.translatorSelected({
                            "selectedVaultClientType": clientType
                        })
                    );
            }

        },
    "getSelectedTranslator":
        () => (...[, getState, { evtVaultCliTranslation }]: Parameters<AppThunk<void>>) => {

            const key = "evtVaultTranslation";

            switch (getState().translateVaultRequests.selectedVaultClientType) {
                case "CLI":
                    return { [key]: evtVaultCliTranslation };
            }

        },
};