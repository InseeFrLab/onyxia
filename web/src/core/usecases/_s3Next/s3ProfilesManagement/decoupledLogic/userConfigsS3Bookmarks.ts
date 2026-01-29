import type { S3UriPrefixObj } from "core/tools/S3Uri";
import { z } from "zod";
import { assert, type Equals, id, is } from "tsafe";
import type { OptionalIfCanBeUndefined } from "core/tools/OptionalIfCanBeUndefined";

export type UserProfileS3Bookmark = {
    profileName: string;
    displayName: string | undefined;
    s3UriPrefixObj: S3UriPrefixObj;
};

const zS3UriPrefixObj = (() => {
    type TargetType = S3UriPrefixObj;

    const zTargetType = z.object({
        bucket: z.string(),
        keyPrefix: z.string()
    });

    type InferredType = z.infer<typeof zTargetType>;

    assert<Equals<TargetType, InferredType>>;

    return id<z.ZodType<TargetType>>(zTargetType);
})();

const zUserProfileS3Bookmark = (() => {
    type TargetType = UserProfileS3Bookmark;

    const zTargetType = z.object({
        profileName: z.string(),
        displayName: z.union([z.string(), z.undefined()]),
        s3UriPrefixObj: zS3UriPrefixObj
    });

    type InferredType = z.infer<typeof zTargetType>;

    assert<Equals<InferredType, OptionalIfCanBeUndefined<TargetType>>>;

    // @ts-expect-error
    return id<z.ZodType<TargetType>>(zTargetType);
})();

export function parseUserConfigsS3BookmarksStr(params: {
    userConfigs_s3BookmarksStr: string | null;
}): UserProfileS3Bookmark[] {
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

    assert(is<UserProfileS3Bookmark[]>(userProfileS3Bookmarks));

    return userProfileS3Bookmarks;
}

export function serializeUserConfigsS3Bookmarks(params: {
    userConfigs_s3Bookmarks: UserProfileS3Bookmark[];
}) {
    const { userConfigs_s3Bookmarks } = params;

    return JSON.stringify(userConfigs_s3Bookmarks);
}
