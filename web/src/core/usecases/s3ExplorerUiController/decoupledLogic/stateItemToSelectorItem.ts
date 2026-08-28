import type { State } from "../state";
import {
    type BucketPoliciesByBucket,
    getHasPrefixBeMadePublic,
    getIsWithinPrefixThatHasBeenMadePublic
} from "./bucketPolicies";
import type { MainView } from "../selectors";
import { assert, id, type Equals } from "tsafe";
import memoize from "memoizee";

export const stateItemToSelectorItem = (params: {
    item: State.ListedPrefix.Item;
    isSharingPublicFolderFeatureEnabled: boolean;
    bucketPoliciesByBucket: BucketPoliciesByBucket;
    isAnonymousS3Profile: boolean;
}): MainView.Item => {
    const {
        item,
        isSharingPublicFolderFeatureEnabled,
        bucketPoliciesByBucket,
        isAnonymousS3Profile
    } = params;

    switch (item.type) {
        case "object":
            return id<MainView.Item.Object>({
                type: "object",
                displayName: (() => {
                    const keyBasename = item.s3Uri.keySegments.at(-1);

                    assert(keyBasename !== undefined);

                    return keyBasename;
                })(),
                s3Uri: item.s3Uri,
                uploadProgressPercent: undefined,
                isDeleting: false,
                lastModified: item.lastModified,
                size: item.size
            });
        case "prefix": {
            const hasBeenMadePublic = getHasPrefixBeMadePublic({
                s3Uri: item.s3Uri,
                bucketPoliciesByBucket
            });

            const getIsWithinPrefixThatHasBeenMadePublic_local = memoize(
                () =>
                    getIsWithinPrefixThatHasBeenMadePublic({
                        s3Uri: item.s3Uri,
                        bucketPoliciesByBucket
                    }).isWithinPrefixThatHasBeenMadePublic
            );

            return id<MainView.Item.PrefixSegment>({
                type: "prefix segment",
                displayName: (() => {
                    const lastSegment = item.s3Uri.keySegments.at(-1);

                    assert(lastSegment !== undefined);

                    return lastSegment;
                })(),
                s3Uri: item.s3Uri,
                uploadProgressPercent: undefined,
                isDeleting: false,
                publicAccessAction: (() => {
                    if (isAnonymousS3Profile) {
                        return undefined;
                    }

                    if (hasBeenMadePublic) {
                        return "make private";
                    }

                    if (getIsWithinPrefixThatHasBeenMadePublic_local()) {
                        return undefined;
                    }

                    return "make public";
                })(),
                shouldShowShareAction:
                    isSharingPublicFolderFeatureEnabled &&
                    (isAnonymousS3Profile ||
                        hasBeenMadePublic ||
                        getIsWithinPrefixThatHasBeenMadePublic_local())
            });
        }
        default:
            assert<Equals<typeof item, never>>(false);
    }
};
