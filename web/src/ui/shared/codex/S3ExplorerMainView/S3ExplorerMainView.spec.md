# Intent

`S3ExplorerMainView` is the main listing surface for an S3 prefix.

Its primary purpose is to display and interact with the content of a storage location in a table-like explorer view.

The component focuses on:

- listing S3 items
- navigating through prefixes
- sorting visible items
- selecting one or many items
- exposing row-level and bulk actions

`S3ExplorerMainView` does not display the current S3 URI context itself.  
This context is handled by surrounding components such as:

- `S3UriBar`
- `S3BookmarksBar`
- `S3SelectionActionBar`

# Props

```ts
export type S3ExplorerMainViewProps = {
    className?: string;

    isListing: boolean;
    listedPrefix:
        | {
              isErrored: true;
              errorCase: "access denied" | "no such bucket";
          }
        | {
              isErrored: false;
              items: S3ExplorerMainViewProps.Item[];
          };

    onNavigate: (params: { s3Uri: S3Uri }) => void;

    onPutObjects: (params: {
        files: {
            relativePathSegments: string[];
            fileBasename: string;
            blob: Blob;
        }[];
    }) => void;

    onCreateDirectory: (params: { prefixSegment: string }) => void;

    onDelete: (params: { s3Uris: S3Uri[] }) => void;

    getDirectDownloadUrl: (params: {
        s3Uri: S3Uri.NonTerminatedByDelimiter;
        validityDurationSecond?: number;
    }) => Promise<string>;
};
```

# General Structure

This component acts as the main wrapper for the S3 listing area.

It is composed of three vertical zones:

1. Optional selection action bar area
2. Listing header row
3. Listing body

The component does not implement its own bulk action toolbar.
When one or more rows are selected, it must render the dedicated S3SelectionActionBar component above the list instead of redefining those actions locally.

Visual hierarchy:

```ts
S3UriBar
S3BookmarksBar (optional)
S3SelectionActionBar (only when selection > 0)
S3ExplorerMainView
```

# Listing Model

The component renders two types of items:

- prefix items
- object items

These two item types are displayed in the same list.

### Visual distinction

| Type   | Icon                | Meaning             |
| :----- | :------------------ | :------------------ |
| Prefix | Folder              | Navigable container |
| Object | File or object icon | Stored file/data    |

# Rendering rules

For each item in `listedPrefix.items`, the component renders one row.

Each row contains:

- selection checkbox
- item icon
- item label
- metadata columns
- contextual row actions

# Ordering

- Prefix items must always appear before object items.
- Sorting is applied within each group.
- Sorting must remain stable.

# Selection Model

Selection is an internal UI concern of `S3ExplorerMainView`.

The component manages row selection state in order to drive:

- selected row styles
- header checkbox state
- mounting of `S3SelectionActionBar`

### Selection rules

- Click on checkbox → toggles row selection
- Click on row → may select row depending on implementation choice
- `Ctrl` / `Cmd` click → toggles row in selection
- `Shift` click → selects a range
- Header checkbox → selects or clears all visible selectable rows

### Selection Action Bar integration

When: `selectedItems.length > 0`

The component renders `S3SelectionActionBar` above the list.

`S3ExplorerMainView` is responsible for deriving and passing:

- `selectedS3Uris`
- `onDownload`
- `onCopyS3Uri`
- `onDelete`
- `onShare`
- `onRename`
- `onClear`

The visual and interaction behavior of this bar is defined in the dedicated `S3SelectionActionBar` spec and must not be redefined here.

# Row interactions

### Navigation

Rows representing navigable items must support navigation through `onNavigate`.

Expected behavior:

- Prefix rows are navigable
- Object rows may be navigable depending on use case
- Double click may trigger navigation
- Clicking the item label may also trigger navigation

### Row actions

Each row can expose contextual actions on hover.

Typical row actions include:

- Share
- Download
- Copy S3 path
- Delete
- Overflow menu
- Row action rules
- Actions appear on focus only when:
    - the row is selected, or
    - the row has keyboard focus
- Actions must not appear on non-selected rows without hover
- Actions must not shift the row layout when appearing
- Actions remain secondary compared to the bulk action bar
- Actions are hidden when not relevant for the row type

# Sorting

The listing supports sorting by column.

Supported sort keys:

- name
- last modified
- size

### Sorting rules

- Clicking a sortable header toggles sorting direction
- Prefix items remain grouped before objects
- Sorting must not break prefix-first grouping

# Create directory

The component can expose a way to create a directory.

This interaction:

- opens a local creation flow (dialog, inline input, or equivalent)
- forwards the resulting prefix segment through onCreateDirectory

The exact creation UI is not specified here and may be handled by a dedicated sub-component or later specification.

# Loading state

When: `isListing === true`

The component provides loading feedback.

Rules:

- Existing visible content may remain visible
- Loading must not block the whole interface
- The component should avoid large empty placeholders when content is already available

# Error state

When: `listedPrefix.isErrored === true`

The component renders a dedicated error state instead of the list.

Supported error cases:

- access denied
- no such bucket

No rows should be displayed in this state.

# Layout rules

### Container

- Full width
- Content-driven height
- No unnecessary empty vertical space
- Border radius aligned with surrounding storage surfaces

### Table structure

The listing is displayed as a structured table-like view with:

- one header row
- multiple content rows

Columns visible in the current UI:

- selection
- name
- last modified
- size

The header and rows must remain perfectly aligned.

# Visual rules

### Global surface

- Background: `theme.colors.useCases.surfaces.surface1`
- Border radius: `radius.xl` or equivalent large radius token
- No strong elevation
- Clean and neutral container

The component should visually blend with the storage page while remaining clearly structured.

### Header row

- Background: `transparent`
- Typography: `Label1`
- Color: `theme.colors.useCases.typography.secondary`
- Header labels aligned with row content
- Sort affordances displayed inline with labels

The header checkbox is always visible.

### Rows

#### Default

- Background: transparent
- Divider between rows: subtle separator line

#### Hover

Background: `theme.colors.useCases.surfaces.surface3`

#### Selected

Background: `theme.colors.useCases.surfaces.surfaceFocus1`
Checkbox uses accent.primary

The selected row style must visually align with the S3SelectionActionBar summary pill and accent family.

### Icons

#### Item icon container

The current UI introduces a soft rounded square container behind file/folder icons.

Rules:

- Small rounded container
- Background: `theme.colors.useCases.surfaces.surface2`
- Border radius: `8px`
- Fixed square size
- Icon centered inside
- Folder / object icon
- Size: `32px`
- Color: `theme.colors.useCases.typography.primary`

### Typography

#### Item label

- Style: `theme.typography.variants["label 1"]`
- Color: `theme.colors.useCases.typography.primary`
- Single line
- Ellipsis if needed

#### Metadata

- Style: `theme.typography.variants["body 2"]`
- Color: `theme.colors.useCases.typography.secondary`
- Single line
- Right-aligned where relevant (e.g. size)

### Row actions

- Icon size: 16px
- Inline on the row
- Hidden by default
- Visible on hover or focus
- Hover background feedback: `theme.colors.useCases.surfaces.surface3`
- Must not dominate over item label and metadata
