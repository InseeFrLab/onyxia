import {
    type BucketPoliciesByBucket,
    getHasBucketPolicies,
    getHasPrefixBeMadePublic,
    getIsWithinPrefixThatHasBeenMadePublic
} from "./bucketPolicies";
import memoize from "memoizee";
import type { S3Uri } from "core/tools/S3Uri";

export function getPublicAccessActionAndShouldShowShareAction(params: {
    s3Uri: S3Uri.TerminatedByDelimiter;
    bucketPoliciesByBucket: BucketPoliciesByBucket;
    isSharingPublicFolderFeatureEnabled: boolean;
    isAnonymousS3Profile: boolean;
}): {
    publicAccessAction: "make private" | "make public" | undefined;
    shouldShowShareAction: boolean;
} {
    const {
        s3Uri,
        bucketPoliciesByBucket,
        isSharingPublicFolderFeatureEnabled,
        isAnonymousS3Profile
    } = params;

    const hasBucketPolicies = getHasBucketPolicies({ s3Uri, bucketPoliciesByBucket });

    const getHasPrefixBeMadePublic_local = memoize(() =>
        getHasPrefixBeMadePublic({
            s3Uri,
            bucketPoliciesByBucket
        })
    );

    const getIsWithinPrefixThatHasBeenMadePublic_local = memoize(
        () =>
            getIsWithinPrefixThatHasBeenMadePublic({
                s3Uri,
                bucketPoliciesByBucket
            }).isWithinPrefixThatHasBeenMadePublic
    );

    const publicAccessAction = (() => {
        if (!hasBucketPolicies) {
            return undefined;
        }

        if (isAnonymousS3Profile) {
            return undefined;
        }

        if (getHasPrefixBeMadePublic_local()) {
            return "make private" as const;
        }

        if (getIsWithinPrefixThatHasBeenMadePublic_local()) {
            return undefined;
        }

        return "make public";
    })();

    const shouldShowShareAction = (() => {
        if (!isSharingPublicFolderFeatureEnabled) {
            return false;
        }

        if (isAnonymousS3Profile) {
            return true;
        }

        if (!hasBucketPolicies) {
            return false;
        }

        if (getHasPrefixBeMadePublic_local()) {
            return true;
        }

        if (getIsWithinPrefixThatHasBeenMadePublic_local()) {
            return true;
        }

        return false;
    })();

    return { publicAccessAction, shouldShowShareAction };
}
