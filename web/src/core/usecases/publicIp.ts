import { id } from "tsafe/id";
import { Evt } from "evt";
import type { Thunks, State as RootState } from "core/bootstrap";
import { createUsecaseActions, createUsecaseContextApi } from "redux-clean-architecture";

type State = string | null;

export const name = "publicIp";

export const { reducer, actions } = createUsecaseActions({
    name,
    "initialState": id<State>(null),
    "reducers": {
        "fetched": (_state, { payload }: { payload: string }) => payload,
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
            const [dispatch, , rootContext] = args;

            const { onyxiaApi } = rootContext;

            const publicIp = await onyxiaApi.getIp();

            const context = getContext(rootContext);

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

export const selectors = (() => {
    const main = (rootState: RootState): string | null => {
        const publicIp = rootState[name];
        return publicIp;
    };

    return { main };
})();
