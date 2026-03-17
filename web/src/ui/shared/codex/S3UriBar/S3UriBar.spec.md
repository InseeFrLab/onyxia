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
- Exposing whether hint computation is currently in flight.
- Deciding whether bookmark toggling is available.

## Modes

The component has two modes:

- Navigation mode: breadcrumb-like path with clickable segments.
- Editing mode: text input with optional keyboard-navigable hints and loading feedback in the hints overlay.

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
     * In this locked editing mode, losing focus must not exit editing mode, but it should hide
     * the hints overlay until the component gains focus again.
     * onS3UriPrefixChange() should be called whenever the current input changes.
     * It should receive:
     * - a parsed S3Uri when the current input is parsable
     * - undefined when the current input is not parsable
     * This enables the parent/core layer to compute the right hints while the user types.
     * When s3Uri is undefined there can be hint but only of type "bookmark".
     * For example hints can be:
     * [
     *  {
     *      type: "bookmark",
     *      text: "s3://mybucket/",
     *      s3Uri: parseS3Uri({ value: "s3://mybucket/", delimiter: "/" })
     *  },
     *  {
     *      type: "bookmark",
     *      text: "s3://donee-insee/diffusion/",
     *      s3Uri: parseS3Uri({
     *          value: "s3://donee-insee/diffusion/",
     *          delimiter: "/"
     *      })
     *  }
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
    onS3UriPrefixChange: (params: {
        s3Uri: S3Uri | undefined;

        /**
         * Lets the parent distinguish interactive hint selection from manual editing.
         *
         * - true => the change comes from selecting a hint with pointer or keyboard
         * - false => the change comes from manual typing, manual validation, or breadcrumb navigation
         */
        isHintSelection: boolean;
    }) => void;

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
     *
     * `s3Uri` is the full target location for the hint.
     * When a hint is selected, the component should forward this `s3Uri` as-is instead of
     * trying to reconstruct a new URI by appending `text` to the current draft.
     */
    hints: {
        type: "object" | "key-segment" | "bookmark";
        text: string;
        s3Uri: S3Uri;
    }[];

    /**
     * Whether the parent is currently computing or fetching hints for the current draft.
     *
     * When true and the component is in editing mode, the hints overlay should stay visible.
     * - Show a subtle linear loading indicator in the overlay.
     * - If hints are not available yet, keep the overlay open and show a loading-only state
     *   with the text "Listing...".
     */
    areHintsLoading: boolean;

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
    - Home/root button short click => enter editing mode with `s3://` as the draft.
    - Segment short click => request navigation (`onS3UriPrefixChange`).
    - Segment long press (`>= 100ms`) => enter edit mode (internal state).
- Editing mode:
    - Input updates are handled by parent via requested prefix changes.
    - Invalid drafts should trigger `onS3UriPrefixChange({ s3Uri: undefined, isHintSelection: false })`.
    - Hints are selectable (pointer and keyboard).
    - The hints overlay is shown only when the caret is at the end of the current input value.
    - Moving the caret away from the end hides the hints overlay and disables keyboard hint navigation until the caret returns to the end.
    - Selecting a hint should call `onS3UriPrefixChange({ s3Uri: hint.s3Uri, isHintSelection: true })`.
    - Hint selection must not rebuild the URI from `hint.text` and the current draft.
    - Manual typing, Enter-to-commit, blur-to-commit, and breadcrumb navigation should call `onS3UriPrefixChange(..., isHintSelection: false)`.
    - The hints overlay remains visible while `areHintsLoading` is true, even if there is no hint yet.
    - Loading feedback should appear inside the overlay rather than elsewhere in the bar.
    - The loading feedback uses a linear progress indicator, including when there is no suggestion yet.
    - `Escape` returns to navigation mode.
    - `Enter` returns to navigation mode when `s3Uri` is defined and no hint is displayed.
- Focus handling:
    - Blur returns to navigation mode when the component is not in undefined-prefix mode.
    - In undefined-prefix mode, blur keeps the component in editing mode but hides the hints overlay.
    - In undefined-prefix mode, the hints overlay reappears when focus comes back.
