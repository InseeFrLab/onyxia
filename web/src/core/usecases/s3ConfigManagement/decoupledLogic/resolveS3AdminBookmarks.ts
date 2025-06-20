import type { DeploymentRegion, OidcParams_Partial } from "core/ports/OnyxiaApi";
import { assert } from "tsafe/assert";
import { id } from "tsafe/id";

export type DeploymentRegion_S3ConfigLike = {
    sts: {
        oidcParams: OidcParams_Partial;
    };
    bookmarkedDirectories: DeploymentRegion.S3Config.BookmarkedDirectory[];
};

assert<DeploymentRegion.S3Config extends DeploymentRegion_S3ConfigLike ? true : false>;

export type ResolvedAdminBookmark = {
    s3ConfigIndex: number;
    bookmarkedDirectories: DeploymentRegion.S3Config.BookmarkedDirectory.Common[];
};

export async function resolveS3AdminBookmarks(params: {
    deploymentRegion_s3Configs: DeploymentRegion_S3ConfigLike[];
    getDecodedIdToken: (params: {
        oidcParams_partial: OidcParams_Partial;
    }) => Promise<Record<string, unknown>>;
}): Promise<{
    resolvedAdminBookmarks: ResolvedAdminBookmark[];
}> {
    const { deploymentRegion_s3Configs, getDecodedIdToken } = params;

    const resolvedAdminBookmarks = await Promise.all(
        deploymentRegion_s3Configs.map(async (s3Config, i) => {
            const decodedIdToken = await getDecodedIdToken({
                oidcParams_partial: s3Config.sts.oidcParams
            });

            return id<ResolvedAdminBookmark>({
                s3ConfigIndex: i,
                bookmarkedDirectories: s3Config.bookmarkedDirectories
                    .map(entry => {
                        if (entry.claimName === undefined) {
                            return [
                                id<DeploymentRegion.S3Config.BookmarkedDirectory.Common>({
                                    bucketName: entry.bucketName,
                                    description: entry.description,
                                    path: entry.path,
                                    tags: entry.tags,
                                    title: entry.title
                                })
                            ];
                        }

                        const { claimName, excludedClaimPattern, includedClaimPattern } =
                            entry;

                        const claimValue_arr: string[] = (() => {
                            const value = decodedIdToken[claimName];

                            if (!value) {
                                return [];
                            }

                            if (typeof value === "string") {
                                return [value];
                            }

                            if (value instanceof Array) {
                                return value.map(e => `${e}`);
                            }

                            assert(
                                false,
                                () =>
                                    `${claimName} not in expected format! ${JSON.stringify(decodedIdToken)}`
                            );
                        })();

                        // TODO: Resolve
                        const paths: string[] = [];

                        return paths.map(
                            (
                                path
                            ): DeploymentRegion.S3Config.BookmarkedDirectory.Common => ({
                                bucketName: entry.bucketName,
                                description: entry.description,
                                path,
                                tags: entry.tags,
                                title: entry.title
                            })
                        );
                    })
                    .flat()
            });
        })
    );

    return { resolvedAdminBookmarks };
}
