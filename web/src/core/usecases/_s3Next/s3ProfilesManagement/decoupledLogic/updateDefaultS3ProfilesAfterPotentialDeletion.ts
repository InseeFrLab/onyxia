import * as projectManagement from "core/usecases/projectManagement";
import type { DeploymentRegion } from "core/ports/OnyxiaApi/DeploymentRegion";
import { aggregateS3ProfilesFromVaultAndRegionIntoAnUnifiedSet } from "./s3Profiles";

type R = Record<
    "profileName_defaultXOnyxia" | "profileName_explorer",
    | {
          isUpdateNeeded: false;
      }
    | {
          isUpdateNeeded: true;
          profileName: string | undefined;
      }
>;

export function updateDefaultS3ProfilesAfterPotentialDeletion(params: {
    fromRegion: { s3Profiles: DeploymentRegion.S3Next.S3Profile[] };
    fromVault: {
        projectConfigs_s3: projectManagement.ProjectConfigs["s3"];
    };
}): R {
    const { fromRegion, fromVault } = params;

    const s3Profiles = aggregateS3ProfilesFromVaultAndRegionIntoAnUnifiedSet({
        fromRegion: {
            s3Profiles: fromRegion.s3Profiles.map(s3Profile => {
                return {
                    ...s3Profile,
                    profileName: s3Profile.profileName ?? ""
                };
            }),
            resolvedTemplatedBookmarks: undefined,
            resolvedTemplatedStsRoles: undefined
        },
        fromVault: {
            projectConfigs_s3: fromVault.projectConfigs_s3,
            userConfigs_s3BookmarksStr: null
        }
    });

    const actions: R = {
        profileName_defaultXOnyxia: {
            isUpdateNeeded: false
        },
        profileName_explorer: {
            isUpdateNeeded: false
        }
    };

    for (const propertyName of [
        "s3ConfigId_defaultXOnyxia", // TODO: Rename
        "s3ConfigId_explorer" // TODO: Rename
    ] as const) {
        const profileName_default = fromVault.projectConfigs_s3[propertyName];

        if (profileName_default === undefined) {
            continue;
        }

        if (
            s3Profiles.find(({ profileName }) => profileName === profileName_default) !==
            undefined
        ) {
            continue;
        }

        const profileName_newDefault = s3Profiles.find(
            ({ origin }) => origin === "defined in region"
        )?.profileName;

        actions[
            (() => {
                switch (propertyName) {
                    case "s3ConfigId_defaultXOnyxia":
                        return "profileName_defaultXOnyxia";
                    case "s3ConfigId_explorer":
                        return "profileName_explorer";
                }
            })()
        ] = {
            isUpdateNeeded: true,
            profileName: profileName_newDefault
        };
    }

    return actions;
}
