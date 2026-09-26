import { parseS3Uri, stringifyS3Uri, type S3Uri } from "core/tools/S3Uri";

/**
 * The MIME type under which the explorer publishes what is being dragged out of
 * it. It is the contract an application embedding Onyxia reads, so it is a
 * stable, vendor-prefixed type rather than something derived at runtime.
 *
 * `text/plain` is always set alongside it, so dropping onto a plain text field
 * (a chat box, an editor, a terminal) yields the S3 URIs and nothing has to know
 * about Onyxia at all. The structured type exists for consumers that need to
 * tell "these are S3 objects" apart from "the user dropped some text".
 */
export const S3_OBJECTS_DRAG_MIME = "application/x-onyxia-s3-objects";

export type S3ObjectsDragData = {
    s3Uris: S3Uri[];
};

/**
 * Whether a drag carries S3 objects.
 *
 * This reads `types` and never `getData()` ON PURPOSE. While a drag is in
 * flight the DataTransfer is in "protected mode": `types` is readable but every
 * value reads back as the empty string, in every browser and for same-origin
 * drags too. So this is the only check available during `dragenter`/`dragover`,
 * which is exactly where a drop target has to decide whether to accept.
 */
export function getHasS3ObjectsDragData(dataTransfer: DataTransfer): boolean {
    return dataTransfer.types.includes(S3_OBJECTS_DRAG_MIME);
}

export function setS3ObjectsDragData(params: {
    dataTransfer: DataTransfer;
    s3Uris: S3Uri[];
}): void {
    const { dataTransfer, s3Uris } = params;

    const s3UriStrs = s3Uris.map(stringifyS3Uri);

    dataTransfer.setData(S3_OBJECTS_DRAG_MIME, JSON.stringify({ s3Uris: s3UriStrs }));
    dataTransfer.setData("text/plain", s3UriStrs.join("\n"));
}

/**
 * Read back what {@link setS3ObjectsDragData} wrote. Returns `undefined` for a
 * drag that does not carry S3 objects, and for one that does but whose payload
 * cannot be parsed — a drop handler should treat both the same way.
 *
 * `delimiter` is the delimiter of the S3 configuration the objects are being
 * dropped INTO, which need not be the one they were dragged from; the URIs
 * travel as strings for exactly that reason.
 */
export function getS3ObjectsDragData(params: {
    dataTransfer: DataTransfer;
    delimiter: string;
}): S3ObjectsDragData | undefined {
    const { dataTransfer, delimiter } = params;

    const raw = dataTransfer.getData(S3_OBJECTS_DRAG_MIME);

    if (raw === "") {
        return undefined;
    }

    let parsed: unknown;

    try {
        parsed = JSON.parse(raw);
    } catch {
        return undefined;
    }

    if (parsed === null || typeof parsed !== "object" || !("s3Uris" in parsed)) {
        return undefined;
    }

    const { s3Uris } = parsed as { s3Uris: unknown };

    if (
        !(s3Uris instanceof Array) ||
        s3Uris.length === 0 ||
        !s3Uris.every(s3Uri => typeof s3Uri === "string")
    ) {
        return undefined;
    }

    try {
        return {
            s3Uris: (s3Uris as string[]).map(value => parseS3Uri({ value, delimiter }))
        };
    } catch {
        return undefined;
    }
}
