
import { useMemo, useState } from "react";
import * as reactRedux from "react-redux";
import type { Store, RootState } from "lib/setup";
import { thunks } from "lib/setup";
import { userConfigsStateToUserConfigs } from "lib/useCases/userConfigs";
import type { BuildMustacheViewParams } from "js/utils/form-field";
import type { AppConstant } from "lib/useCases/appConstants";
import { assert } from "evt/tools/typeSafety/assert";
import { useIsDarkModeEnabled as useLocalStorageIsDarkModeEnabled } from "app/tools/hooks/useIsDarkModeEnabled";
import { useConstCallback } from "powerhooks";
import { id } from "evt/tools/typeSafety/id";

/** useDispatch from "react-redux" but with correct return type for asyncThunkActions */
export const useDispatch = () => reactRedux.useDispatch<Store["dispatch"]>();

export const useSelector: reactRedux.TypedUseSelectorHook<RootState> = reactRedux.useSelector;

export function useAppConstants(): AppConstant;
export function useAppConstants(params: { assertIsUserLoggedInIs: true; }): AppConstant.LoggedIn;
export function useAppConstants(params: { assertIsUserLoggedInIs: false; }): AppConstant.NotLoggedIn;
export function useAppConstants(params?: { assertIsUserLoggedInIs: boolean; }): AppConstant {

    const { assertIsUserLoggedInIs } = params ?? {};

    const dispatch = useDispatch();

    const appConstants = useMemo(
        () => dispatch(thunks.appConstants.getAppConstants()),
        [dispatch]
    );

    assert(
        assertIsUserLoggedInIs === undefined ||
        assertIsUserLoggedInIs === appConstants.isUserLoggedIn
    );

    return appConstants;

}

export function useMustacheParams() {

    const { oidcTokens, vaultToken } = useSelector(state => state.tokens);
    const { ip, s3 } = useSelector(state => state.user);

    const {
        userProfile,
        keycloakConfig,
        vaultClientConfig
    } = useAppConstants({ "assertIsUserLoggedInIs": true });

    const userConfigs = useSelector(
        state => userConfigsStateToUserConfigs(state.userConfigs)
    );

    const mustacheParams: Omit<BuildMustacheViewParams, "s3"> & { s3: BuildMustacheViewParams["s3"] | undefined; } = {
        s3,
        ip,
        userProfile,
        userConfigs,
        keycloakConfig,
        vaultClientConfig,
        oidcTokens,
        vaultToken
    };

    return { mustacheParams };

}

export function useIsBetaModeEnabled(): {
    isBetaModeEnabled: boolean;
    setIsBetaModeEnabled(value: boolean): void;
} {

    const dispatch = useDispatch();

    const { isUserLoggedIn } = useAppConstants();

    const isBetaModeEnabled = useSelector(
        state =>
            !isUserLoggedIn ?
                false :
                state.userConfigs.isBetaModeEnabled.value
    );

    return {
        isBetaModeEnabled,
        "setIsBetaModeEnabled": value =>
            dispatch(
                thunks.userConfigs.changeValue({
                    "key": "isBetaModeEnabled",
                    value
                })
            )
    };

};

export function useIsDarkModeEnabled(): ReturnType<typeof useLocalStorageIsDarkModeEnabled> {

    const { isUserLoggedIn } = useAppConstants();

    const localStorageImpl = useLocalStorageIsDarkModeEnabled();

    const dispatch = useDispatch();

    const isDarkModeEnabled = useSelector(
        state =>
            !isUserLoggedIn ?
                false /*never*/ :
                state.userConfigs.isDarkModeEnabled.value
    );

    const setIsDarkModeEnabled = useConstCallback(
        id<typeof localStorageImpl["setIsDarkModeEnabled"]>(
            valueOrGetValue => {

                const value = typeof valueOrGetValue === "function" ? 
                    valueOrGetValue(isDarkModeEnabled) : 
                    valueOrGetValue;

                dispatch(
                    thunks.userConfigs.changeValue({
                        "key": "isDarkModeEnabled",
                        value
                    })
                ).then(() => localStorageImpl.setIsDarkModeEnabled(value));
            }
        )
    );

    return isUserLoggedIn ? { isDarkModeEnabled, setIsDarkModeEnabled } : localStorageImpl;



};

export function useEvtSecretsManagerTranslation() {

    const { getEvtSecretsManagerTranslation } = useAppConstants({ "assertIsUserLoggedInIs": true });

    const [{ evtSecretsManagerTranslation }] = useState(() => getEvtSecretsManagerTranslation());

    return { evtSecretsManagerTranslation };

}



