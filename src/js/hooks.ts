import type { BuildOnyxiaValue } from "js/utils/form-field";
import { useCoreState, selectors } from "core";
import { useCoreFunctions } from "core";
import type { Core } from "core/setup";
import * as reactRedux from "react-redux";
/** useDispatch from "react-redux" but with correct return type for asyncThunkActions */
export const useDispatch = () => reactRedux.useDispatch<Core["dispatch"]>();

export function useGetBuildOnyxiaValue() {
    const { launcher } = useCoreFunctions();

    const { userConfigs } = useCoreState(selectors.userConfigs.userConfigs);

    async function getBuildOnyxiaValue(): Promise<BuildOnyxiaValue> {
        const mustacheParams = await launcher.getOnyxiaValues();

        return {
            "s3": {
                ...mustacheParams.s3,
                "AWS_EXPIRATION": ""
            },
            "publicIp": mustacheParams.user.ip,
            "parsedJwt": {
                "email": mustacheParams.user.email,
                "familyName": mustacheParams.user.name,
                "firstName": mustacheParams.user.name,
                "username": mustacheParams.user.idep
            },
            "secretExplorerUserHomePath": "...",
            userConfigs,
            "vaultClientConfig": {
                "baseUri": mustacheParams.vault.VAULT_ADDR,
                "engine": mustacheParams.vault.VAULT_MOUNT
            },
            "oidcTokens": {
                "accessToken": "",
                "idToken": "",
                "refreshToken": ""
            },
            "vaultToken": mustacheParams.vault.VAULT_TOKEN
        };
    }

    return { getBuildOnyxiaValue };
}
