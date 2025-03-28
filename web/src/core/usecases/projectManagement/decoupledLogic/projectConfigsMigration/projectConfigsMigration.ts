import { v0ToV1 } from "./v0ToV1";
import type { SecretsManager } from "core/ports/SecretsManager";
import type { ProjectConfigs } from "../ProjectConfigs";
import { assert, type Equals } from "tsafe/assert";
import { clearProjectConfigs } from "../clearProjectConfigs";
import { join as pathJoin } from "pathe";
import { secretToValue } from "../secretParsing";

export async function projectConfigsMigration(params: {
    projectVaultTopDirPath_reserved: string;
    secretsManager: SecretsManager;
}) {
    const { projectVaultTopDirPath_reserved, secretsManager } = params;

    const modelVersion = await (async () => {
        const key = "__modelVersion";

        assert<Equals<typeof key, keyof Pick<ProjectConfigs, "__modelVersion">>>();

        const modelVersion = await secretsManager
            .get({
                path: pathJoin(projectVaultTopDirPath_reserved, key)
            })
            .then(
                ({ secret }) => secretToValue(secret) as number,
                () => {
                    console.log("The above error is ok");
                    return undefined;
                }
            );

        return modelVersion ?? 0;
    })();

    try {
        if (modelVersion < 1) {
            await v0ToV1({
                projectVaultTopDirPath_reserved,
                secretsManager
            });
        }
    } catch {
        console.warn("Migration of the ProjectConfigs failed, clearing everything");

        await clearProjectConfigs({
            projectVaultTopDirPath_reserved,
            secretsManager
        });
    }
}
