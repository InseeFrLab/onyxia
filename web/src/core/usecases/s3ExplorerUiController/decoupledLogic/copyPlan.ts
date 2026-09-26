import { id } from "tsafe";
import { stringifyS3Uri, type S3Uri } from "core/tools/S3Uri";

/**
 * S3 has no notion of a directory and no notion of a move. Copying "a folder"
 * is copying every object whose key starts with a prefix, one CopyObject at a
 * time, and the whole of what makes it feel like a file manager is the key
 * arithmetic in this file. It is separated from the thunk because every case
 * worth getting right here is a pure function of paths, and none of them are
 * reachable from a test that has to talk to an object store.
 */

export type CopyRefusalReason =
    | "destination is not a prefix"
    | "already there"
    | "into itself"
    | "colliding names";

/**
 * Whether a set of dragged URIs may be copied into a destination prefix, and if
 * not, why. Checked before anything is listed, so an impossible drop can be
 * refused while the drag is still in the air.
 */
export function getCopyRefusalReason(params: {
    sourceS3Uris: S3Uri[];
    destinationS3Uri: S3Uri;
}): CopyRefusalReason | undefined {
    const { sourceS3Uris, destinationS3Uri } = params;

    if (!destinationS3Uri.isDelimiterTerminated) {
        return "destination is not a prefix";
    }

    for (const sourceS3Uri of sourceS3Uris) {
        if (
            sourceS3Uri.bucket === destinationS3Uri.bucket &&
            areSegmentsEqual(
                getParentKeySegments(sourceS3Uri),
                destinationS3Uri.keySegments
            )
        ) {
            // Dropping something back where it already is. Not an error worth a
            // dialog, but doing it would silently overwrite an object with
            // itself, and on a versioned bucket that is a new version for nothing.
            return "already there";
        }

        if (
            sourceS3Uri.isDelimiterTerminated &&
            sourceS3Uri.bucket === destinationS3Uri.bucket &&
            isPrefixOf(sourceS3Uri.keySegments, destinationS3Uri.keySegments)
        ) {
            // A prefix copied into itself or into anything under it: the crawl
            // would keep finding the objects it has just written.
            return "into itself";
        }
    }

    const basenames = sourceS3Uris.map(s3Uri => s3Uri.keySegments.at(-1));

    if (new Set(basenames).size !== basenames.length) {
        return "colliding names";
    }

    return undefined;
}

/**
 * Where one object ends up.
 *
 * `sourceS3Uri` is the object being copied; `draggedS3Uri` is what the user
 * actually dragged, which is the same thing when an object was dragged and an
 * ancestor prefix when a folder was. The part of the key BELOW the dragged
 * item's parent is what gets rebuilt under the destination — which is what makes
 * dragging a folder keep its own name and its internal shape, rather than
 * flattening every object into the destination.
 */
export function getCopyDestinationS3Uri(params: {
    sourceS3Uri: S3Uri.NonTerminatedByDelimiter;
    draggedS3Uri: S3Uri;
    destinationS3Uri: S3Uri.TerminatedByDelimiter;
}): S3Uri.NonTerminatedByDelimiter {
    const { sourceS3Uri, draggedS3Uri, destinationS3Uri } = params;

    const parentKeySegments = getParentKeySegments(draggedS3Uri);

    if (!isPrefixOf(parentKeySegments, sourceS3Uri.keySegments)) {
        throw new Error(
            `${stringifyS3Uri(sourceS3Uri)} is not under ${stringifyS3Uri(draggedS3Uri)}`
        );
    }

    return id<S3Uri.NonTerminatedByDelimiter>({
        bucket: destinationS3Uri.bucket,
        delimiter: destinationS3Uri.delimiter,
        keySegments: [
            ...destinationS3Uri.keySegments,
            ...sourceS3Uri.keySegments.slice(parentKeySegments.length)
        ],
        isDelimiterTerminated: false
    });
}

function getParentKeySegments(s3Uri: S3Uri): string[] {
    return s3Uri.keySegments.slice(0, -1);
}

function isPrefixOf(prefix: string[], segments: string[]): boolean {
    return (
        prefix.length <= segments.length &&
        prefix.every((segment, i) => segments[i] === segment)
    );
}

function areSegmentsEqual(a: string[], b: string[]): boolean {
    return a.length === b.length && a.every((segment, i) => b[i] === segment);
}
