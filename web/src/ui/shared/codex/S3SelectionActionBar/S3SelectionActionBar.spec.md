# Intent

`S3SelectionActionBar` is the contextual action bar displayed when one or more items are selected in the S3 storage list.

Its primary purpose is to expose the available actions for the current selection of S3 items (prefixes or objects).

The component reflects the selection state but does not manage it.

# Props

```ts
import type { S3Uri } from "core/tools/S3Uri";

type S3SelectionActionBarProps = {
    className?: string;

    /** When mounted there is at least one item in the list */
    selectedS3Uris: S3Uri[];

    /** Function to clear the selection and hide the selection action bar */
    onClear: () => void;

    /** Always visible */
    onDownload: () => void;
    onDelete: () => void;

    /** Only visible when only one item is selected */
    onCopyS3Uri: () => void;

    /** Only visible when selectedS3Uris contains one element
     *  and this element is of type S3Uri.NonTerminatedByDelimiter */
    onShare: () => void;

    /** Only visible when one element is selected */
    onRename: () => void;
};
```

# General Structure

This component acts as a wrapper for selection-based actions related to the S3 storage list.

It is displayed only when at least one item is selected.

The component is composed of two main areas:

A left section displaying the selection summary

A right section displaying the available actions

The layout is horizontal and must remain on a single line.

# Rendering rules

The component is rendered only when:

```ts
selectedS3Uris.length > 0;
```

### Selection summary

The left part of the component displays the number of selected items.

Examples:

- `1 selected`
- `2 selected`

The selection summary is displayed inside a pill container.

A close icon is displayed on the left side of the pill.

### Close interaction

Clicking the close icon triggers: `onClear()`

### Actions rendering

Actions are displayed on the right side of the bar.

Each action is rendered as:

```ts
[ icon ] label
```

### Always visible actions

These actions must always be rendered:

- Download → `onDownload`
- Delete → `onDelete`

### Single selection actions

These actions are rendered only when:

```ts
selectedS3Uris.length === 1;
```

- Copy S3 path → `onCopyS3Uri`
- Rename → `onRename`

### Conditional single selection action

The Share action is rendered only when:

```ts
selectedS3Uris.length === 1
&& selectedS3Uris[0] is S3Uri.NonTerminatedByDelimiter
```

- Share → `onShare`

### Multi-selection

When multiple items are selected:

- Visible actions:
- Download
- Delete

Hidden actions:

- Share
- Copy S3 path
- Rename

# Layout Rules

- The component is a horizontal container that spans the full width.
- The layout is displayed on a single line.
- The selection summary is left-aligned.
- The actions are slightly spaced out to the right.
- The actions are displayed in a single row with uniform spacing.

# Visual rules

## Container

The component is rendered as a full-width horizontal container.

- Border radius: `radius.full`
- Height: aligned with design token for toolbar height (same as S3UriBar / Bookmark bar rhythm)
- Padding: /

### Surface

- Background: `theme.colors.useCases.surfaces.surface1`

## Selection summary (left pill)

The selection summary is displayed inside a pill container.

### Layout

- Padding:
- Gap between icon and text: ` theme.spacing(2),`

### Surface

- Background: `theme.colors.useCases.surfaces.surfaceFocus1`

### Typography

- Font: theme.typography.variants["label 2"]
- Color: `theme.colors.useCases.typography.textPrimary`

### Icon (clear action)

- Icon size: `16px`
- Color: `text.primary`
- Hover:
    - Background: `theme.colors.useCases.surfaces.surfaceFocus1`
    - Cursor: pointer

---

## Actions (right section)

Each action is composed of:

```ts
[ icon ] label
```

### Layout

- Gap (icon → label): /
- Gap between actions: /

### Typography

- Font: theme.typography.variants["label 2"]
- Color: `theme.colors.useCases.typography.textPrimary`

### Icons

- Size: `24px`
- Color: `theme.colors.useCases.typography.textPrimary`

## Action states

### Default

- Background: transparent
- No border

### Hover

- Background: `theme.colors.useCases.surfaces.surface3`
- Border radius: `radius.full`

### Active (pressed)

- Background: `theme.colors.useCases.surfaces.surface3`
- Text & Color: `theme.colors.useCases.typography. textFocus`
