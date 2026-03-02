import type { S3Uri } from "core/tools/S3Uri";

/**
 * Styling guidelines (tss-react)
 *
 * Each component owns a dedicated `useStyles` created via `tss.create()`.
 * Prefer `tss.withParams<...>().create(...)` to generate conditional styles,
 * instead of composing many atomic variants manually.
 *
 * ✅ Do:
 *   const useStyles = tss.withParams<{ isSomething: boolean }>()
 *     .create(({ isSomething }) => ({ root: { ... } }));
 *
 *   const { classes, cx } = useStyles({ isSomething });
 *   <div className={cx(classes.root, className)} />
 *
 * ❌ Avoid:
 *   <div className={cx(classes.root, isSomething && classes.root_something, className)} />
 */

/**
 * S3UriBar
 *
 * A Chrome-like “address bar” for S3 prefixes.
 *
 * It is a controlled component (state is driven by props) and mostly stateless.
 * External code is responsible for:
 * - debounced listing / validation as the user types
 * - fetching hints content
 *
 * The bar supports two modes:
 * - Editing mode: text input + optional hint panel (keyboard navigable).
 * - Navigation mode: breadcrumb-like view where segments are clickable.
 */
export type S3UriBarProps = {
    /**
     * Allows the parent to position/size the component.
     *
     * Must take precedence over internal styles:
     *   className={cx(classes.root, props.className)}
     */
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
     * Request a mode toggle.
     *
     * The component decides *when* to request toggles based on user interactions:
     * - Enter editing mode:
     *   - pointer down anywhere inside the bar, except on a path segment
     *   - long-press on a path segment (press duration >= 100ms)
     * - Stay in navigation mode:
     *   - short click on a path segment (press duration < 100ms) triggers navigation instead
     * - Return to navigation mode:
     *   - on blur (component loses focus)
     *   - on Escape (while editing)
     */
    toggleIsEditing: () => void;

    /**
     * Hints to display while editing.
     *
     * - type: "object" => object entry
     * - type: "key-segment" => common prefix / folder-like segment
     *
     * Note: ordering, debouncing, and content correctness are external responsibilities.
     */
    hints: Array<{
        type: "object" | "key-segment";
        name: string;
    }>;

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

export function S3UriBar(_props: S3UriBarProps) {
    return null;
}
