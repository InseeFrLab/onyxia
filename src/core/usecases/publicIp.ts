import type { ThunkAction, ThunksExtraArgument } from "../setup";
import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import { id } from "tsafe/id";
import { Evt } from "evt";

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

const isEvtOnlineRegisteredByStoreInst = new WeakMap<ThunksExtraArgument, true>();

export const thunks = {
    "fetch":
        (): ThunkAction<Promise<{ publicIp: string }>> =>
        async (...args) => {
            const [dispatch, , extraArg] = args;

            const { onyxiaApiClient } = extraArg;

            const publicIp = await onyxiaApiClient.getIp();

            if (!isEvtOnlineRegisteredByStoreInst.has(extraArg)) {
                Evt.from(window, "online").attach(() => {
                    dispatch(actions.publicIpMightHaveChanged());

                    onyxiaApiClient.getIp.clear();

                    dispatch(thunks.fetch());
                });

                isEvtOnlineRegisteredByStoreInst.set(extraArg, true);
            }

            dispatch(actions.fetched(publicIp));

            return { publicIp };
        },
};
