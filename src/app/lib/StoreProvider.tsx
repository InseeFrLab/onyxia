
import React from "react";
import { Provider as ReactReduxProvider } from "react-redux";
//TODO: setAuthenticated same action type in app and user, see how we do that with redux/toolkit
import { useAsync } from "react-async-hook";
import Loader from "js/components/commons/loader";
import { createStore } from "lib/setup";
import type { CreateStoreParams } from "lib/setup";
import { id } from "evt/tools/typeSafety/id";
import { Evt } from "evt";
import memoize from "memoizee";

export type Props = {
    createStoreParams: Omit<CreateStoreParams, "evtBackOnline" | "vaultCmdTranslationLogger">;
    doLogSecretManager: boolean;
    children: React.ReactNode;
};

const memoizedCreateStore = (() => {

    const evtBackOnline= Evt.from(window, "online").pipe(() => [id<void>(undefined)]);
    //const vaultCmdTranslationLogger= console.log.bind(console);
    const vaultCmdTranslationLogger= ()=>{};

    const f = memoize(
        (createStoreParamsStr: string) => 
            createStore({
                ...JSON.parse(createStoreParamsStr) as Props["createStoreParams"],
                evtBackOnline,
                vaultCmdTranslationLogger
            })
    )

    return (params: { createStoreParams: Props["createStoreParams"]; }) => 
        f(JSON.stringify(params.createStoreParams));

})();

export function StoreProvider(props: Props) {

    const { createStoreParams, children } = props;

    const asyncCreateStore = useAsync(
        () => memoizedCreateStore({ createStoreParams }),
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




