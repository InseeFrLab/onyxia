import type { SecretsManager } from "core/ports/SecretsManager";
import { ProjectConfigs } from "./ProjectConfigs";
import { assert, type Equals } from "tsafe/assert";
import { join as pathJoin } from "pathe";
import { id } from "tsafe/id";

export async function clearProjectConfigs(params: {
    projectVaultTopDirPath_reserved: string;
    secretsManager: SecretsManager;
}) {
    const { projectVaultTopDirPath_reserved, secretsManager } = params;

    const files = await secretsManager
        .list({
            path: projectVaultTopDirPath_reserved
        })
        .then(
            async ({ files }) => files,
            () => {
                console.log("The above error is ok");
                return id<string[]>([]);
            }
        );

    await Promise.all(
        (
            [
                "__modelVersion",
                "servicePassword",
                "restorableConfigs",
                "s3",
                "clusterNotificationCheckoutTime"
            ] as const
        ).map(async key => {
            assert<Equals<typeof key, keyof ProjectConfigs>>();

            if (!files.includes(key)) {
                return;
            }

            await secretsManager.delete({
                path: pathJoin(projectVaultTopDirPath_reserved, key)
            });
        })
    );
}
