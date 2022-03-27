import type { ReactNode } from "react";
import { useEffect } from "react";
import { Provider as ReactReduxProvider } from "react-redux";
import { createStore } from "core";
import { getCreateStoreParams } from "ui/env";
import type { ReturnType } from "tsafe/ReturnType";
import { injectTransferableEnvsInSearchParams } from "ui/envCarriedOverToKc";
import { injectGlobalStatesInSearchParams } from "powerhooks/useGlobalState";
import { Evt } from "evt";
import { useRerenderOnStateChange } from "evt/hooks";

type Props = {
    children: ReactNode;
};

const evtStore = Evt.create<ReturnType<typeof createStore> | undefined>(undefined);

export function CoreProvider(props: Props) {
    const { children } = props;

    useRerenderOnStateChange(evtStore);

    const store = evtStore.state;

    useEffect(() => {
        if (store !== undefined) {
            return;
        }

        createStore(
            getCreateStoreParams({
                "transformUrlBeforeRedirectToLogin": url =>
                    [url]
                        .map(injectTransferableEnvsInSearchParams)
                        .map(injectGlobalStatesInSearchParams)[0],
                "evtUserActivity": Evt.merge([
                    Evt.from(document, "mousemove"),
                    Evt.from(document, "keydown"),
                ]).pipe(() => [undefined as void]),
            }),
        ).then(store => (evtStore.state = store));
    }, []);

    if (store === undefined) {
        return null;
    }

    return <ReactReduxProvider store={store}>{children}</ReactReduxProvider>;
}
