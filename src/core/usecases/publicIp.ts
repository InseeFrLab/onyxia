import type { ThunkAction } from "../setup";
import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import { id } from "tsafe/id";
import { Evt } from "evt";
import { createUsecaseContextApi } from "redux-clean-architecture";

type PublicIpState = string | null;

export const name = "publicIp";

export const { reducer, actions } = createSlice({
    name,
    "initialState": id<PublicIpState>(null),
    "reducers": {
        "fetched": (_, { payload }: PayloadAction<string>) => payload,
        "publicIpMightHaveChanged": () => null,
    },
});

//const isEvtOnlineRegisteredByStoreInst = new WeakMap<ThunksExtraArgument, true>();

const { getContext } = createUsecaseContextApi(() => ({
    "isEvtOnlineRegisteredByStoreInst": false,
}));

export const thunks = {
    "fetch":
        (): ThunkAction<Promise<{ publicIp: string }>> =>
        async (...args) => {
            const [dispatch, , extraArg] = args;

            const { onyxiaApiClient } = extraArg;

            const publicIp = await onyxiaApiClient.getIp();

            const context = getContext(extraArg);

            if (!context.isEvtOnlineRegisteredByStoreInst) {
                Evt.from(window, "online").attach(() => {
                    dispatch(actions.publicIpMightHaveChanged());

                    onyxiaApiClient.getIp.clear();

                    dispatch(thunks.fetch());
                });

                context.isEvtOnlineRegisteredByStoreInst = true;
            }

            dispatch(actions.fetched(publicIp));

            return { publicIp };
        },
};
