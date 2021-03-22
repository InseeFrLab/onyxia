
import { useMemo, useEffect, useState } from "react";
import * as reactRedux from "react-redux";
import type { Store, RootState } from "lib/setup";
import { thunks } from "lib/setup";
import { userConfigsStateToUserConfigs } from "lib/useCases/userConfigs";
import type { BuildMustacheViewParams } from "js/utils/form-field";
import type { AppConstant } from "lib/useCases/appConstants";
import { assert } from "evt/tools/typeSafety/assert";
import { useIsDarkModeEnabled } from "app/theme/useIsDarkModeEnabled";
import { useEffectOnValueChange } from "powerhooks";

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


/**
 * This hook to two things:
 * - It sets whether or not the dark mode is enabled based on 
 * the value stored in user configs.
 * - Each time the dark mode it changed it changes the value in
 * user configs.
 */
export function useSyncDarkModeWithValueInProfile() {

    const { isUserLoggedIn } = useAppConstants();

    const { isDarkModeEnabled, setIsDarkModeEnabled } = useIsDarkModeEnabled();

    const dispatch = useDispatch();

    const userConfigsIsDarkModeEnabled = useSelector(
        state =>
            !isUserLoggedIn ?
                undefined :
                state.userConfigs.isDarkModeEnabled.value
    );

    useEffect(
        () => {

            if (userConfigsIsDarkModeEnabled === undefined) {
                return;
            }

            setIsDarkModeEnabled(userConfigsIsDarkModeEnabled);

        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    useEffectOnValueChange(
        () => {

            if( !isUserLoggedIn ){
                return;
            }

            dispatch(
                thunks.userConfigs.changeValue({
                    "key": "isDarkModeEnabled",
                    "value": isDarkModeEnabled
                })
            );

        },
        [isDarkModeEnabled]
    );


}

export function useEvtSecretsManagerTranslation() {

    const { getEvtSecretsManagerTranslation } = useAppConstants({ "assertIsUserLoggedInIs": true });

    const [{ evtSecretsManagerTranslation }] = useState(() => getEvtSecretsManagerTranslation());

    return { evtSecretsManagerTranslation };

}



