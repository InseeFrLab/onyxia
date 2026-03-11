# S3UriBar Spec

## Purpose

`S3UriBar` is a Chrome-like address bar for S3 prefixes.

It is a partially controlled UI component:

- `s3Uri`, hints, and bookmark state are provided by props.
- The component requests S3 URI changes through callbacks.
- Editing mode (`isEditing`) is internal to the component.
- Parent code owns business logic and data fetching.

## External Responsibilities

The parent (or surrounding usecase layer) is responsible for:

- Debounced listing/validation while the user types.
- Fetching and ordering hint content.
- Deciding whether bookmark toggling is available.

## Modes

The component has two modes:

- Navigation mode: breadcrumb-like path with clickable segments.
- Editing mode: text input with optional keyboard-navigable hints.

## Props Contract

```ts
export type S3UriBarProps = {
    className?: string;

    /**
     * The currently selected S3 prefix.
     *
     * Example object (simplified):
     *   const s3Uri: S3Uri = { ... }
     *
     * Use helpers from `core/tools/S3Uri` to parse/stringify/manipulate.
     *
     * The s3Uri can be undefined. In this case the component should be locked in editing mode.
     * The text input should be set by default to s3://
     * And the state representing input text should be internal to the component.
     * onS3UriPrefixChange() should only be called when the user have typed an uri that is
     * successfully parsable as a S3Uri (parseS3Uri() does not throw) and when enter is pressed, or the focus
     * is lost.
     * When s3Uri is undefined there can be hint but only of type "bookmark".
     * For example hints can be:
     * [
     *  { type: "bookmark", text: "s3://mybucket/" },
     *  { type: "bookmark", text: "s3://donee-insee/diffusion/" }
     * ]
     * The component is responsible for filtering out the irrelevant hint entry as the user types
     * For example when the current value of the input is "s3://my" only the "s3://mybucket/" hint should appear.
     */
    s3Uri: S3Uri | undefined;

    /**
     * Request a change to the current prefix.
     *
     * Called when:
     * - user selects a hint
     * - user validates input externally (if you wire that)
     * - user clicks a breadcrumb segment in navigation mode
     */
    onS3UriPrefixChange: (params: { s3Uri: S3Uri }) => void;

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
    - Segment long press (`>= 100ms`) => enter edit mode (internal state).
- Editing mode:
    - Input updates are handled by parent via requested prefix changes.
    - Hints are selectable (pointer and keyboard).
    - `Escape` returns to navigation mode.
- Focus handling:
    - Blur returns to navigation mode.
