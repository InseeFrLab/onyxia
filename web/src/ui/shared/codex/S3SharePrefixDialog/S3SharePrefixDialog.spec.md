# Intent

`S3SharePrefixDialog` is the share box displayed inside a modal after the user
chooses Share on an S3 prefix.

Despite its name, this component does not render or control a modal dialog. It
renders only the modal body content and has no dependency on the application router
or core. Its caller provides all display-ready values.

Its purpose is to:

- identify the shared folder when its basename is available
- display the complete Onyxia sharing URL
- let the user open or copy that URL
- explain why the folder can be accessed publicly

# Props

```ts
export type S3SharePrefixDialogProps = {
    className?: string;
    prefixBasename?: string;
    onyxiaUrl: string;
};
```

# General Structure

The component renders a regular box composed of:

1. An optional folder summary row
2. The Onyxia URL and copy action
3. A bottom informational note

The parent owns modal chrome, title, close button, URL construction, and lifecycle.

# Rendering Rules

## Folder Summary

When `prefixBasename` is defined, display it with a folder icon and a public badge.

When `prefixBasename` is undefined, omit the summary row without leaving an empty
placeholder.

## Onyxia URL

Display `onyxiaUrl` exactly as provided. Do not parse, shorten, elide, or rearrange
the URL or its query parameters.

The complete URL must:

- remain visible by wrapping onto additional lines when necessary
- never require horizontal scrolling
- be an anchor that opens in a new browser tab
- be used unchanged as the anchor destination

## Copy

The copy action copies the complete `onyxiaUrl`, including its origin, path, query
string, and profile parameter.

After a successful copy, the component shows the standard S3 dialog copied
feedback.

## Information Note

Display a note explaining that anyone with the link can open the folder, including
users without an account, because the folder or one of its descendants has been
made public.

# Accessibility

- The copy button has an accessible name.
- The URL can receive keyboard focus.
- The URL has a visible focus state.
- The external link uses safe new-tab attributes.

# Layout Rules

- The component fills the available modal body width.
- Long folder names must not break the layout.
- Long URLs wrap at any necessary character and remain fully visible.
- The component does not impose modal sizing.
