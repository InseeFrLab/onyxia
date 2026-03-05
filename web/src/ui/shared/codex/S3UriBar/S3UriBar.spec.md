# S3UriBar Spec

## Purpose

`S3UriBar` is a Chrome-like address bar for S3 prefixes.

It is a controlled UI component:

- State is provided by props.
- The component requests changes through callbacks.
- Parent code owns business logic and data fetching.

## External Responsibilities

The parent (or surrounding usecase layer) is responsible for:

- Debounced listing/validation while the user types.
- Fetching and ordering hint content.
- Deciding whether bookmark toggling is available.

## Modes

The component has two modes:

- Navigation mode (`isEditing = false`): breadcrumb-like path with clickable segments.
- Editing mode (`isEditing = true`): text input with optional keyboard-navigable hints.

## Props Contract

```ts
export type S3UriBarProps = {
    className?: string;

    /**
     * The currently selected S3 prefix.
     *
     * Example object (simplified):
     *   const s3UriPrefix: S3Uri.Prefix = { ... }
     *
     * Use helpers from `core/tools/S3Uri` to parse/stringify/manipulate.
     */
    s3UriPrefix: S3Uri.Prefix;

    /**
     * Current mode.
     * - true  => Editing mode (text input + hints)
     * - false => Navigation mode (breadcrumb)
     */
    isEditing: boolean;

    /**
     * Request a change to the current prefix.
     *
     * Called when:
     * - user selects a hint
     * - user validates input externally (if you wire that)
     * - user clicks a breadcrumb segment in navigation mode
     */
    onS3UriPrefixChange: (params: { s3UriPrefix: S3Uri.Prefix }) => void;

    /**
     * Request an editing mode change.
     *
     * The component decides *when* to request mode changes based on user interactions:
     * - Request `isEditing: true`:
     *   - pointer down anywhere inside the bar, except on a path segment
     *   - long-press on a path segment (press duration >= 100ms)
     * - Stay in navigation mode:
     *   - short click on a path segment (press duration < 100ms) triggers navigation instead
     * - Request `isEditing: false`:
     *   - on blur (component loses focus)
     *   - on Escape (while editing)
     */
    onIsEditingChange: (params: { isEditing: boolean }) => void;

    /**
     * Hints to display while editing.
     *
     * - type: "object" => object entry. Example "foo.csv"
     * - type: "key-segment" => common prefix / folder-like segment. Example "quarter-2"
     * - type: "bookmark" => Known location. Example "2026/quarter-2/foo.csv"
     *
     * Note: ordering, debouncing, and content correctness are external responsibilities.
     *
     * Actually the semantic of the different types of items is out of scope for the component.
     * The component only needs to know the type so that the popup modal for selecting hits can
     * have different icons depending of the type of hint this is.
     */
    hints: {
        type: "object" | "key-segment" | "bookmark";
        text: string;
    }[];

    /**
     * Whether the current prefix is bookmarked.
     * If true, show an “active” bookmark indicator.
     */
    isBookmarked: boolean;

    /**
     * Called when the user requests bookmarking/unbookmarking.
     * Can be undefined when bookmarks are not editable in the current context.
     */
    onToggleBookmark?: () => void;
};
```

## Interaction Summary

- Navigation mode:
    - Segment short click => request navigation (`onS3UriPrefixChange`).
    - Segment long press (`>= 100ms`) => request edit mode (`onIsEditingChange({ isEditing: true })`).
- Editing mode:
    - Input updates are handled by parent via requested prefix changes.
    - Hints are selectable (pointer and keyboard).
    - `Escape` requests return to navigation mode.
- Focus handling:
    - Blur requests return to navigation mode.
