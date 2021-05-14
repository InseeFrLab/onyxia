
import { useMemo, useEffect, useState } from "react";
import * as reactRedux from "react-redux";
import type { Store, RootState } from "lib/setup";
import { pure } from "lib/setup";
import { thunks } from "lib/setup";
import { userConfigsStateToUserConfigs } from "lib/useCases/userConfigs";
import type { BuildMustacheViewParams } from "js/utils/form-field";
import type { AppConstant } from "lib/useCases/appConstants";
import { assert } from "tsafe/assert";
import { useIsDarkModeEnabled } from "app/theme/useIsDarkModeEnabled";
import { useEffectOnValueChange } from "powerhooks";
import { useLng } from "app/i18n/useLng";
import type { SupportedLanguage } from "app/i18n/resources";
import { typeGuard } from "tsafe/typeGuard";
import { id } from "tsafe/id";
import { usePublicIp } from "app/tools/usePublicIp";

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

export function useSelectedRegion(){

    const appConstants= useAppConstants();

	const deploymentRegionId = useSelector(state=> 
		appConstants.isUserLoggedIn ?
			state.userConfigs.deploymentRegionId.value :
			null
	);

	const selectedRegion = !appConstants.isUserLoggedIn ? 
		undefined : 
		appConstants.regions.find(({ id }) => id === deploymentRegionId);

    return selectedRegion;

};

export function useSecretExplorerUserHomePath() {

    const { parsedJwt: { preferred_username } } = useAppConstants({ "assertIsUserLoggedInIs": true });
    const secretExplorerUserHomePath = pure.secretExplorer.getUserHomePath({ preferred_username });
    return { secretExplorerUserHomePath };

};

export function useMustacheParams() {

    const { oidcTokens, vaultToken } = useSelector(state => state.tokens);
    const { s3 } = useSelector(state => state.user);

    const {
        parsedJwt,
        vaultClientConfig
    } = useAppConstants({ "assertIsUserLoggedInIs": true });

    const { secretExplorerUserHomePath } = useSecretExplorerUserHomePath();

    const userConfigs = useSelector(
        state => userConfigsStateToUserConfigs(state.userConfigs)
    );

    const { publicIp } = usePublicIp();

    const mustacheParams: Omit<BuildMustacheViewParams, "s3"> & { s3: BuildMustacheViewParams["s3"] | undefined; } = {
        s3,
        publicIp,
        parsedJwt,
        secretExplorerUserHomePath,
        userConfigs,
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

/** On the login pages hosted by keycloak the user can select 
 * a language, we want to use this language on the app.
 * For example we want that if a user selects english on the 
 * register page while signing in that the app be set to english
 * automatically. 
 * This is what this hook does it look for the language selected 
 * at login time in the oidc JWT and if it is a language available
 * on the app, it applies it.
 */
export function useApplyLanguageSelectedAtLogin() {

    const appConstants = useAppConstants();

    const { setLng } = useLng();

    useEffect(
        () => {

            if (!appConstants.isUserLoggedIn) {
                return;
            }

            const { locale } = appConstants.parsedJwt;

            if (
                !typeGuard<SupportedLanguage>(
                    locale,
                    locale in id<Record<SupportedLanguage, null>>({ "en": null, "fr": null })
                )
            ) {
                return;
            }

            setLng(locale);

        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

}


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

            if (!isUserLoggedIn) {
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



