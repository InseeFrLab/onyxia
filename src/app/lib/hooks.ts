
import { useMemo, useState } from "react";
import * as reactRedux from "react-redux";
import type { Store, RootState } from "lib/setup";
import { thunks } from "lib/setup";
import { userConfigsStateToUserConfigs } from "lib/useCases/userConfigs";
import type { BuildMustacheViewParams } from "js/utils/form-field";
import type { AppConstant } from "lib/useCases/appConstants";
import { assert } from "evt/tools/typeSafety/assert";

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

export function useIsDarkModeEnabled(): {
    isDarkModeEnabled: boolean;
    setIsDarkModeEnabled(value: boolean): void;
} {

    const dispatch = useDispatch();

    const { isUserLoggedIn, isOsPrefersColorSchemeDark } = useAppConstants();

    const isDarkModeEnabled = useSelector(
        state =>
            !isUserLoggedIn ?
                isOsPrefersColorSchemeDark :
                state.userConfigs.isDarkModeEnabled.value
    );

    return {
        isDarkModeEnabled,
        "setIsDarkModeEnabled": value =>
            dispatch(
                thunks.userConfigs.changeValue({
                    "key": "isDarkModeEnabled",
                    value
                })
            )
    };

};

export function useEvtSecretsManagerTranslation() {

    const { getEvtSecretsManagerTranslation } = useAppConstants({ "assertIsUserLoggedInIs": true });

    const [{ evtSecretsManagerTranslation }] = useState(() => getEvtSecretsManagerTranslation());

    return { evtSecretsManagerTranslation };

}



