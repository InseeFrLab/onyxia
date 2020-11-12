import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { AppThunk } from "../setup";
import type { getVaultClientProxyWithTranslator } from "../ports/VaultClient";
import { createObjectThatThrowsIfAccessed } from "../utils/createObjectThatThrowsIfAccessed";

export type VaultTranslatorState = {
    selectedClientType: Parameters<typeof getVaultClientProxyWithTranslator>[0]["translateForClientType"];
    evtTranslation: ReturnType<typeof getVaultClientProxyWithTranslator>["evtTranslation"];
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
        (params: { clientType: VaultTranslatorState["selectedClientType"]; }): AppThunk<void> => (...args) => {

            const { clientType } = params;

            const [dispatch, , { evtVaultCliTranslation }] = args;

            switch (clientType) {
                case "CLI":
                    dispatch(
                        actions.translatorSelected({
                            "selectedClientType": clientType,
                            "evtTranslation": evtVaultCliTranslation
                        })
                    );
            }

        }
};