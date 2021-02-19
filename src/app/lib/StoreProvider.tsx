
import type { ReactNode } from "react";
import { Provider as ReactReduxProvider } from "react-redux";
import { useAsync } from "react-async-hook";
import { createStore } from "lib/setup";
import type { CreateStoreParams } from "lib/setup";
import { id } from "evt/tools/typeSafety/id";
import { Evt } from "evt";
import memoize from "memoizee";
import { JSONSortStringify } from "app/tools/JSONSortStringify";
import { assert } from "evt/tools/typeSafety/assert";

export type Props = {
    createStoreParams: Omit<CreateStoreParams, "evtBackOnline" | "vaultCmdTranslationLogger">;
    children: ReactNode;
};


const memoizedCreateStore = memoize(
    async (createStoreParams: Props["createStoreParams"]) => {

        const evtBackOnline = Evt.from(window, "online").pipe(() => [id<void>(undefined)]);

        return createStore({
            ...createStoreParams,
            evtBackOnline,
        });

    },
    { 
        "normalizer": ([createStoreParams]) => JSONSortStringify(createStoreParams),
        "max": 1,
        "dispose": ()=> assert(false, "Only one instance of the store by process should be created")
    }

);


export function StoreProvider(props: Props) {

    const { createStoreParams, children } = props;

    const asyncCreateStore = useAsync(
        () => memoizedCreateStore(createStoreParams),
        [createStoreParams]
    );


    if (asyncCreateStore.error) {
        throw asyncCreateStore.error;
    }

    const { result: store } = asyncCreateStore;

    return (
        store === undefined ?
            null :
            <ReactReduxProvider store={store}>
                {children}
            </ReactReduxProvider>
    );

};




