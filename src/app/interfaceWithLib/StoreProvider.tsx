
import type { ReactNode } from "react";
import { Provider as ReactReduxProvider } from "react-redux";
import { useAsync } from "react-async-hook";
import { createStore } from "lib/setup";
import type { CreateStoreParams } from "lib/setup";
import { getIsDarkModeEnabledOsDefault } from "onyxia-ui";
import memoize from "memoizee";

export type StoreInitializationParams = Omit<
        CreateStoreParams,
        "getIsDarkModeEnabledValueForProfileInitialization"
    >;


export type Props = {
    /** 
     * We use a getter instead of just an object to enable 
     * lazy evaluation. 
     * The getter will be called ONLY ONCE.
     * You can't change the store parameters after it has been
     * first initialized. Swiping the reference of this getter will
     * have no effect.
     */
    getStoreInitializationParams(): StoreInitializationParams;
    children: ReactNode;
};

//NOTE: Create store can only be called once
const createStore_memo = memoize(
    (storeInitializationParams: StoreInitializationParams)=> 
        createStore({
            ...storeInitializationParams,
            "getIsDarkModeEnabledValueForProfileInitialization": getIsDarkModeEnabledOsDefault
        }),
    { "promise": true }
);

export function StoreProvider(props: Props) {

    const { getStoreInitializationParams, children } = props;

    const asyncCreateStore = useAsync(
        ()=> createStore_memo(getStoreInitializationParams()),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
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




