import type { S3UriPrefixObj } from "core/tools/S3Uri";

export type UserProfileS3Bookmark = {
    s3ProfileId: string;
    displayName: string | undefined;
    s3UriPrefixObj: S3UriPrefixObj;
};

export function parseUserConfigsS3BookmarksStr(params: {
    userConfigs_s3BookmarksStr: string | null;
}): UserProfileS3Bookmark[] {
    const { userConfigs_s3BookmarksStr } = params;

    if (userConfigs_s3BookmarksStr === null) {
        return [];
    }

    return JSON.parse(userConfigs_s3BookmarksStr);
}

export function serializeUserConfigsS3Bookmarks(params: {
    userConfigs_s3Bookmarks: UserProfileS3Bookmark[];
}) {
    const { userConfigs_s3Bookmarks } = params;

    return JSON.stringify(userConfigs_s3Bookmarks);
}
