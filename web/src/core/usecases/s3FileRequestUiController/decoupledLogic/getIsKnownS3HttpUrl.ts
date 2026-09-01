import type { S3Config } from "core/ports/OnyxiaApi/S3Config";
import { exclude } from "tsafe";

export function getIsKnownS3HttpUrl(params: { s3HttpUrl: string; s3Config: S3Config }) {
    const { s3HttpUrl, s3Config } = params;

    const knownServerUrls = [
        s3Config.defaultValuesOfCreationForm?.url,
        ...s3Config.entries.map(entry => entry.url)
    ].filter(exclude(undefined));

    return (
        knownServerUrls.find(serverUrl => s3HttpUrl.startsWith(serverUrl)) !== undefined
    );
}
