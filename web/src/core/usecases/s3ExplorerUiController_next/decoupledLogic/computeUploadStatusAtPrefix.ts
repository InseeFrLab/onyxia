import { assert } from "tsafe/assert";
import { type S3UriPrefixObj, type S3UriObj, getIsInside } from "core/tools/S3Uri";

export type Item = Item.PrefixSegment | Item.Object;

export namespace Item {
    type Common = {
        uploadProgressPercent: number;
    };

    export type PrefixSegment = Common & {
        type: "prefix segment";
        prefixSegment: string;
    };

    export type Object = Common & {
        type: "object";
        fileBasename: string;
    };
}

export function computeUploadStatusAtPrefix(params: {
    s3UriPrefixObj: S3UriPrefixObj;
    uploads: {
        s3UriObj: S3UriObj;
        size: number;
        completionPercent: number;
    }[];
}): Item[] {
    const { s3UriPrefixObj, uploads } = params;

    const items: Item[] = [];

    const progressesByPrefixSegment: Record<
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
                fileBasename: upload.s3UriObj.basename,
                uploadProgressPercent: upload.completionPercent
            });
            continue;
        }

        const prefixSegment =
            upload.s3UriObj.keySegments[s3UriPrefixObj.keySegments.length];

        if (
            items.find(
                item =>
                    item.type === "prefix segment" && item.prefixSegment === prefixSegment
            ) === undefined
        ) {
            items.push({
                type: "prefix segment",
                prefixSegment,
                uploadProgressPercent: NaN
            });
        }

        (progressesByPrefixSegment[prefixSegment] ??= []).push({
            completionPercent: upload.completionPercent,
            size: upload.size
        });
    }

    for (const item of items) {
        if (item.type === "object") {
            continue;
        }

        const progresses = progressesByPrefixSegment[item.prefixSegment];

        assert(progresses !== undefined);

        item.uploadProgressPercent =
            progresses.reduce(
                (acc, { size, completionPercent }) => acc + size * completionPercent,
                0
            ) / progresses.reduce((acc, { size }) => acc + size, 0);
    }

    return items;
}
