# S3ExplorerMainView Spec

## Purpose

`S3ExplorerMainView` is the main listing surface for an S3 prefix.

It is a partially controlled UI component:

- Listing state and listed items come from props.
- Navigation, upload, create-directory, delete, and direct-link generation are delegated through callbacks.
- Sorting, selection, dialogs, drag-and-drop feedback, and upload affordances are internal UI concerns.

This component is intentionally not responsible for displaying the current S3 URI. That context is provided by surrounding UI.

## External Responsibilities

The parent or usecase layer is responsible for:

- Deciding which prefix is currently listed.
- Fetching and refreshing the list of items.
- Surfacing listing failures through `listedPrefix.isErrored`.
- Resolving uploads, deletions, and direct download URL generation.
- Merging in transient states such as uploads in progress and items currently being deleted.

## Main Behaviors

- Show a Drive-like explorer shell with a toolbar, selection-aware actions, and a sortable table-like list.
- Give loading feedback whenever `isListing` is true, without blocking access to the current list contents.
- Render folder-like entries for `prefix segment` items and file-like entries for `object` items.
- Render file metadata for objects:
    - size
    - last modified time
- Allow sorting by:
    - name
    - size
    - last modified time
- Keep folder-like entries grouped before files.
- Allow multi-selection and bulk deletion.
- Allow navigation into folders and files through `onNavigate`.
- Allow file uploads through:
    - drag and drop onto the explorer
    - a button that opens the native OS file picker
- Allow creating a folder through `onCreateDirectory`.
- Allow generating a shareable direct-download link for a file through `getDirectDownloadUrl`.
- Render a dedicated error state when `listedPrefix.isErrored` is true.

## Interaction Summary

- Toolbar:
    - `Upload files` opens a native file picker and forwards selected files to `onPutObjects`.
    - `New folder` opens a local dialog and forwards the folder segment to `onCreateDirectory`.
    - `Get link` is enabled only when exactly one file is selected.
    - `Delete` is enabled when one or more items are selected.
- Listing:
    - Clicking a row selects it.
    - Double clicking a row requests navigation for the clicked item when that item is navigable.
    - `Ctrl` / `Cmd` click toggles a row in the selection.
    - `Shift` click selects a range.
    - The checkbox in the header selects or clears all non-deleting items.
    - Folder and file names are clickable and request navigation via `onNavigate`.
    - Row actions expose an explicit open affordance for both folders and files.
    - Row-level delete actions can target a single item without changing the external data model.
- Uploads:
    - Dragging files over the explorer shows a drop overlay.
    - Dropping files forwards them to `onPutObjects`.
    - The component does not manage upload lifecycle beyond reflecting the `uploadProgressPercent` already present in listed items.
- Share link:
    - Requesting a link opens a dialog.
    - The dialog shows loading, success, or failure.
    - On success, the dialog exposes copy/open actions for the generated URL.

## Props Contract

```ts
export type S3ExplorerMainViewProps = {
    className?: string;

    isListing: boolean;
    listedPrefix:
        | {
              isErrored: true;
              errorCase: "access denied" | "no such bucket";
          }
        | {
              isErrored: false;
              items: S3ExplorerMainViewProps.Item[];
          };

    onNavigate: (params: { s3Uri: S3Uri }) => void;

    onPutObjects: (params: {
        files: {
            relativePathSegments: string[];
            fileBasename: string;
            blob: Blob;
        }[];
    }) => void;

    onCreateDirectory: (params: { prefixSegment: string }) => void;

    onDelete: (params: { s3Uris: S3Uri[] }) => void;

    getDirectDownloadUrl: (params: {
        s3Uri: S3Uri.NonTerminatedByDelimiter;
        validityDurationSecond?: number;
    }) => Promise<string>;
};
```

## Notes

- `onCreateDirectory` receives a single prefix segment, not a full S3 URI.
- This component can only submit files available from native browser file inputs or drag-and-drop payloads.
- Ordering, filtering, and item enrichment beyond local sorting are external responsibilities.
