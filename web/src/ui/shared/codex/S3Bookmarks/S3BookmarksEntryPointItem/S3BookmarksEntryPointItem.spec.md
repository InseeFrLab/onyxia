# Intent

`S3BookmarksEntryPointList` is the grid list wrapper for `S3BookmarkItem` with `variant="entryPoint"`.

Its primary purpose is to display pinned S3 locations as entry point cards on the root / home page of an S3 profile.

When this component is displayed, the bookmarks bar is not displayed.

# Props

```ts
import type { S3Uri } from "core/tools/S3Uri";
import type { LocalizedString } from "ui/i18n";
import type { Link } from "type-route";

export type S3BookmarksEntryPointListProps = {
    className?: string;
    items: S3BookmarksEntryPointListProps.Item[];
    activeItemS3Uri: S3Uri | undefined;
    onDelete: (props: { s3Uri: S3Uri }) => void;
    onRename: (props: { s3Uri: S3Uri; currentDisplayName: string | undefined }) => void;
    getItemLink: (props: { s3Uri: S3Uri }) => Link;
};

namespace S3BookmarksEntryPointListProps {
    export type Item = {
        displayName: LocalizedString | undefined;
        s3Uri: S3Uri;
        isReadonly: boolean;
    };
}
```

# General Structure

This component acts as the list wrapper for `S3BookmarkItem` with `variant="entryPoint"`.

Its primary purpose is to display pinned S3 locations as a grid of entry point cards.

Each item in the list is rendered as an `S3BookmarkItem`.

The list is displayed as a grid.

Cards are aligned in rows and columns with consistent horizontal and vertical spacing.

When entry point bookmarks are displayed, this grid becomes the primary navigation surface for pinned S3 locations.

# Rendering rules

For each entry in props.items, the component renders one `S3BookmarkItem` with:

- `variant="entryPoint"`
- `displayName` from the item
- `s3Uri` from the item
- `link` from `props.getItemLink({ s3Uri: item.s3Uri })`
- `isActive` set to true when `item.s3Uri === props.activeItemS3Uri`

If `item.isReadonly === true`, `callbacks` must be `undefined`.

Otherwise `callbacks` must be:

```ts
{
    onDelete: () => props.onDelete({ s3Uri: item.s3Uri }),
    onRename: () =>
        props.onRename({
            s3Uri: item.s3Uri,
            currentDisplayName: resolvedDisplayName
        })
}
```

Where `resolvedDisplayName` is the resolved string value of `item.displayName`, or `undefined` when no display name is set.

# Layout rules

- items are displayed in a multi-column grid layout,
- cards keep stable dimensions,
- cards wrap automatically depending on the available width,
- spacing between cards must be consistent horizontally and vertically.

# Display rules

this component is used on the root / home page of an S3 profile,
when this component is displayed, `S3BookmarksBar` is not displayed.
