# Intent

`S3FileRequestCreationDialog` is the form displayed inside a modal after the user
chooses **Request files** on an S3 folder.

Despite its name, this component does not render or control a modal dialog. It
renders only the modal body content and has no dependency on the application
router or core. Its caller owns the state and provides the generated upload page
URL.

Its purpose is to:

- identify the destination folder
- explain that the generated link lets other people upload files to that folder
- let the user configure the link validity and maximum size per uploaded file
- display and copy the generated upload page URL
- expose a retry action when link generation fails
- remind the user that anyone possessing the link can upload until it expires

# Props

```ts
export type S3FileRequestCreationDialogProps = {
    className?: string;
    folderName: string;
    isEmptyPrefix: boolean;
    validityDuration: S3FileRequestCreationDialogProps.ValidityDuration;
    maxObjectSize: S3FileRequestCreationDialogProps.MaxObjectSize;
    uploadPageUrl: string | undefined;
    errorMessage: string | undefined;
    changeValidityDuration: (params: {
        validityDuration: S3FileRequestCreationDialogProps.ValidityDuration;
    }) => void;
    changeMaxObjectSize: (params: {
        maxObjectSize: S3FileRequestCreationDialogProps.MaxObjectSize;
    }) => void;
    retryGeneration: () => void;
    createEmptyFolder: () => void;
};

export namespace S3FileRequestCreationDialogProps {
    export type ValidityDuration = "one hour" | "one day" | "one week";

    export type MaxObjectSize = "no limit" | "10 MB" | "100 MB" | "1 GB" | "5 GB";
}
```

# General Structure

The component renders a regular box composed of:

1. A destination folder summary and explanatory text
2. A link settings section
3. An upload link section
4. A bottom security note

The parent owns modal chrome, title, close button, URL generation, state updates,
and lifecycle.

The component has a 760px content width and shrinks to fit narrower containers.
Long generated URLs must never increase that width.

# Rendering Rules

## Destination Folder

Display `folderName` with a folder icon, followed by text explaining that the link
can be shared with anyone, including someone without an account, to upload files
to this folder.

Long folder names must wrap without breaking the layout.

When `isEmptyPrefix` is false, display a warning that files uploaded through the
link will replace existing files with the same name and path. The warning must
offer an accessible button styled as a link that invokes `createEmptyFolder()`.
Do not display the warning when `isEmptyPrefix` is true.

## Link Settings

Render two controlled selects:

- **Link expires after**, bound to `validityDuration`
- **Maximum size per file**, bound to `maxObjectSize`

The validity selector offers exactly:

- One hour
- One day
- One week

Selecting a value invokes:

```ts
changeValidityDuration({ validityDuration });
```

The maximum file size selector offers exactly:

- No limit
- 10 MB
- 100 MB
- 1 GB
- 5 GB

Selecting a value invokes:

```ts
changeMaxObjectSize({ maxObjectSize });
```

The size limit applies independently to each uploaded file, not to the total size
of all files uploaded through the link.

## Upload Link States

The upload link section has three states controlled by `uploadPageUrl` and
`errorMessage`.

### Pending

When `errorMessage === undefined` and `uploadPageUrl === undefined`:

- display a generating-link placeholder
- disable the copy action

### Ready

When `errorMessage === undefined` and `uploadPageUrl !== undefined`:

- display the opaque Onyxia URL as neutral, single-line link text
- truncate the visible text when needed instead of exposing or emphasizing the URL structure
- preserve the complete URL for navigation and copying
- let the user open the URL in a new browser tab
- let the user copy the complete URL
- show the standard copied confirmation after a successful copy

### Error

When `errorMessage !== undefined`:

- replace the URL field with an error alert
- display a retry button
- invoke `retryGeneration()` when the retry button is clicked

The component does not display the raw `errorMessage`; the prop determines that
the error state is active while the visible message remains localized and safe for
end users.

## Security Note

Display a prominent informational note explaining that anyone with the link can
upload files to the destination folder until the link expires.

# Accessibility

- Both selects have accessible names describing their setting.
- The generation failure container uses `role="alert"`.
- The copy button has an accessible name.
- The copy button is disabled while no URL is available.
- The URL can receive keyboard focus and opens with safe new-tab attributes.
- Focus states must remain visible on all interactive elements.

# Layout Rules

- The component fills the available modal body width and does not impose modal
  sizing.
- Settings use two columns when space permits and one column at narrow widths.
- Long folder names and URLs must not cause horizontal overflow.
- Sections are visually separated while remaining part of a single vertical form.
- The optional `className` is merged with the root styles so the parent can size or
  position the component.
