# S3FileOperationDestinationDialog

## Intent

A core-independent destination browser for copy and move, matching the Figma move dialog.

## Contract

Plain string URIs, a delimiter, source descriptions, and a `loadDirectories` callback are supplied by the caller. `onConfirm` returns the selected directory; `onClose` makes no changes. `className` overrides the root styling.

## Behavior

- Navigate through folder rows, parent-folder controls, or clickable breadcrumbs.
- Edit a complete S3 URI, including a different bucket; Enter or Go applies it.
- Preserve literal S3 key characters, repeated delimiters, spaces, and percent signs.
- Disable confirmation while editing, loading, creating a prefix, listing an inaccessible destination, or targeting a source itself/its descendants.
- Ignore responses from obsolete directory requests and requests resolved after closing.
- Show loading, empty, and error states, with a retry action.
- Create new prefixes virtually, matching the explorer's existing directory convention. Objects are created only when the operation runs.
- Folder creation rejects empty names, duplicate directory names, and path separators.
- Close and Escape cancel without invoking `onConfirm`.

## Storybook

Move, copy, loading, empty, error, long paths, folder navigation, URI editing, invalid destinations, and prefix creation. Interaction stories verify the returned destination and disabled states.
