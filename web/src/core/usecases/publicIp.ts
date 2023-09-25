import type { Thunks } from "../core";
import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import { id } from "tsafe/id";
import { Evt } from "evt";
import { createUsecaseContextApi } from "redux-clean-architecture";

type State = string | null;

export const name = "publicIp";

export const { reducer, actions } = createSlice({
    name,
    "initialState": id<State>(null),
    "reducers": {
        "fetched": (_, { payload }: PayloadAction<string>) => payload,
        "publicIpMightHaveChanged": () => null
    }
});

//const isEvtOnlineRegisteredByStoreInst = new WeakMap<ThunksExtraArgument, true>();

const { getContext } = createUsecaseContextApi(() => ({
    "isEvtOnlineRegisteredByStoreInst": false
}));

export const thunks = {
    "fetch":
        () =>
        async (...args): Promise<{ publicIp: string }> => {
            const [dispatch, , extraArg] = args;

            const { onyxiaApi } = extraArg;

            const publicIp = await onyxiaApi.getIp();

            const context = getContext(extraArg);

            if (!context.isEvtOnlineRegisteredByStoreInst) {
                Evt.from(window, "online").attach(() => {
                    dispatch(actions.publicIpMightHaveChanged());

                    onyxiaApi.getIp.clear();

                    dispatch(thunks.fetch());
                });

                context.isEvtOnlineRegisteredByStoreInst = true;
            }

            dispatch(actions.fetched(publicIp));

            return { publicIp };
        }
} satisfies Thunks;
