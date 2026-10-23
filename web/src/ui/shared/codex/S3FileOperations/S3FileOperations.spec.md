# S3FileOperations

## Intent

A core-independent progress panel for current and finished rename, copy, and move requests, using the Figma compact tracking panel as a reference.

## Contract

Receives operation rows with names, destination strings, phases, optional totals/percentages, byte counts, and errors. Callbacks cancel an operation or dismiss finished operations. No core state or hooks are imported. `className` controls positioning.

## Behavior

- Render nothing when there are no operations.
- Show preparation/conflict checks with indeterminate progress until totals are known.
- Show copying, source deletion, completed, failed, and canceled phases explicitly. Copy percentages are not network download progress.
- Show byte totals and completed-object counts when available.
- Keep errors inspectable and long names/paths available through titles.
- Collapse/expand the list without affecting execution.
- Cancel an individual running operation through its callback.
- Closing with ongoing work asks for confirmation, explaining that cancellation does not undo completed changes.
- Closing finished work dismisses it directly.
- Page integration stacks the panel with uploads and keeps feedback mounted across route changes.

## Storybook

Preparation, copying, deletion, completion, partial failures, mixed operations, cancellation, close confirmation, and collapse/expand.
