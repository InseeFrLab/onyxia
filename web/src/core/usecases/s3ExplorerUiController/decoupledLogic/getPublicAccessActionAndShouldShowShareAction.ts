import {
    type BucketPoliciesByBucket,
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

    const hasBeenMadePublic = getHasPrefixBeMadePublic({
        s3Uri,
        bucketPoliciesByBucket
    });

    const getIsWithinPrefixThatHasBeenMadePublic_local = memoize(
        () =>
            getIsWithinPrefixThatHasBeenMadePublic({
                s3Uri,
                bucketPoliciesByBucket
            }).isWithinPrefixThatHasBeenMadePublic
    );

    const publicAccessAction = (() => {
        if (isAnonymousS3Profile) {
            return undefined;
        }

        if (hasBeenMadePublic) {
            return "make private" as const;
        }

        if (getIsWithinPrefixThatHasBeenMadePublic_local()) {
            return undefined;
        }

        return "make public";
    })();

    const shouldShowShareAction =
        isSharingPublicFolderFeatureEnabled &&
        (isAnonymousS3Profile ||
            hasBeenMadePublic ||
            getIsWithinPrefixThatHasBeenMadePublic_local());

    return { publicAccessAction, shouldShowShareAction };
}
