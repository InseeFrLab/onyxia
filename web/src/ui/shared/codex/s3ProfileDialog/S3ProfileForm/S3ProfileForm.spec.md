# S3ProfileForm

`S3ProfileForm` is a controlled, presentational component for creating or editing a custom S3 profile.

## Responsibilities

- Render editable fields for:
    - profile name,
    - endpoint URL,
    - optional default region,
    - URL style,
    - account credentials.
- Group `isAnonymous`, `accessKeyId`, `secretAccessKey`, and `sessionToken` under `Account Credentials`.
- Hide `accessKeyId`, `secretAccessKey`, and `sessionToken` when anonymous access is enabled.
- Forward every field update through its corresponding `onChange` callback.
- Render known validation error IDs as localized user-facing messages.
- Disable the submit button when `onSubmit` is undefined.
- Keep the cancel and submit actions visible regardless of the root element height by scrolling only the form body.

## Non-Responsibilities

- It does not validate field values.
- It does not fetch, create, update, or persist S3 profiles.
- It does not decide whether the form is submittable; the parent represents that by providing or omitting `onSubmit`.
- It does not own form state beyond native input interaction.

## Props Contract

All form values are controlled by the parent. Optional string values are displayed as empty strings and empty input changes are reported back as `undefined`.

`onSubmit` can be undefined when the form is invalid. In that state, the submit button must be disabled and no submit callback is invoked.

`isEditionOfAnExistingConfig` controls the submit label:

- `true`: `Save Configuration`
- `false`: `Create Profile`
