# S3Uploads Spec

## Intent

`S3Uploads` is a compact floating status panel for current and recent S3 uploads.

It is responsible for:

- surfacing upload progress,
- showing errored upload outcomes,
- exposing row-level actions for cancel, retry, and open-directory,
- asking the parent to flush rendered uploads when the panel can be dismissed.

The component is presentational. It does not own upload execution or navigation state.

## Props

```ts
import type { S3Uri } from "core/tools/S3Uri";
import type { Link } from "type-route";

type S3UploadsProps = {
    className?: string;
    uploads: {
        profileName: string;
        s3Uri: S3Uri.NonTerminatedByDelimiter;
        size: number;
        completionPercent: number;
        uploadStartTime: number;
        erroredErrorMessage: string | undefined;
    }[];
    onFlushUploads: () => void;
    onCancelUpload: (params: {
        profileName: string;
        s3Uri: S3Uri.NonTerminatedByDelimiter;
    }) => void;
    onRetryUpload: (params: {
        profileName: string;
        s3Uri: S3Uri.NonTerminatedByDelimiter;
    }) => void;
    getDirectoryLink: (params: {
        profileName: string;
        s3Uri: S3Uri.NonTerminatedByDelimiter;
    }) => Link;
};
```

The parent owns ordering. If uploads should appear newest-first or most-relevant-first,
the parent must provide them in that order.

If `uploads` is empty, the component renders nothing. The parent is expected to
remove the panel by making `uploads` empty, including after `onFlushUploads`.

## Derived States

The component derives visual state from `completionPercent` and `erroredErrorMessage`.

- Uploading: `erroredErrorMessage === undefined && completionPercent < 100`
- Completed: `erroredErrorMessage === undefined && completionPercent === 100`
- Error: `erroredErrorMessage !== undefined`

`uploadStartTime` is not displayed directly, but it is part of the upload identity and
can be used by the parent for ordering or lifecycle management.

## Header

The header contains:

- a summary title,
- a collapse / expand toggle,
- a trailing close affordance that either flushes uploads or asks for confirmation.

Title behavior:

- if at least one upload is still running, the title emphasizes the number of ongoing uploads,
- otherwise it shows the total number of rendered uploads.

Close behavior:

- the close affordance is always enabled,
- if no upload is running, it calls `onFlushUploads`,
- if at least one upload is running, it opens the abort confirmation dialog,
- confirming the dialog calls `onFlushUploads`,
- confirming the dialog does not call `onCancelUpload` for each running upload,
- once the parent responds to `onFlushUploads` by passing `uploads: []`, the component
  renders nothing and the panel closes automatically.

Collapse behavior:

- collapse / expand state is internal to the component,
- collapsing hides the list but keeps the header visible.

## Rows

Each upload renders as one row with:

- a leading file icon,
- the file name derived from the last S3 key segment when available,
- a metadata line combining size and status,
- an optional trailing action depending on the derived state.

### Uploading

Expected behavior:

- show uploaded size over total size,
- append the rounded progress percentage,
- display the bottom progress bar,
- expose a cancel action through `onCancelUpload`.

### Completed

Expected behavior:

- show the total size,
- display a success status,
- expose a folder action that uses `getDirectoryLink`.

### Error

Expected behavior:

- show the total size,
- display an error status,
- append `erroredErrorMessage` when it is non-empty,
- expose a retry action through `onRetryUpload`.

## Layout And Visual Rules

- The panel is a floating surface with fixed width controlled by the parent.
- The structure is header, divider, then a vertical stack of rows.
- Rows are visually separated with subtle dividers.
- Uploading rows show a thin bottom progress bar.
- Completed statuses use success color treatment.
- Errored statuses use error color treatment.
