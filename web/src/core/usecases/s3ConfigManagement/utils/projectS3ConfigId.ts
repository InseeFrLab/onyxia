import { assert } from "tsafe/assert";

const prefix = "project-";

export function getProjectS3ConfigId(params: { creationTime: number }): string {
    const { creationTime } = params;

    return `${prefix}${creationTime}`;
}

export function parseProjectS3ConfigId(params: { s3ConfigId: string }): {
    creationTime: number;
} {
    const { s3ConfigId } = params;

    const creationTimeStr = s3ConfigId.replace(prefix, "");

    const creationTime = parseInt(creationTimeStr);

    assert(!isNaN(creationTime), "Not a valid s3 project config id");

    return { creationTime };
}
