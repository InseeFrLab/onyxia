import { userConfigsStateToUserConfigs } from "lib/useCases/userConfigs";
import type { BuildMustacheViewParams } from "js/utils/form-field";
import { getPublicIp } from "lib/tools/getPublicIp";
import { useAsync } from "react-async-hook";
import {
    useSelector,
    useAppConstants,
    useSecretExplorerUserHomePath,
} from "app/interfaceWithLib";

export function useMustacheParams() {
    const { s3 } = useSelector(state => state.user);

    const { parsedJwt, vaultClientConfig } = useAppConstants({
        "assertIsUserLoggedInIs": true,
    });

    const { secretExplorerUserHomePath } = useSecretExplorerUserHomePath();

    const userConfigs = useSelector(state =>
        userConfigsStateToUserConfigs(state.userConfigs),
    );

    const { result: publicIp } = useAsync(getPublicIp, []);

    const mustacheParams: Omit<BuildMustacheViewParams, "s3"> & {
        s3: BuildMustacheViewParams["s3"] | undefined;
    } = {
        s3,
        "publicIp": publicIp ?? "0.0.0.0",
        parsedJwt,
        secretExplorerUserHomePath,
        userConfigs,
        vaultClientConfig,
        "oidcTokens": {
            "accessToken": "",
            "idToken": "",
            "refreshToken": "",
        },
        "vaultToken": "",
    };

    return { mustacheParams };
}
