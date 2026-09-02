# Intent

`S3FileRequest` is the self-contained presentation component for a public S3 file-request page. It lets a visitor select files or drop files and directories, displays the request expiry, and renders controlled upload progress.

The component does not load a request, know about routes, read application core state, or execute upload thunks. All durable state and side effects are supplied through props.

# Props contract

```ts
type FileToUpload = {
    file: File;
    relativePathSegments: string[];
};

type S3FileRequestProps = {
    className?: string;
    expirationTime: number;
    uploads: readonly {
        uploadId: string;
        fileName: string;
        sizeInBytes: number;
        status: "uploading" | "success" | "failed";
        uploadPercent: number;
        errorMessage: string | undefined;
    }[];
    onUploadFiles: (params: { files: readonly FileToUpload[] }) => void;
    onCancelUpload: (params: { uploadId: string }) => void;
    onRetryUpload: (params: { uploadId: string }) => void;
};
```

`fileName` is the display path relative to the requested S3 prefix. For a folder upload it includes directory segments, for example `project/docs/readme.md`.

# Ownership boundary

The component owns only transient view behavior:

- hidden file input activation
- drag depth and active-drop styling
- recursive extraction of files from a dropped directory
- expiry clock updates and localized date formatting

The caller owns:

- request loading and validation
- upload state and progress
- network requests
- cancellation and retry effects
- error-message creation

# File and folder selection

- The file picker accepts multiple files.
- Selecting the same file again must work, so the input value is reset after every selection.
- A drop is accepted only when it contains file-kind data.
- When the browser exposes `webkitGetAsEntry`, dropped directory entries are traversed recursively.
- Every file from a dropped directory includes the top-level dropped folder in `relativePathSegments`.
- All batches returned by a directory reader are consumed; a directory reader may return only part of a large directory per call.
- When entry traversal is unavailable, the component falls back to `DataTransfer.files` and `File.webkitRelativePath`.
- Empty directories do not emit upload intents because S3 stores objects rather than directories.
- A single drop invokes `onUploadFiles` once with the complete flattened set of files.

Example payload for a dropped `project` directory:

```ts
onUploadFiles({
    files: [
        {
            file: readmeFile,
            relativePathSegments: ["project", "docs"]
        },
        {
            file: logoFile,
            relativePathSegments: ["project", "assets"]
        }
    ]
});
```

# Expiration

- An invalid or elapsed `expirationTime` is treated as expired.
- Before expiry, the localized expiration date and upload drop zone are shown.
- After expiry, the drop zone is removed and an explanatory expired state is shown.
- If expiry occurs while dragging, the active drag state is cleared.
- No upload intent is emitted after expiry.

# Upload rendering

- Upload progress is clamped to the range 0–100 for display.
- Uploading rows show progress and call `onCancelUpload` from their action.
- Failed rows show their error and call `onRetryUpload` from their action.
- Successful rows show a success marker.
- When every displayed upload is successful, an aggregate success notice is shown.
- Folder paths are preserved in the displayed filename and tooltip.

# Accessibility

- The page title is an `h1`.
- Decorative icons are hidden from assistive technology.
- Upload progress uses `role="progressbar"` with min, max, and current values.
- Cancel and retry controls have translated accessible labels.
- The aggregate success message uses `role="status"`.

# Layout

- The root accepts `className`, with the caller class taking precedence through class composition.
- The content is centered in a responsive card.
- Long paths and errors are truncated visually while their full value remains available as a title.
