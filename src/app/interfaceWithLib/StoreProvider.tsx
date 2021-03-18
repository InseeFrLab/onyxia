
import type { ReactNode } from "react";
import { Provider as ReactReduxProvider } from "react-redux";
import { useAsync } from "react-async-hook";
import { createStore } from "lib/setup";
import type { CreateStoreParams } from "lib/setup";
import { id } from "evt/tools/typeSafety/id";
import { Evt } from "evt";
import { JSONSortStringify } from "app/tools/JSONSortStringify";
import { assert } from "evt/tools/typeSafety/assert";
import { getIsDarkModeEnabledOsDefault } from "app/theme/useIsDarkModeEnabled";
import { useEffectOnValueChange } from "powerhooks";

export type Props = {
    createStoreParams: Omit<CreateStoreParams, "evtBackOnline" | "getIsDarkModeEnabledValueForProfileInitialization">;
    children: ReactNode;
};

export function StoreProvider(props: Props) {

    const { createStoreParams, children } = props;

    const asyncCreateStore = useAsync(
        () => createStore({
            ...createStoreParams,
            "evtBackOnline": Evt.from(window, "online").pipe(() => [id<void>(undefined)]),
            "getIsDarkModeEnabledValueForProfileInitialization": getIsDarkModeEnabledOsDefault
        }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    /** This is so we get an error if we try to create a new instance of the store */
    useEffectOnValueChange(
        () => assert(false, "Only one instance of the store by process should be created"),
        [JSONSortStringify(createStoreParams)]
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




