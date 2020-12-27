
import React from "react";
import { Provider as ReactReduxProvider } from "react-redux";
//TODO: setAuthenticated same action type in app and user, see how we do that with redux/toolkit
import { useAsync } from "react-async-hook";
import Loader from "js/components/commons/loader";
import { createStore } from "lib/setup";
import type { CreateStoreParams } from "lib/setup";
import { id } from "evt/tools/typeSafety/id";
import { Evt } from "evt";
import { useEvt } from "evt/hooks";
import { useAppConstants } from "./hooks";

export type Props = {
    createStoreParams: Omit<CreateStoreParams, "evtBackOnline">;
    doLogSecretManager: boolean;
    children: React.ReactNode;
};

export function StoreProvider(props: Omit<Props, "evtBackOnline">) {

    const { createStoreParams, doLogSecretManager, children } = props;

    const asyncCreateStore = useAsync(
        () => createStore({
            ...createStoreParams,
            "evtBackOnline": Evt.from(window, "online").pipe(() => [id<void>(undefined)]),
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
                {doLogSecretManager && <SecretManagerLogger />}
                {children}
            </ReactReduxProvider>
    );

};

function SecretManagerLogger() {

    const appConstants = useAppConstants();

    useEvt(ctx => {

        if (!appConstants.isUserLoggedIn) {
            return;
        }

        const { evtSecretsManagerTranslation } = appConstants;

        evtSecretsManagerTranslation.attach(
            ({ type }) => type === "cmd",
            ctx,
            cmd => evtSecretsManagerTranslation.attachOnce(
                ({ cmdId }) => cmdId === cmd.cmdId,
                ctx,
                resp => console.log(
                    `%c$ ${cmd.translation}\n\n${resp.translation}`,
                    'background: #222; color: #bada55'
                )
            )
        );

    }, [appConstants]);

    return null;

}



