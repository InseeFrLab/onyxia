import type { S3Uri } from "core/tools/S3Uri";

/**
 * Which items a drag started on one row carries.
 *
 * The rule is the one every file manager uses, and it is not "the selection":
 * dragging a row that is NOT selected drags that row alone and leaves the
 * selection alone. Returning the selection there would silently move files the
 * user could not see they had selected — the selection may be scrolled out of
 * view, and this list is virtualized.
 *
 * `undefined` means the drag must not start at all: the row is mid-upload or
 * mid-delete, so its object either does not exist yet or is about to stop
 * existing.
 */
export function getS3UrisToDrag<Item extends { s3Uri: S3Uri }>(params: {
    draggedItem: Item;
    selectedItems: Item[];
    getIsDraggable: (item: Item) => boolean;
    getItemKey: (item: Item) => string;
}): S3Uri[] | undefined {
    const { draggedItem, selectedItems, getIsDraggable, getItemKey } = params;

    if (!getIsDraggable(draggedItem)) {
        return undefined;
    }

    const draggedItemKey = getItemKey(draggedItem);

    const isDraggedItemSelected = selectedItems.some(
        item => getItemKey(item) === draggedItemKey
    );

    if (!isDraggedItemSelected) {
        return [draggedItem.s3Uri];
    }

    // A selection can contain rows that became undraggable after they were
    // selected (a delete started, say). Dropping them from the payload is better
    // than refusing the whole drag: the rows the user can still act on move, and
    // the ones they cannot are left behind rather than silently failing later.
    const s3Uris = selectedItems.filter(getIsDraggable).map(item => item.s3Uri);

    return s3Uris.length === 0 ? undefined : s3Uris;
}
