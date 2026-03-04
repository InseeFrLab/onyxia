# Props

```ts
import type { LocalizedString } from "ui/i18n";
import type { Link } from "type-route";
import type { S3Uri } from "core/tools/S3Uri";

export type S3BookmarksBarItem = {
    className?: string;
    /**
     * Not always provided, a friendly name for the bookmark.
     */
    displayName: LocalizedString | undefined;
    /**
     * This is meant to be displayed serialized when the mouse
     * is over the element with a tooltip modal.
     */
    s3Uri: S3Uri;
    /**
     * This the props for the link component.
     *
     * <MuiLink {...props.ling} />
     *
     * It defines what happen when the component is clicked.
     * The component should be an anchor <a /> (at the html level)
     */
    link: Link;

    /**
     * A callback function that the component should call
     * when the user click for deleting the bookmark.
     *
     * Not all bookmarks are deletable, hence the optionality.
     */
    onDelete: (() => void) | undefined;

    /*
     * This specifies if the bookmark is currently active.
     * (Like when you have a navigation bar in a website and when we are
     * on the page matching a given link it is displayed with a different style
     * to stress that "this is the page you're currently on")
     */
    isActive: boolean;
};
```

# General structure

This component looks like a button.  
There an left icon of a pin and a text label
the text label is either the displayName or the serialized s3Uri (potentially collapsed)
if too long.

The component is an anchor `<a />` (use `<MuiLink />` imported from `@mui/material/Link`).

The props of the anchor as provided as `props.link`.

But. When clicking on the icon, the behavior change.  
First the pin icon is only visible when `props.onDelete` is defined.  
When the cursor is over the pin icon, the icon turns into an "unpin icon".  
When clicked `props.onDelete()` should be called.

When `props.isActive` is `true` then:
