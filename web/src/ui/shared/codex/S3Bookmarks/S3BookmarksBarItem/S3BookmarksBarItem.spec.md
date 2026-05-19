# Intent

`S3BookmarkItem` is a bookmark navigation component used to represent a pinned S3 location.

It allows users to:

- navigate to a bookmarked S3 location,
- identify the current active bookmark,
- optionally unpin a bookmark (from the tooltip in variant `bar`),
- optionally rename a bookmark.

This component can be rendered using 2 visual variants depending on the navigation context:

- `bar`: displayed as a pill-shaped item inside the bookmarks bar,
- `entryPoint`: displayed as a card inside a grid on the root / home page of an S3 profile.

Both variants share the same logic, props, and interactions.
Only the visual representation and layout differ.

When the `entryPoint` variant is displayed, the bookmarks bar is not shown.

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

    /** Some bookmarks are readonly hens the optionality */
    callbacks:
        | {
              /**
               * A callback function that the component should call
               * when the user click for deleting the bookmark.
               */
              onDelete: () => void;
              onRename: () => void;
          }
        | undefined;

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

This component is an anchor `<a />` (use `<MuiLink />` imported from `@mui/material/Link`).

The props of the anchor are provided as `props.link`.

The text label is either the `displayName` or the serialized `s3Uri` (use the 3 last segments of the path) if too long.

The component supports 2 visual variants:

### Variant `bar`

This variant looks like a button.
There is a left icon of a pin and a text label (icon is decorative).

### Variant `entryPoint`

This variant looks like a card-like block.

Inside the card:

- the bookmark label is displayed in the content area,
- the S3 URI is displayed below the label,
- the pin icon is displayed in the top-right corner (icon is decorative).

# Interactions

The interaction logic is the same for both variants.

When clicking on the main area, the component behaves like a link and uses `props.link`.

The pin icon is decorative and is not clickable.
Unpin is only available from the tooltip actions in variant `bar` when `props.callbacks` is defined.

### Variant `bar`

When `props.callbacks` is defined:

- an edit icon is displayed next to the label on hover
- the serialized S3 URI is displayed in a tooltip on hover

### Variant `entryPoint`

When `props.callbacks` is defined:

- an edit icon is displayed inline next to the label

# Active state

When `props.isActive` is true then:

- the surface color changes,
- the style of text label changes too.

This active state has the same meaning for both variants:
it stresses that this is the currently active bookmark.

# Content rules

### Bookmark label

The main label displayed by the component is:

- `displayName` when provided,
- otherwise the serialized `s3Uri`,
- or a shortened version of the serialized `s3Uri` using the

3 last path segments when too long.

### Variant `entryPoint` additional content

When `variant="entryPoint"`, the serialized S3 URI is also displayed below the main label.

# Style

### Color surfaces specs if the component can be deleted (not read-only)

- default color surface: `theme.colors.useCases.surfaces.surfaceFocus1`
- hover color surface: `theme.colors.useCases.surfaces.surfaceFocus2`
- active color surface: `theme.colors.useCases.surfaces.surfaceFocus1`

### Color surfaces specs if the component can't be deleted (read-only)

- default color surface: `theme.colors.useCases.surfaces.surface1`
- hover color surface: `theme.colors.useCases.surfaces.surface2`
- active color surface: `theme.colors.useCases.surfaces.surface1`

### Active state border

On active state (both variants), add a `2px` border stroke on the right and bottom with:
`theme.colors.useCases.buttons.actionHoverPrimary`

### Typography spec

##### Variant bar

- text label: `theme.typography.variants["label 1"]`

##### Variant entryPoint

- bookmark label: `theme.typography.variants["label 1"]`
- bookmark URI: `theme.typography.variants["body 1"]`

### Shape and spacing

##### Variant `bar`

- full radius (`border-radius: 9999px`)
- top & bottom padding: `8px`
- left & right padding: `16px`
- maximum width: `300px`

##### Variant `entryPoint`

- border radius: `32px`
- internal padding: `32px`
- pin icon positioned in the top-right area
- label and URI positioned in the lower-left content area

# Long text behavior

There are specific behaviors for long labels.

### Variant `bar`

The maximum width of the component is `300px` and after that the text must collapse.

### Variant `entryPoint`

- the label should collapse when too long,
- the URI should also collapse when too long,
- text overflow should not break the card size.
