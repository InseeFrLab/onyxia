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

The component is responsible for:

- Copying the current S3 URI to the clipboard when the user activates the copy action.
- Showing and clearing its own copied feedback. Parent code does not provide copied state and does not receive a copy callback.
- Showing the same copied feedback when the parent emits an imperative copy-feedback action for a provided S3 URI.
- The imperative copy-feedback action must not perform clipboard writes. It is only visual feedback for copy work already handled outside of this component.

## Modes

The component has two modes:

- Navigation mode: breadcrumb-like path with clickable segments.
- Editing mode: text input with optional keyboard-navigable hints and loading feedback in the hints overlay.

## Props Contract

```ts
import type { NonPostableEvt } from "evt";
import type { S3Uri } from "core/tools/S3Uri";

export type S3UriBarAction = {
    action: "display copy feedback";
    s3Uri: S3Uri;
};

export type S3UriBarProps = {
    className?: string;

    /**
     * The currently selected S3 URI and, when applicable, the public prefix that contains it.
     *
     * Example object (simplified):
     *   const s3Uri = {
     *     s3Uri: parseS3Uri({ value: "s3://bucket/private/public-child/", delimiter: "/" }),
     *     s3Uri_publicPrefix: parseS3Uri({ value: "s3://bucket/private/", delimiter: "/" })
     *   }
     *
     * Use helpers from `core/tools/S3Uri` to parse/stringify/manipulate.
     *
     * The prop can be undefined. In this case the component should be locked in editing mode.
     * The text input should be set by default to s3://
     * And the state representing input text should be internal to the component.
     * In this locked editing mode, losing focus must not exit editing mode, but it should hide
     * the hints overlay until the component gains focus again.
     * onS3UriChange() should be called whenever the current input changes.
     * It should receive:
     * - a parsed S3Uri when the current input is parsable
     * - undefined when the current input is not parsable
     * This enables the parent/core layer to compute the right hints while the user types.
     * When s3Uri is undefined there can be hints but only of type "bookmark-admin" or "bookmark-user".
     * For example hints can be:
     * [
     *  {
     *      type: "bookmark-user",
     *      text: "s3://mybucket/",
     *      s3Uri: parseS3Uri({ value: "s3://mybucket/", delimiter: "/" })
     *  },
     *  {
     *      type: "bookmark-admin",
     *      text: "s3://donee-insee/diffusion/",
     *      s3Uri: parseS3Uri({
     *          value: "s3://donee-insee/diffusion/",
     *          delimiter: "/"
     *      })
     *  }
     * ]
     * The component is responsible for filtering out the irrelevant hint entry as the user types
     * For example when the current value of the input is "s3://my" only the "s3://mybucket/" hint should appear.
     *
     * When s3Uri_publicPrefix is defined:
     * - it must be a delimiter-terminated S3 URI
     * - it is expected to be either equal to s3Uri.s3Uri or a prefix of s3Uri.s3Uri
     * - the breadcrumb path should mark the public part of the path in navigation mode
     * - the public marker starts on the last crumb of s3Uri_publicPrefix
     * - when s3Uri.s3Uri is under s3Uri_publicPrefix, descendants of s3Uri_publicPrefix stay marked as public
     */
    s3Uri:
        | {
              s3Uri: S3Uri;
              s3Uri_publicPrefix: S3Uri.TerminatedByDelimiter | undefined;
          }
        | undefined;

    /**
     * Request a change to the current prefix.
     *
     * Called when:
     * - user selects a hint
     * - user validates input externally (if you wire that)
     * - user clicks a breadcrumb segment in navigation mode
     */
    onS3UriChange: (params: {
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
     * - type: "bookmark-admin" => Admin-provided known location. Example "2026/quarter-2/foo.csv"
     * - type: "bookmark-user" => User-provided known location. Example "2026/quarter-2/foo.csv"
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
        type: "object" | "key-segment" | "bookmark-admin" | "bookmark-user";
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
    onToggleBookmark?: (props: { s3Uri: S3Uri }) => void;

    /**
     * Optional imperative action bus.
     *
     * Supported action:
     * - { action: "display copy feedback", s3Uri }
     *
     * This lets a parent display copied feedback in the bar after an external copy
     * operation, for example copying a selected object from another toolbar.
     * The component must only display feedback for the provided URI. It must not
     * call copyToClipboard in response to this action.
     */
    evtAction?: NonPostableEvt<S3UriBarAction>;
};
```

## Interaction Summary

- Navigation mode:
    - When a public prefix is present, show a small `Public` icon next to the first public breadcrumb crumb and visually group the public tail of the path.
    - For `s3://bucket/a/b/c/` with public prefix `s3://bucket/a/`, the public marker starts on `a`, because `a/` is the public prefix itself.
    - For `s3://bucket/a/b/c/` with public prefix `s3://bucket/a/b/`, the public marker starts on `b`, because `b/` is the last crumb of the public prefix.
    - For `s3://bucket/a/` with public prefix `s3://bucket/a/`, the public marker starts on `a`, because the current crumb is the public prefix itself.
    - Copy button click => stringify the current S3 URI and copy it with `copyToClipboard`.
    - Copied feedback is internal to the component and should reset after a short delay or when the current S3 URI changes.
    - `evtAction` `{ action: "display copy feedback", s3Uri }` => stringify the provided S3 URI and display copied feedback without calling `copyToClipboard`.
    - Home/root button short click => enter editing mode with `s3://` as the draft.
    - Key icon short click => enter editing mode and select the object-key portion of the URI, from after `s3://bucket/` to the end.
    - Segment short click => request navigation (`onS3UriChange`).
    - Segment long press (`>= 100ms`) => enter edit mode (internal state).
- Editing mode:
    - Input updates are handled by parent via requested prefix changes.
    - If the parent updates `s3Uri` externally while edit mode is open, the input draft must resync to that external value.
    - Invalid drafts should trigger `onS3UriChange({ s3Uri: undefined, isHintSelection: false })`.
    - Hints are selectable (pointer and keyboard).
    - The hints overlay is shown only when the caret is at the end of the current input value.
    - Moving the caret away from the end hides the hints overlay and disables keyboard hint navigation until the caret returns to the end.
    - Selecting a hint should call `onS3UriChange({ s3Uri: hint.s3Uri, isHintSelection: true })`.
    - When a hint is active, `Tab` should accept it exactly like `Enter`.
    - Hint selection must not rebuild the URI from `hint.text` and the current draft.
    - When the hints overlay is visible, `Escape` should blur the input and therefore dismiss focus from the component.
    - Manual typing, Enter-to-commit, blur-to-commit, and breadcrumb navigation should call `onS3UriChange(..., isHintSelection: false)`.
    - The hints overlay remains visible while `areHintsLoading` is true, even if there is no hint yet.
    - Loading feedback should appear inside the overlay rather than elsewhere in the bar.
    - The loading feedback uses a linear progress indicator, including when there is no suggestion yet.
    - `Escape` returns to navigation mode.
    - `Enter` returns to navigation mode when `s3Uri` is defined and no hint is displayed.
- Focus handling:
    - Blur returns to navigation mode when the component is not in undefined-prefix mode.
    - In undefined-prefix mode, blur keeps the component in editing mode but hides the hints overlay.
    - In undefined-prefix mode, the hints overlay reappears when focus comes back.
