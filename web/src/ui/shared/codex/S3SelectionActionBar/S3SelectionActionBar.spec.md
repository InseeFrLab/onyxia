# Intent

`S3SelectionActionBar` is the contextual action bar displayed when one or more items are selected in the S3 storage list.

Its primary purpose is to expose the actions that the parent component declares available for the current selection.

The component reflects the selection count but does not manage selection state or infer which actions make sense for the selected S3 items.

# Props

```ts
type S3SelectionActionBarProps = {
    className?: string;

    selectionCount: number;

    /** Function to clear the selection and hide the selection action bar */
    onClear: () => void;

    onDownload: (() => void) | undefined;

    onDelete: (() => void) | undefined;

    onCopyS3Uri: (() => void) | undefined;

    onShare: (() => void) | undefined;

    onMakePublic: (() => void) | undefined;

    onMakePrivate: (() => void) | undefined;
};
```

# General Structure

This component acts as a presentational wrapper for selection-based actions related to the S3 storage list.

It is displayed only when at least one item is selected.

The component is composed of two main areas:

A left section displaying the selection summary

A section displaying the available actions, aligned to the left of the bar

The layout is horizontal and must remain on a single line.

# Rendering rules

The component is rendered only when:

```ts
selectionCount > 0;
```

The parent is expected to mount it only when there is a selection. If `selectionCount` is `0`, the component renders nothing.

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

The component does not inspect selected S3 URIs or decide action availability from selection shape.

Each action button is rendered only when its callback prop is defined.

### Optional actions

- Download → rendered when `onDownload !== undefined`
- Delete → rendered when `onDelete !== undefined`
- Copy S3 path → rendered when `onCopyS3Uri !== undefined`
- Share → rendered when `onShare !== undefined`
- Make public → rendered when `onMakePublic !== undefined`
- Make private → rendered when `onMakePrivate !== undefined`

Clicking a rendered action calls its matching callback.

The parent component is responsible for passing `undefined` for actions that do not make sense for the current context, such as single-object-only or single-selection-only actions.

### Optional action icons

- Make public uses the `Public` icon.
- Make private uses the `PublicOff` icon.

# Layout Rules

- The component is a horizontal container that spans the full width.
- The layout is displayed on a single line.
- The selection summary is left-aligned.
- The actions are left-aligned, with a noticeable gap from the selection summary.
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

## Actions (left section)

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
