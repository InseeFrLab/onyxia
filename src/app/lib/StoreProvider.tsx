
import React from "react";
import { Provider as ReactReduxProvider } from "react-redux";
//TODO: setAuthenticated same action type in app and user, see how we do that with redux/toolkit
import { useAsync } from "react-async-hook";
import Loader from "js/components/commons/loader";
import { createStore } from "lib/setup";
import type { CreateStoreParams } from "lib/setup";
import { id } from "evt/tools/typeSafety/id";
import { Evt } from "evt";

export type Props = {
    createStoreParams: Omit<CreateStoreParams, "evtBackOnline" | "vaultCmdTranslationLogger">;
    doLogSecretManager: boolean;
    children: React.ReactNode;
};

export function StoreProvider(props: Props) {

    const { createStoreParams, children } = props;

    const asyncCreateStore = useAsync(
        () => createStore({
            ...createStoreParams,
            "evtBackOnline": Evt.from(window, "online").pipe(() => [id<void>(undefined)]),
            "vaultCmdTranslationLogger": console.log.bind(console)
        }),
        [createStoreParams]
    );

    if (asyncCreateStore.error) {
        throw asyncCreateStore.error;
    }

    const { result: store } = asyncCreateStore;

    return (
        store === undefined ?
            <Loader em={30} /> :
            <ReactReduxProvider store={store}>
                {children}
            </ReactReduxProvider>
    );

};




