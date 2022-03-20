import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Provider as ReactReduxProvider } from "react-redux";
import { createStore } from "core";
import { getCreateStoreParams } from "ui/env";
import type { ReturnType } from "tsafe/ReturnType";
import { injectTransferableEnvsInSearchParams } from "ui/envCarriedOverToKc";
import { injectGlobalStatesInSearchParams } from "powerhooks/useGlobalState";
import { Evt } from "evt";

type Props = {
    children: ReactNode;
};

export function CoreProvider(props: Props) {
    const { children } = props;

    const [store, setStore] = useState<ReturnType<typeof createStore> | undefined>(
        undefined,
    );

    useEffect(() => {
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
        ).then(setStore);
    }, []);

    if (store === undefined) {
        return null;
    }

    return <ReactReduxProvider store={store}>{children}</ReactReduxProvider>;
}
