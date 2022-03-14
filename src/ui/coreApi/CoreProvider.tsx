import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Provider as ReactReduxProvider } from "react-redux";
import { createStore } from "core";
import { getCreateStoreParams } from "ui/env";
import type { ReturnType } from "tsafe/ReturnType";
import { injectTransferableEnvsInSearchParams } from "ui/envCarriedOverToKc";
import { injectGlobalStatesInSearchParams } from "powerhooks/useGlobalState";

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
            }),
        ).then(setStore);
    }, []);

    if (store === undefined) {
        return null;
    }

    return <ReactReduxProvider store={store}>{children}</ReactReduxProvider>;
}
