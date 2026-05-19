# S3ProfileDetails

`S3ProfileDetails` is a controlled, presentational component for inspecting one S3 profile and copying the values needed to use it outside the S3 explorer.

## Responsibilities

- Display the currently selected S3 profile name in a selector.
- Let the user switch to another available profile through `onSelectedProfileChange`.
- Let the user start profile creation through `onCreateNewProfile`.
- Expose the edit action when available, and render it disabled when the selected profile is read-only.
- Display connection fields for the endpoint URL and the default region when a default region exists.
- Display access credentials when provided:
    - access key ID,
    - secret access key,
    - optional session token,
    - optional expiration and renewal action.
- Keep sensitive credential values visually elided in the middle while copying the full value.
- Provide copy-to-clipboard buttons with explicit tooltips and copied feedback.
- Display a generated setup snippet for the selected technology.
- Let the user switch snippet technology through `onTechnologyChange`.
- Render snippets with `CodeTextEditor` using the language that matches the selected technology.

## Non-Responsibilities

- It does not fetch profiles, credentials, or snippets.
- It does not own the selected profile or selected technology state.
- It does not create, edit, renew, or persist profiles itself.
- It does not decide which snippets are available; that comes from the controller.

## Props Contract

The parent must provide at least one profile name and keep `profileName` synchronized with `availableProfileNames`. `technology` must be one of `availableTechnologies`, and `codeSnippet` must correspond to the selected profile and technology.

Credential copy buttons always copy the raw credential value even though the rendered text is shortened.
