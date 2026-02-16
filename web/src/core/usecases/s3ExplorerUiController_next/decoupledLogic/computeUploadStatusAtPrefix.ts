import { assert } from "tsafe/assert";
import { type S3UriPrefixObj, type S3UriObj, getIsInside } from "core/tools/S3Uri";
import type { MainView } from "../selectors";

export function computeUploadStatusAtPrefix(params: {
    s3UriPrefixObj: S3UriPrefixObj;
    uploads: {
        s3UriObj: S3UriObj;
        size: number;
        completionPercent: number;
    }[];
}): MainView.Item[] {
    const { s3UriPrefixObj, uploads } = params;

    const items: MainView.Item[] = [];

    const progressesByDisplayName: Record<
        string,
        { size: number; completionPercent: number }[]
    > = {};

    for (const upload of uploads) {
        const { isInside, isTopLevel } = getIsInside({
            s3UriPrefixObj,
            s3UriObj: upload.s3UriObj
        });

        if (!isInside) {
            continue;
        }

        if (isTopLevel) {
            items.push({
                type: "object",
                displayName: upload.s3UriObj.basename,
                s3UriObj: upload.s3UriObj,
                uploadProgressPercent: upload.completionPercent
            });
            continue;
        }

        const s3UriPrefixObj_newItem: S3UriPrefixObj = {
            type: "s3 URI prefix",
            bucket: upload.s3UriObj.bucket,
            delimiter: upload.s3UriObj.delimiter,
            keySegments: upload.s3UriObj.keySegments.slice(
                0,
                s3UriPrefixObj.keySegments.length + 1
            )
        };

        const displayName =
            s3UriPrefixObj_newItem.keySegments[
                s3UriPrefixObj_newItem.keySegments.length - 1
            ];

        if (
            items.find(
                item => item.type === "prefix segment" && item.displayName === displayName
            ) === undefined
        ) {
            items.push({
                type: "prefix segment",
                displayName,
                s3UriPrefixObj: s3UriPrefixObj_newItem,
                uploadProgressPercent: NaN
            });
        }

        (progressesByDisplayName[displayName] ??= []).push({
            completionPercent: upload.completionPercent,
            size: upload.size
        });
    }

    for (const item of items) {
        if (item.type !== "prefix segment") {
            continue;
        }

        const progresses = progressesByDisplayName[item.displayName];

        assert(progresses !== undefined);

        item.uploadProgressPercent =
            progresses.reduce(
                (acc, { size, completionPercent }) => acc + size * completionPercent,
                0
            ) / progresses.reduce((acc, { size }) => acc + size, 0);
    }

    return items;
}
