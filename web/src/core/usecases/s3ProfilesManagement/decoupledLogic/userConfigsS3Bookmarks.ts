import { type S3Uri, zS3Uri } from "core/tools/S3Uri";
import { z } from "zod";
import { assert, type Equals, id, is } from "tsafe";
import type { OptionalIfCanBeUndefined } from "core/tools/OptionalIfCanBeUndefined";

export type UserConfigs_S3Bookmark = {
    profileName: string;
    displayName: string | undefined;
    s3Uri: S3Uri;
};

const zUserProfileS3Bookmark = (() => {
    type TargetType = UserConfigs_S3Bookmark;

    const zTargetType = z.object({
        profileName: z.string(),
        displayName: z.union([z.string(), z.undefined()]),
        s3Uri: zS3Uri
    });

    type InferredType = z.infer<typeof zTargetType>;

    assert<Equals<InferredType, OptionalIfCanBeUndefined<TargetType>>>;

    // @ts-expect-error
    return id<z.ZodType<TargetType>>(zTargetType);
})();

export function parseUserConfigsS3BookmarksStr(params: {
    userConfigs_s3BookmarksStr: string | null;
}): UserConfigs_S3Bookmark[] {
    const { userConfigs_s3BookmarksStr } = params;

    if (userConfigs_s3BookmarksStr === null) {
        return [];
    }

    const userProfileS3Bookmarks: unknown = JSON.parse(userConfigs_s3BookmarksStr);

    try {
        z.array(zUserProfileS3Bookmark).parse(userProfileS3Bookmarks);
    } catch {
        return [];
    }

    assert(is<UserConfigs_S3Bookmark[]>(userProfileS3Bookmarks));

    return userProfileS3Bookmarks;
}

export function serializeUserConfigsS3Bookmarks(params: {
    userConfigs_s3Bookmarks: UserConfigs_S3Bookmark[];
}) {
    const { userConfigs_s3Bookmarks } = params;

    return JSON.stringify(userConfigs_s3Bookmarks);
}
