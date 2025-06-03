import * as projectManagement from "core/usecases/projectManagement";
import type { DeploymentRegion } from "core/ports/OnyxiaApi/DeploymentRegion";
import { getS3Configs } from "./getS3Configs";

type R = Record<
    "s3ConfigId_defaultXOnyxia" | "s3ConfigId_explorer",
    | {
          isUpdateNeeded: false;
      }
    | {
          isUpdateNeeded: true;
          s3ConfigId: string | undefined;
      }
>;

export function updateDefaultS3ConfigsAfterPotentialDeletion(params: {
    projectConfigsS3: {
        s3Configs: projectManagement.ProjectConfigs.S3Config[];
        s3ConfigId_defaultXOnyxia: string | undefined;
        s3ConfigId_explorer: string | undefined;
    };
    s3RegionConfigs: DeploymentRegion.S3Config[];
}): R {
    const { projectConfigsS3, s3RegionConfigs } = params;

    const s3Configs = getS3Configs({
        projectConfigsS3,
        s3RegionConfigs,
        configTestResults: [],
        ongoingConfigTests: [],
        username: "johndoe",
        projectGroup: undefined,
        groupProjects: []
    });

    const actions: R = {
        s3ConfigId_defaultXOnyxia: {
            isUpdateNeeded: false
        },
        s3ConfigId_explorer: {
            isUpdateNeeded: false
        }
    };

    for (const propertyName of [
        "s3ConfigId_defaultXOnyxia",
        "s3ConfigId_explorer"
    ] as const) {
        const s3ConfigId_default = projectConfigsS3[propertyName];

        if (s3ConfigId_default === undefined) {
            continue;
        }

        if (s3Configs.find(({ id }) => id === s3ConfigId_default) !== undefined) {
            continue;
        }

        const s3ConfigId_toUseAsDefault = s3Configs.find(
            ({ origin }) => origin === "deploymentRegion"
        )?.id;

        actions[propertyName] = {
            isUpdateNeeded: true,
            s3ConfigId: s3ConfigId_toUseAsDefault
        };
    }

    return actions;
}
