
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
    createStoreParams: Omit<CreateStoreParams, "evtBackOnline">;
    children: React.ReactNode;
};

export function StoreProvider(props: Omit<Props, "evtBackOnline">) {

    const { createStoreParams, children } = props;

    const { result: store, error } = useAsync(
        () => createStore({
            ...createStoreParams,
            "evtBackOnline": Evt.from(window, "online").pipe(() => [id<void>(undefined)]),
        }),
        [createStoreParams]
    );

    if (error) {
        throw error;
    }

    return (
        store === undefined ?
            <Loader em={30} /> :
            <ReactReduxProvider store={store}>
                {children}
            </ReactReduxProvider>
    );

};

