# S3FileOperationConflictDialog

## Intent

A core-independent decision dialog for one directory or object conflict.

## Contract

Receives a unique question ID, item kind, operation kind, name, source and destination strings, and `onResolve`. The response is proceed/skip with a remember-choice flag, or cancel. The page integration translates proceed to merge or overwrite.

## Behavior

- Directory conflicts offer Merge, Skip (keep existing), and Cancel all.
- Object conflicts offer Overwrite, Skip (keep existing), and Cancel all.
- Explain that merging overwrites conflicting descendants and preserves destination-only files.
- Explain that skipped move/rename sources remain in place.
- Remember-choice labels explicitly distinguish directories from files and scope choices to this operation.
- Reset the checkbox for each question ID.
- Close, Escape, and backdrop dismissal resolve Cancel all. They never silently skip an item.
- The parent queues concurrent questions and dismisses obsolete questions when their operation is canceled.

## Storybook

Directory and object conflicts, remembered merge, skip, cancellation, and checkbox reset between questions.
