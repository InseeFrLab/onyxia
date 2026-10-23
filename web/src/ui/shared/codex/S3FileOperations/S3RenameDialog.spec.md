# S3RenameDialog

## Intent

A core-independent rename form for one file or directory, using existing S3 dialog primitives.

## Contract

Receives the existing name, item kind, delimiter, open state, and callbacks. `onConfirm` returns a single basename, including the extension for files. `className` overrides root styling.

## Behavior

- Focus and select the existing name on opening.
- Reject empty/whitespace-only names and path separators.
- Disable confirmation until the name changes and is valid.
- Enter confirms valid input. Cancel, Close, and Escape do not submit.
- Existing destination conflicts are resolved after submission by the operation conflict dialog, rather than rejecting a duplicate basename here.

## Storybook

File, directory, keyboard submission, invalid names, and Escape cancellation.
