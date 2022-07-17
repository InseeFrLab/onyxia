import type { BuildOnyxiaValue } from "js/utils/form-field";
import { useSelector, selectors } from "ui/coreApi";
import { useThunks } from "ui/coreApi";
import type { Store } from "core/setup";
import * as reactRedux from "react-redux";
/** useDispatch from "react-redux" but with correct return type for asyncThunkActions */
export const useDispatch = () => reactRedux.useDispatch<Store["dispatch"]>();

export function useGetBuildOnyxiaValue() {
    const { launcherThunks } = useThunks();

    const { userConfigs } = useSelector(selectors.userConfigs.userConfigs);

    async function getBuildOnyxiaValue(): Promise<BuildOnyxiaValue> {
        const mustacheParams = await launcherThunks.getOnyxiaValues();

        return {
            "s3": {
                ...mustacheParams.s3,
                "AWS_EXPIRATION": "",
            },
            "publicIp": mustacheParams.user.ip,
            "parsedJwt": {
                "email": mustacheParams.user.email,
                "familyName": mustacheParams.user.name,
                "firstName": mustacheParams.user.name,
                "username": mustacheParams.user.idep,
            },
            "secretExplorerUserHomePath": "...",
            userConfigs,
            "vaultClientConfig": {
                "baseUri": mustacheParams.vault.VAULT_ADDR,
                "engine": mustacheParams.vault.VAULT_MOUNT,
            },
            "oidcTokens": {
                "accessToken": "",
                "idToken": "",
                "refreshToken": "",
            },
            "vaultToken": mustacheParams.vault.VAULT_TOKEN,
        };
    }

    return { getBuildOnyxiaValue };
}
