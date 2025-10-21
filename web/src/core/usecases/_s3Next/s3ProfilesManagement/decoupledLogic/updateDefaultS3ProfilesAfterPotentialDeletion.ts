import * as projectManagement from "core/usecases/projectManagement";
import type { DeploymentRegion } from "core/ports/OnyxiaApi/DeploymentRegion";
import { aggregateS3ProfilesFromVaultAndRegionIntoAnUnifiedSet } from "./s3Profiles";

type R = Record<
    "s3ConfigId_defaultXOnyxia" | "s3ConfigId_explorer",
    | {
          isUpdateNeeded: false;
      }
    | {
          isUpdateNeeded: true;
          s3ProfileId: string | undefined;
      }
>;

export function updateDefaultS3ProfilesAfterPotentialDeletion(params: {
    fromRegion: DeploymentRegion.S3Next.S3Profile[];
    fromVault: projectManagement.ProjectConfigs["s3"];
}): R {
    const { fromRegion, fromVault } = params;

    const s3Profiles = aggregateS3ProfilesFromVaultAndRegionIntoAnUnifiedSet({
        fromRegion: fromRegion.map(s3Profile => ({
            ...s3Profile,
            bookmarks: []
        })),
        fromVault,
        credentialsTestState: {
            ongoingTests: [],
            testResults: []
        }
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
        const s3ConfigId_default = fromVault[propertyName];

        if (s3ConfigId_default === undefined) {
            continue;
        }

        if (s3Profiles.find(({ id }) => id === s3ConfigId_default) !== undefined) {
            continue;
        }

        const s3ConfigId_toUseAsDefault = s3Profiles.find(
            ({ origin }) => origin === "defined in region"
        )?.id;

        actions[propertyName] = {
            isUpdateNeeded: true,
            s3ProfileId: s3ConfigId_toUseAsDefault
        };
    }

    return actions;
}
