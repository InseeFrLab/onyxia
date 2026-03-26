# S3Uploads Spec

# Intent

`S3Uploads` is a compact floating upload status panel used to display the current and recent upload activity for S3 objects.

Its primary purpose is to:

- give feedback about ongoing uploads,
- show the status of recent uploads,
- allow users to understand whether an upload is still running, completed, cancelled, or failed,
- provide quick access to the uploaded directory when relevant,
- allow clearing completed uploads.

The component is informational and action-oriented, but does not own upload execution logic.

# Props

```ts
import type { Link } from "type-route";

type S3UploadsProps = {
    // We expect the component to have a fixed with specified by the parent.
    className?: string;

    uploads: {
        id: string;
        profileName: string;
        s3Uri: S3Uri.NonTerminatedByDelimiter;
        directoryLink: Link;
        size: number; // In Bytes
        completionPercent: number; // From 0 to 100 - Example: 35

        status: "uploading" | "completed" | "cancelled" | "error";

        /** OPTIONAL */
        message?: string;
    }[];

    onClearCompleted: () => void;
    onCancelUpload: (params: { uploadId: string }) => void;
    onDeleteUpload: (params: { uploadId: string }) => void;
    onRetryUpload: (params: { uploadId: string }) => void;
};
```

# General Structure

This component is a floating panel composed of:

1. A header row
2. A vertical list of upload items

The component has a fixed width defined by the parent.

It is displayed as an overlay panel and does not affect surrounding layout.

The panel is intended to remain visually compact, readable, and secondary to the main storage view.

If `uploads` is empty, the component does not render.

# Header

The header displays a summary of the current upload activity.

Expected content:

- Title indicating the number of uploads
- Collapse / expand affordance
- Close affordance

Example:

```ts
Importation de 2 éléments...
```

The exact wording may vary depending on localization rules.

### Header interactions

#### Collapse / Expand

The panel may be collapsible.

Clicking the collapse icon toggles the visibility of the upload list while keeping the header visible.
This behavior is managed internally by the component.

# Upload

## Upload List

The body of the panel renders one row per upload entry.

Each upload row represents one uploaded file/object.

The list is vertical and ordered from top to bottom.

The expected order is:

- most relevant / most recent first

If ordering rules differ, they must be enforced by the parent.

## Upload Item Model

Each upload item is derived from one entry in `props.uploads`.

Available data per item:

- `id`
- `profileName`
- `s3Uri`
- `directoryLink`
- `size`
- `completionPercent`
- `status`
- `message` (optional)

## Upload States

The mockups show four main visual states:

1. Uploading
2. Cancelled
3. Completed
4. Error

Upload state is driven by `status`. `completionPercent` remains the source of truth
for progress display when `status === "uploading"`.

### Uploading state

An item is considered uploading when `status === "uploading"`.

#### Expected UI

- File icon
- File name
- Progress text
- Progress bar
- Optional cancel action

Example content:

```ts
nyr_data.csv
5,7 MB sur 7,8 MB - Uploading... 72%
Progress bar
```

#### Progress bar

A progress bar is displayed below the metadata line.

Rules:

Full-width inside the item row
Track uses neutral subtle surface
Progress fill uses accent color

### Completed state

An item is considered completed when `status === "completed"`.

Expected UI

- File icon
- File name
- Completion message
- Optional success icon
- Action to open the uploaded directory

Example content:

```ts
nyr_data.csv
5,7 MB sur 7,8 MB - Completed
```

A button action at the left with directoryLink.

### Error state

Includes :

- error label
- retry-like affordance
- explicit error status (rattached to the core)

This state is represented via `status === "error"` and may include `message`.

# Rendering Rules

For each entry in `props.uploads`, the component renders one upload item row.

Each row displays:

- file icon
- file name
- metadata/status line
- optional action icon depending on state

The component groups all imports regardless of the S3 profile.

# Item Actions

Depending on state, an upload row may expose a trailing action.

## Uploading

Possible action:

- cancel

Handled via `onCancelUpload`.

## Completed

Possible action:

- open uploaded directory

This action uses directoryLink.

## Error

Possible action:

- retry

Handled via `onRetryUpload`.

## Cancelled

Possible action:

- delete / dismiss row

Handled via `onDeleteUpload`.

## Clear Completed

The component exposes a bulk cleanup action through:

```ts
onClearCompleted: () => void;
```

This action is intended to remove completed uploads from the panel. It's placed in the header.

# Layout Rules

### Panel container

- Fixed width defined by parent
- Vertical layout
- Rounded corners
- Elevated floating surface
- Overlay panel, not inline content

### Internal structure

- Header at top
- Divider below header
- Vertical item stack
- Items separated by subtle dividers

### Item layout

Each upload item uses a two-column structure:

- leading icon / content block
- trailing action

For uploading items, the progress bar sits below the metadata line.

# Visual Rules

### Panel container

- Background: `theme.colors.useCases.surfaces.surface1`
- Border radius: `radius.xl`
- Shadow: `shadow.md` or equivalent floating panel elevation
- Border: subtle if needed for contrast

#### Header

- Typography: `theme.typography.variants["label 1"]`
- Text color: `theme.colors.useCases.typography.primary`
- Icons aligned right
- Divider below header

### Upload item

#### Default surface

- Background: `transparent`
- Padding: `medium`
- Divider between items

#### File icon container

- Rounded square
- Background: `theme.colors.useCases.surfaces.surface2`
- Icon centered

#### File name

- Typography: `theme.typography.variants["label 1"]`
- Color:`theme.colors.useCases.typography.primary`
- Single line
- Ellipsis if too long

#### Metadata / status line

- Typography: `theme.typography.variants["caption"]`
- Color: `theme.colors.useCases.typography.secondary`

### Progress bar

#### Track

- Background: `theme.colors.useCases.surfaces.surface3`

#### Fill

- Background: `theme.colors.useCases.typography.textFocus`

#### Status text

- Uploading: `theme.colors.useCases.typography.secondary`
- Completed: may include success `theme.colors.useCases.alertSeverity.success.main`
- Error: `theme.colors.useCases.alertSeverity.error.main`
- Cancelled: muted text
