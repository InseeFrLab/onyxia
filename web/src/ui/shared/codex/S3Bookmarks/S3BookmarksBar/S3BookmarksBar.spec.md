# Intent

`S3BookmarksBar` is the horizontal list wrapper for `S3BookmarkItem` with `variant="bar"`.

Its primary purpose is to display a horizontal list of shortcuts to frequently used S3 paths while navigating inside an S3 profile.

# Props

```ts
import type { S3Uri } from "core/tools/S3Uri";
import type { LocalizedString } from "ui/i18n";
import type { Link } from "type-route";

export type S3BookmarksBarProps = {
    className?: string;
    items: S3BookmarksBarProps.Item[];
    activeItemS3Uri: S3Uri | undefined;
    onDelete: (props: { s3Uri: S3Uri }) => void;
    onRename: (props: { s3Uri: S3Uri }) => void;
    getItemLink: (props: { s3Uri: S3Uri }) => Link;
};

namespace S3BookmarksBarProps {
    export type Item = {
        displayName: LocalizedString | undefined;
        s3Uri: S3Uri;
        isReadonly: boolean;
    };
}
```

## General Structure

This component acts as the list wrapper for `S3BookmarkItem` with `variant="bar"`.

Its primary purpose is to display a horizontal list of shortcuts to frequently used S3 paths.

Each item in the list is rendered as an `S3BookmarkItem`.

The list must always remain on a single line.

If the number of items exceeds the available width, horizontal scrolling must be enabled.
The scrollbar must not overlap the bookmark items.

When the list extends beyond the visible area, a subtle gradient should appear on the right edge of the container to indicate that more content is available off-screen.

# Rendering rules

For each entry in props.items, the component renders one `S3BookmarkItem` with:

- `variant="bar"`
- `displayName` from the item
- `s3Uri` from the item
- `link` from `props.getItemLink({ s3Uri: item.s3Uri })`
- `isActive` set to true when `item.s3Uri === props.activeItemS3Uri`

If `item.isReadonly === true, callbacks` must be undefined.

Otherwise `callbacks` must be:

```ts
{
    onDelete: () => props.onDelete({ s3Uri: item.s3Uri }),
    onRename: () => props.onRename({ s3Uri: item.s3Uri })
}
```

# Layout rules

- the list is horizontal,
- the list stays on a single row,
- items must not shrink in a way that breaks their internal layout,
- horizontal scrolling must be available when needed,
- the right gradient indicator is only shown when content overflows.
