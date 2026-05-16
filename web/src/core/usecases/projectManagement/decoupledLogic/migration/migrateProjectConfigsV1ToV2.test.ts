import { describe, expect, it } from "vitest";
import type { ProjectConfigs as ProjectConfigs_v1 } from "./ProjectConfigs_v1";
import { migrateProjectConfigsV1ToV2 } from "./migrateProjectConfigsV1ToV2";
import { stringifyS3Uri } from "core/tools/S3Uri";

describe(migrateProjectConfigsV1ToV2.name, () => {
    it("migrates s3 configs into profiles and restorable config references", () => {
        const projectConfigs_v1: ProjectConfigs_v1 = {
            __modelVersion: 1,
            servicePassword: "password",
            restorableConfigs: [
                {
                    friendlyName: "service using s3",
                    isShared: true,
                    catalogId: "catalog",
                    chartName: "chart",
                    chartVersion: "1.0.0",
                    s3ConfigId: "project-111",
                    helmValuesPatch: [{ path: ["foo"], value: "bar" }]
                },
                {
                    friendlyName: "service using region s3",
                    isShared: undefined,
                    catalogId: "catalog",
                    chartName: "chart",
                    chartVersion: "1.0.0",
                    s3ConfigId: "region-something",
                    helmValuesPatch: []
                }
            ],
            s3: {
                s3Configs: [
                    {
                        creationTime: 111,
                        friendlyName: "My Profile!",
                        url: "https://minio.example.com",
                        region: "us-east-1",
                        workingDirectoryPath: "mybucket/foo/bar/",
                        pathStyleAccess: true,
                        credentials: {
                            accessKeyId: "accessKeyId",
                            secretAccessKey: "secretAccessKey",
                            sessionToken: undefined
                        }
                    },
                    {
                        creationTime: 222,
                        friendlyName: "My Profile?",
                        url: "https://s3.example.com",
                        region: undefined,
                        workingDirectoryPath: "otherbucket/",
                        pathStyleAccess: false,
                        credentials: undefined
                    }
                ],
                s3ConfigId_defaultXOnyxia: "project-111",
                s3ConfigId_explorer: "project-222"
            },
            clusterNotificationCheckoutTime: 123
        };

        const got = migrateProjectConfigsV1ToV2({ projectConfigs_v1 });

        expect(got.__modelVersion).toBe(2);
        expect(got.servicePassword).toBe(projectConfigs_v1.servicePassword);
        expect(got.clusterNotificationCheckoutTime).toBe(
            projectConfigs_v1.clusterNotificationCheckoutTime
        );
        expect(got.s3Profiles.map(s3Profile => s3Profile.profileName)).toStrictEqual([
            "My-Profile",
            "My-Profile-2"
        ]);
        expect(got.s3Profiles[0].bookmarks?.[0]?.displayName).toBe("bar");
        expect(stringifyS3Uri(got.s3Profiles[0].bookmarks![0].s3Uri)).toBe(
            "s3://mybucket/foo/bar/"
        );
        expect(got.s3Profiles[1].bookmarks?.[0]?.displayName).toBe("otherbucket");
        expect(stringifyS3Uri(got.s3Profiles[1].bookmarks![0].s3Uri)).toBe(
            "s3://otherbucket/"
        );
        expect(
            got.restorableServiceConfigs.map(
                restorableServiceConfig => restorableServiceConfig.s3ProfileName
            )
        ).toStrictEqual(["My-Profile", undefined]);
        expect(got.restorableServiceConfigs[0].helmValuesPatch).toStrictEqual(
            projectConfigs_v1.restorableConfigs[0].helmValuesPatch
        );
    });
});
