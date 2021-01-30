
import { Provider as ReactReduxProvider } from "react-redux";
import { useAsync } from "react-async-hook";
import Loader from "js/components/commons/loader";
import { createStore } from "lib/setup";
import type { CreateStoreParams } from "lib/setup";
import { id } from "evt/tools/typeSafety/id";
import { Evt } from "evt";
import memoize from "memoizee";
import { JSONSortStringify } from "app/tools/JSONSortStringify";
import { assert } from "evt/tools/typeSafety/assert";

export type Props = {
    createStoreParams: Omit<CreateStoreParams, "evtBackOnline" | "vaultCmdTranslationLogger">;
    children: React.ReactNode;
};


const memoizedCreateStore = memoize(
    (createStoreParams: Props["createStoreParams"]) => {

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
            <Loader em={30} /> :
            <ReactReduxProvider store={store}>
                {children}
            </ReactReduxProvider>
    );

};




