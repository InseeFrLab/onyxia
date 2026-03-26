# Intent

`CreateS3ProfileModal` is a modal stepper component used to create a new S3 profile.

It is opened from `S3ProfileSelect` when the user clicks `New S3 Profile`.

It guides the user through 3 successive steps:

1. `Custom S3 configuration`
2. `Advanced configuration`
3. `Account credentials`

Its goals are to:

- collect the information required to define a new S3 profile,
- split the creation flow into simple progressive steps,
- allow forward and backward navigation,
- preserve the entered values while the modal remains open,
- submit the final profile creation at the last step.

## Props

```ts
type CreateS3ProfileModalProps = {
    className?: string;
    open: boolean;
    onClose: () => void;
    onSubmit: (params: {
        profileName: string;
        serviceUrl: string;
        region: string | undefined;
        urlStyle: "path" | "virtualHosted";
        anonymousAccess: boolean;
        accessKeyId: string | undefined;
        secretAccessKey: string | undefined;
        sessionToken: string | undefined;
    }) => void;
    defaultValue?: {
        profileName?: string;
        serviceUrl?: string;
        region?: string;
        urlStyle?: "path" | "virtualHosted";
        anonymousAccess?: boolean;
        accessKeyId?: string;
        secretAccessKey?: string;
        sessionToken?: string;
    };
    isSubmitting?: boolean;
};
```

# General Structure

The component is a modal dialog containing:

- a step indicator,
- a title for the current step,
- the content of the current step,
- navigation actions displayed at the bottom.

The modal displays one step at a time.

The component uses a 3-step linear stepper.

The stepper header contains:

- the current step index in the form `Étape X sur 3`,
- the current step title,
- a horizontal visual progress indicator with 3 segments.

Progress indicator rules:

- step 1 active: first segment highlighted, others inactive,
- step 2 active: first and second segments highlighted, third inactive,
- step 3 active: all segments highlighted.

## Step 1 — Custom S3 configuration

This step contains:

- a text field for the profile name,
- a text field for the S3 service URL,
- a text field for the AWS S3 region.

Footer actions:

- left: `Cancel` using a secondary button,
- right: `Next` using a primary button.

## Step 2 — Advanced configuration

This step contains:

- a custom radio group for URL style selection:
    - `Path style`
    - `Virtual-hosted style`

Each option displays:

- a radio indicator,
- a title,
- an example text.

Footer actions:

- left: `Previous` using a secondary button,
- right: `Next` using a primary button.

## Step 3 — Account credentials

This step contains:

- a toggle for anonymous access,
- a text field for Access Key ID,
- a text field for Secret Access Key,
- a text field for Session Token.

Footer actions:

- left: `Previous` using a secondary button,
- right: `Create New S3 Profile` using a primary button.

## Modal state behavior

The component keeps a local draft state while the modal is open.

When navigating between steps:

- all entered values must be preserved,
- going back to a previous step must not reset previously entered values.

When the modal is closed:

- the local draft state may be reset,
- when reopened, the component is initialized from `defaultValue` if provided.

# Interactions

## Modal behavior

- The modal opens when `open === true`.
- The modal closes when `onClose()` is called.
- Pressing `Escape` closes the modal.

The exact validation logic is handled by the app core and is outside the responsibility of this component.

## Navigation behavior

### Next

Clicking `Next `moves to the next step.

### Previous

Clicking `Previous` moves to the previous step.

### Cancel

Clicking `Cancel` closes the modal and does not submit the form.

Final submit

Clicking `Create New S3 Profile` calls `props.onSubmit(...)` with the current draft values.

## Anonymous access behavior

The Anonymous access switch controls whether the user intends to provide credentials.

Recommended behavior:

- when anonymous access is enabled, credential fields remain non-required from the component point of view
- when anonymous access is disabled, credential fields remain editable,
- entered credential values should be kept in memory while the modal is open, even if the toggle changes during the flow.

# Content rules

## Step 1 — Custom S3 configuration

### Profile Name

Label: `Profil Name`

This field is used to define the user-facing name of the S3 profile.

It is displayed as a single-line text field.

### URL of the S3 service

Label: `URL`

This field is used to define the service endpoint URL.

It is displayed as a single-line text field.

### AWS S3 Region

Label: `AWS S3 Region`

This field is used to define the region associated with the S3 service.

It is displayed as a single-line text field.

Helper text example:

`Example: eu-west-1, if not sure, leave empty`

## Step 2 — Advanced configuration

### URL style

Label: `URL style`

Helper text:

Specify how your S3 server formats the URL for downloading files.

This field is displayed as a custom radio group with exactly 2 options.

### Path style

Label: `Path style`

Displays an example text below the label.

### Virtual-hosted style

Label: `Virtual-hosted style`

Displays an example text below the label.

## Step 3 — Account credentials

### Anonymous access

This field is displayed as a toggle.

### Access Key ID

Label: `Access Key ID`

Displayed as a single-line text field.

Helper text example:

`Example: 1A2B3C4D5E6F7G8H9I0J`

### Secret Access Key

Label: `Secret Access Key`

Displayed as a single-line text field.

### Session Token

Label: `Session Token`

Displayed as a single-line text field.

Helper text:

`Optional`

# Style

## Color surfaces specs

- default modal surface: `theme.colors.useCases.surfaces.surface1`
- inactive progress segment surface: `theme.colors.useCases.surfaces.surface2`
- active progress segment surface: `theme.colors.palette.actionActive`
- custom radio default surface: `theme.colors.useCases.surfaces.background`
- custom radio selected surface: `theme.colors.useCases.surfaces.surface1`
- custom radio hover surface: `theme.colors.useCases.surfaces.surfaceFocus1`
- custom radio selected border color: `theme.colors.palette.actionActive`

## Typography spec

step counter (Étape X sur 3): `theme.typography.variants["body 1"]`

step title: `theme.typography.variants["section heading"]`

radio label: `theme.typography.variants["body 2"]`

radio option label: `theme.typography.variants["caption"]`

## Custom radio button spec

The URL style selection is displayed using 2 custom radio cards.

Each radio card contains:

- a radio indicator on the left,
- the option label,
- the example text below the label.

State rules:

- default: neutral surface,
- hover: hover surface,
- selected: highlighted border and selected radio indicator,

only one option can be selected at a time.

The custom radio card uses a rounded rectangle shape.
