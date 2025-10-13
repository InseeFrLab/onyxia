import { assert } from "tsafe";

// TODO: Eventually rename but we keep it as project-
// for avoiding painful breaking change requiring a migration.
const prefix = "project-";

export function s3Profile_fromVault_getId(params: { creationTime: number }): string {
    const { creationTime } = params;

    return `${prefix}${creationTime}`;
}

export function s3Profile_fromVault_parseId(params: { s3ConfigId: string }): {
    creationTime: number;
} {
    const { s3ConfigId } = params;

    const creationTimeStr = s3ConfigId.replace(prefix, "");

    const creationTime = parseInt(creationTimeStr);

    assert(!isNaN(creationTime), "Not a valid s3 vault config id");

    return { creationTime };
}
