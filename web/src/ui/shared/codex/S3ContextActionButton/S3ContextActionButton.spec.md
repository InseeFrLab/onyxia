# S3ContextActionButton Spec

# Intent

`S3ContextActionButton` is a compact icon-only action button used in the S3 navigation header area.

Its primary purpose is to provide a reusable visual and interaction pattern for contextual actions related to the currently explored S3 prefix.

Typical usages include:

- go to parent prefix
- upload files
- create prefix

This component does not define layout or placement by itself. It is intended to be composed externally around `S3UriBar`.

# Props

```ts
import type { ReactNode } from "react";

export type S3ContextActionButtonProps = {
    className?: string;

    /**
     * Icon displayed inside the button.
     */
    icon: ReactNode;

    /**
     * Accessible label / tooltip content.
     */
    label: string;

    /**
     * Called when the user clicks the button.
     */
    onClick: () => void;

    /**
     * Optional disabled state.
     */
    disabled?: boolean;
};
```

# General Structure

The component is a single compact icon button.

It is designed to be placed inline within the S3 header area, typically on the same horizontal row as `S3UriBar`.

It may be positioned:

to the left of `S3UriBar`
to the right of `S3UriBar`

The component does not impose grouping or placement rules.

# Rendering Rules

- Render one icon button
- Render no visible text label inside the button
- Use label for accessibility and tooltip

# Interaction Rules

- Clicking the button triggers props.onClick()
- If disabled === true, the button is not interactive
- The component must be keyboard accessible

# Layout Rules

- Rounded-square button
- Same visual size across all usages
- Must align vertically with S3UriBar
- Does not stretch the header row height

The layout and spacing relative to surrounding components are owned by the parent container.

# Visual Rules

## Shape

- Rounded icon button
- Compact size
- Consistent with storage header controls

## Default state

- Surface: `usecase.surface.surface2`
- Icon color: `usecase.typogaphy.textPrimary`

## Hover state

- Icon color: `usecase.typogaphy.textFocus`

## Active / pressed state

- Icon color: `usecase.typogaphy.textFocus`
- Surface: `usecase.surface.surface3`

## Disabled state

- Reduced opacity
- No hover feedback

# Accessibility

- The button must expose an accessible name using label
- Tooltip may reuse label
- Must be reachable by keyboard
- Must show visible focus state

# Composition Rules

`S3ContextActionButton` is a reusable primitive.

It may be used for:

- parent navigation button on the left of `S3UriBar`
- upload button on the right of `S3UriBar`
- create prefix button on the right of `S3UriBar`

Example composition:

```ts
[S3ContextActionButton: go to parent] [S3UriBar....................] [S3ContextActionButton: upload] [S3ContextActionButton: create prefix]
```

The placement of each action is not part of this component contract.
