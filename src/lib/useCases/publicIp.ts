import type { AppThunk } from "../setup";
import type { PayloadAction } from "@reduxjs/toolkit";
import { createSlice } from "@reduxjs/toolkit";
import { id } from "tsafe/id";
import { Evt } from "evt";
import type { Dependencies } from "../setup";

export const name = "publicIp";

type PublicIpState = string | null;

const { reducer, actions } = createSlice({
    name,
    "initialState": id<PublicIpState>(null),
    "reducers": {
        "fetched": (_, { payload }: PayloadAction<string>) => payload,
        "publicIpMightHaveChanged": () => null,
    },
});

export { reducer };

const isEvtOnlineRegisteredByDependencyRef = new WeakMap<Dependencies, true>();

export const thunks = {
    "fetch":
        (): AppThunk<Promise<{ publicIp: string }>> =>
        async (...args) => {
            const [dispatch, , dependencies] = args;

            const { onyxiaApiClient } = dependencies;

            const publicIp = await onyxiaApiClient.getIp();

            if (!isEvtOnlineRegisteredByDependencyRef.has(dependencies)) {
                Evt.from(window, "online").attach(() => {
                    dispatch(actions.publicIpMightHaveChanged());

                    onyxiaApiClient.getIp.clear();

                    dispatch(thunks.fetch());
                });

                isEvtOnlineRegisteredByDependencyRef.set(dependencies, true);
            }

            dispatch(actions.fetched(publicIp));

            return { publicIp };
        },
};
