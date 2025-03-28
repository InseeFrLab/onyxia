import type * as projectManagement from "core/usecases/projectManagement";
import { assert, type Equals } from "tsafe/assert";
import { same } from "evt/tools/inDepth/same";

export function getAreSameRestorableConfig(
    restorableConfiguration1: projectManagement.ProjectConfigs.RestorableServiceConfig,
    restorableConfiguration2: projectManagement.ProjectConfigs.RestorableServiceConfig
): boolean {
    for (const key of [
        "friendlyName",
        "isShared",
        "catalogId",
        "chartName",
        "chartVersion",
        "s3ConfigId",
        "helmValuesPatch"
    ] as const) {
        assert<
            Equals<
                typeof key,
                Exclude<
                    keyof projectManagement.ProjectConfigs.RestorableServiceConfig,
                    "creationTime"
                >
            >
        >();

        if (key === "helmValuesPatch") {
            if (
                restorableConfiguration1.helmValuesPatch.length !==
                restorableConfiguration2.helmValuesPatch.length
            ) {
                return false;
            }

            const sort = (
                helmValuesPatch: projectManagement.ProjectConfigs.RestorableServiceConfig["helmValuesPatch"]
            ) =>
                [...helmValuesPatch].sort((a, b) => {
                    const join = (path: (typeof a)["path"]) => path.join(".");
                    return join(a.path).localeCompare(join(b.path));
                });

            if (
                !same(
                    sort(restorableConfiguration1.helmValuesPatch),
                    sort(restorableConfiguration2.helmValuesPatch)
                )
            ) {
                return false;
            }

            continue;
        }

        const value1 = restorableConfiguration1[key];

        assert<Equals<typeof value1, string | boolean | undefined>>();

        const value2 = restorableConfiguration2[key];

        if (value1 !== value2) {
            return false;
        }
    }

    return true;
}
