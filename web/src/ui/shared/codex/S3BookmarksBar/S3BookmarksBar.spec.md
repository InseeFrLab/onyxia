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

This component acts as the list wrapper for `S3BookmarksItem`.

Its primary purpose is to display a horizontal list of shortcuts to frequently used S3 paths.

The list must always remain on a single line.

If the number of items exceeds the available width, horizontal scrolling must be enabled.  
The scrollbar must not overlap the bookmark items.

When the list extends beyond the visible area, a subtle gradient should appear on the right edge of the container to indicate that more content is available off-screen.
