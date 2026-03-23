#Intent

`S3ProfileSelect` is an inline profile selection component used to:

- display the currently selected S3 profile,
- open a dropdown menu listing all available S3 profiles,
- switch the active profile,
- expose a separate settings action for the selected profile,
- optionally create a new profile.

# Props

```ts
type S3ProfileSelectProps = {
    className?: string;
    /** Assert at least one profile */
    availableProfileNames: string[];
    selectedProfile: {
        /** Assert match one of the  availableProfiles */
        name: string;
        url: string;
        isReadonly: boolean;
    };

    onSelectedProfileChange: (params: { profileName: string }) => void;

    /** Opens the settings/details view for the currently selected profile */
    onEditProfile: () => void;

    onCreateNewProfile: () => void;
};
```

# General Structure

The component is made of 3 visible blocks:

### A Label

A static text label: `S3 Profile :`

- outside of the trigger
- not clickable
- aligned vertically with the trigger and settings button

### Top trigger row

- displays the selected profile name,
- displays a chevron icon indicating the dropdown state,
- displays a parameters button on the right,
- clicking the trigger opens / closes the dropdown,
- clicking the parameters button does not open the dropdown.
- hover uses `surface3` and adds a drop-shadow (`theme.shadows[4]`, same as S3UriBar) when hovering the trigger area.

### Dropdown panel

- displayed below the trigger when open,
- positioned as an overlay above subsequent content,
- does not push surrounding content or change the component height,
- contains:
    - the list of available profiles,
    - a final action row to create a new profile.

## Interactions

### Trigger behavior

Clicking on the main trigger area toggles the dropdown.
The trigger area must be keyboard accessible.

Expected keyboard behavior:

- `Enter` / `Space`: open or close dropdown,
- `ArrowDown`: open dropdown and focus first selectable profile
- `Escape`: close dropdown,
- `Tab`: move focus normally.

### Parameters button behavior

The parameters button:

- is always visible,
- is always enabled (readonly does not disable it),
- calls `props.onEditProfile()` when clicked (opens a modal to view S3 profile details and edit some fields),
- must not toggle the dropdown.

### Profile item behavior

Clicking a profile item:

- closes the dropdown,
- calls `props.onSelectedProfileChange({ profileName }).`

If the clicked profile is already selected:

- it may still close the dropdown,
- it should not call `onSelectedProfileChange` again unless you explicitly want this behavior.

The static label `S3 Profile :` is not interactive.
Only the selection trigger toggles the dropdown.

### Create new profile behavior

Clicking `New S3 Profile`:

- closes the dropdown,
- calls `props.onCreateNewProfile().`@

### Outside click behavior

Clicking outside the component closes the dropdown.

## Content rules

### Selected profile label

The trigger displays the selected profile name.

Style:

- prominent text,
- single line,
- ellipsis when too long.

### URL header (cancelled)

Do not display the selected profile URL in the dropdown.
The swap icon is also removed.

### Dropdown list items

Each profile item displays:

- the profile name,
- a selected indicator when active.

### Selected item

The currently selected profile item must be visually highlighted.

It also displays a check icon on the right.

### Readonly indicator (cancelled)

Do not display any readonly icon.
There is no visual difference between custom profiles and others.

### Create new profile row

Last row of the dropdown:

- leading plus icon,
- label: New S3 Profile,
- full row clickable.

This row behaves like a menu action, not like a list item selection.

## Style

### Color surfaces specs :

- default color surface : `theme.colors.useCases.surfaces.surface2`
- Top trigger row active color surface (when the dropdown panel is open) : `theme.colors.useCases.surfaces.surface1`
- default item color surface : `theme.colors.useCases.surfaces.surface1`
- hover color surface : `theme.colors.useCases.surfaces.surface1`
- hover item color surface : `theme.colors.useCases.surfaces.surface2`
- Active color surface : `theme.colors.palette.focus.mainAlpha10`
- hover on Active color surface : `theme.colors.palette.focus.mainAlpha20`
- color background for edit button : `theme.colors.useCases.surfaces.surface2`
- hover background for parameters button : `theme.colors.useCases.surfaces.surface3`

The static label has no background surface.

### Typography spec :

- S3 Profile Name : `theme.typography.variants["label 1"]`
- Create new profile label : `theme.typography.variants["label 1"]`

The radius of the component is `12px`
When the dop down is open also use drop-shadow: `theme.shadows[3]`
