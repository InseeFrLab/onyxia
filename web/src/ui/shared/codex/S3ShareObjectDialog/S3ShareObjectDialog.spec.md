# Intent

`S3ShareObjectDialog` is the share box displayed inside a modal after the user chooses Share on an S3 object.

Despite its name, this component does not render or control a modal dialog. It renders only the modal body content.

Its purpose is to:

- identify the shared object
- display the generated HTTP URL in a compact form
- let the user copy that URL
- explain whether the URL is public through a public prefix or signed
- let the user change signed URL validity

# Props

```ts
export type S3ShareObjectDialogProps =
    | S3ShareObjectDialogProps.Public
    | S3ShareObjectDialogProps.Private;

export namespace S3ShareObjectDialogProps {
    export type ValidityDuration = "one hour" | "one day" | "one week";

    type Common = {
        className?: string;
        objectBasename: string;
        httpUrl: string | undefined;
        onDone: () => void;
    };

    export type Public = Common & {
        isPublic: true;
    };

    export type Private = Common & {
        isPublic: false;
        validityDuration: ValidityDuration;
        changeValidityDuration: (params: { validityDuration: ValidityDuration }) => void;
    };
}
```

# General Structure

The component renders a regular box composed of:

1. Header with object name
2. Policy explanation block
3. Signed URL validity selector when the link is not public
4. HTTP URL display and copy action
5. Done action

The parent owns modal chrome, title, close button, and lifecycle. The component exposes a single mandatory `onDone` callback through its Done button.

# Rendering Rules

## Object Name

`objectBasename` is rendered as the file name.

Long names must truncate visually without breaking the layout.

## HTTP URL

`httpUrl` is the generated HTTP access URL.

When defined:

- Render it as a clickable HTTP link.
- Display it collapsed/truncated because signed URLs can be very long.
- Preserve the full URL for the href and copy action.

When undefined:

- Render a pending state such as generating signed/public URL.
- Disable the copy button.

## Copy

The copy action copies the full `httpUrl`.

After a successful copy, the component must show clear feedback:

- button state changes to copied
- status text announces copied to clipboard

If copy fails, the component should display a failure status.

## Done

The component renders one Done button.

Clicking it must invoke `onDone`.

# Policy States

## Public

When `isPublic === true`:

- Explain that anyone with the URL can access the object.
- Explain that the URL never expires because the object is inside a prefix that has been marked public.
- Do not render the validity duration selector.
- Do not render a public/private policy toggle.

## Private

When `isPublic === false`:

- Explain that `httpUrl` is a signed URL.
- Include the selected `validityDuration` in the explanation.
- Explain that users who need a URL that does not expire should make one of the object's parent prefixes (folders) public.
- Render a select bound to `validityDuration`.
- Calling the select must invoke `changeValidityDuration({ validityDuration })`.
- Do not render a public/private policy toggle.

# Accessibility

- The copy button has an accessible name.
- Copy feedback is exposed through a polite live region.
- The validity select has a visible label.
- Focus states must be visible on interactive elements.

# Layout Rules

- The component fills the available modal body width.
- The URL row must not overflow narrow layouts.
- Long object names and long URLs must truncate.
- The component does not impose modal sizing.
