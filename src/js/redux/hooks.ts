
import { useState } from "react";
import * as reactRedux from "react-redux";
import type { Store, RootState } from "lib/setup";
import { thunks } from "lib/setup";
import { removeChangeStateFromUserProfileInVaultState } from "lib/useCases/userProfileInVault";
import type { BuildMustacheViewParams } from "js/utils/form-field";

/** useDispatch from "react-redux" but with correct return type for asyncThunkActions */
export const useDispatch = () => reactRedux.useDispatch<Store["dispatch"]>();

export const useSelector: reactRedux.TypedUseSelectorHook<RootState> = reactRedux.useSelector;

export const useUserProfile = () => {

    const dispatch = useDispatch();

    const [userProfile] = useState(() => dispatch(thunks.user.getUserProfile()));

    return { userProfile };

};

export const useMustacheParams = () => {

    const dispatch = useDispatch();

    const { oidcTokens, vaultToken } = useSelector(state => state.tokens);
    const { ip, s3 } = useSelector(state => state.user);
    const { userProfile } = useUserProfile();
    const userProfileInVault = useSelector(
        state => removeChangeStateFromUserProfileInVaultState(state.userProfileInVault)
    );
    const [{ keycloakConfig, vaultConfig }] = useState(
        () =>
            dispatch(
                thunks.tokens
                    .getParamsNeededToInitializeKeycloakAndVolt()
            )
    );


    const mustacheParams: Omit<BuildMustacheViewParams, "s3"> & { s3: BuildMustacheViewParams["s3"] | undefined; } = {
        s3,
        ip,
        userProfile,
        userProfileInVault,
        keycloakConfig,
        vaultConfig,
        oidcTokens,
        vaultToken
    };

    return { mustacheParams };

};

export const useIsUserLoggedIn = () => {

    const dispatch = useDispatch();

    const isUserLoggedIn = dispatch(thunks.app.getIsUserLoggedIn());

    return { isUserLoggedIn };

}
