
import type { ReactNode } from "react";
import { Provider as ReactReduxProvider } from "react-redux";
import { useAsync } from "react-async-hook";
import { createStore } from "lib/setup";
import type { CreateStoreParams } from "lib/setup";
import { id } from "evt/tools/typeSafety/id";
import { Evt } from "evt";
import { getIsDarkModeEnabledOsDefault } from "app/theme/useIsDarkModeEnabled";

export type Props = {
    /** 
     * We use a getter instead of just an object to enable 
     * lazy evaluation. 
     * The getter will be called ONLY ONCE.
     * You can't change the store parameters after it has been
     * first initialized. Swiping the reference of this getter will
     * have no effect.
     */
    getStoreInitializationParams(): Omit<
        CreateStoreParams,
        "evtBackOnline" | "getIsDarkModeEnabledValueForProfileInitialization"
    >;
    children: ReactNode;
};

export function StoreProvider(props: Props) {

    const { getStoreInitializationParams, children } = props;

    const asyncCreateStore = useAsync(
        () => createStore({
            ...getStoreInitializationParams(),
            "evtBackOnline": Evt.from(window, "online").pipe(() => [id<void>(undefined)]),
            "getIsDarkModeEnabledValueForProfileInitialization": getIsDarkModeEnabledOsDefault
        }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    console.log(asyncCreateStore);

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




