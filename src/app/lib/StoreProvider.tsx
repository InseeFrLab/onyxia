
import React from "react";
import { Provider as ReactReduxProvider } from "react-redux";
//TODO: setAuthenticated same action type in app and user, see how we do that with redux/toolkit
import { useAsync } from "react-async-hook";
import Loader from "js/components/commons/loader";

import { createStore } from "lib/setup";
import type { CreateStoreParams } from "lib/setup";

export type Props = {
    createStoreParams: CreateStoreParams;
    children: React.ReactNode;
};

export function StoreProvider(props: Props) {

    const { createStoreParams, children } = props;

    const { result: store, error } = useAsync(
        () => createStore(createStoreParams),
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

