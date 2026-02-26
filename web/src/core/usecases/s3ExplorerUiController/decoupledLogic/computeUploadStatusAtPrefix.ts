import { assert } from "tsafe/assert";
import { type S3Uri, getIsInside } from "core/tools/S3Uri";
import type { MainView } from "../selectors";

export function computeUploadStatusAtPrefix(params: {
    s3UriPrefix: S3Uri.Prefix;
    uploads: {
        s3Uri: S3Uri.Object;
        size: number;
        completionPercent: number;
    }[];
}): MainView.Item[] {
    const { s3UriPrefix, uploads } = params;

    const items: MainView.Item[] = [];

    const progressesByDisplayName: Record<
        string,
        { size: number; completionPercent: number }[]
    > = {};

    for (const upload of uploads) {
        const { isInside, isTopLevel } = getIsInside({
            s3UriPrefix,
            s3Uri: upload.s3Uri
        });

        if (!isInside) {
            continue;
        }

        if (isTopLevel) {
            items.push({
                type: "object",
                displayName: upload.s3Uri.keyBasename,
                s3Uri: upload.s3Uri,
                uploadProgressPercent: upload.completionPercent,
                isDeleting: false
            });
            continue;
        }

        const s3UriPrefixObj_newItem: S3Uri.Prefix.TerminatedByDelimiter = {
            type: "prefix",
            bucket: upload.s3Uri.bucket,
            delimiter: upload.s3Uri.delimiter,
            keySegments: upload.s3Uri.keySegments.slice(
                0,
                s3UriPrefix.keySegments.length + 1
            ),
            isDelimiterTerminated: true
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
                s3UriPrefix: s3UriPrefixObj_newItem,
                isDeleting: false,
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
