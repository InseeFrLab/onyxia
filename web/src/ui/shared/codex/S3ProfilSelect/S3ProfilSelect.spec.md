#Intent

S3ProfileSelect is a Drop Dow nList Component used to:

- display the currently selected S3 profile,
- optionally edit the selected profile,
- open a dropdown menu listing all available S3 profiles,
- switch the active profile,
- create a new profile.

# Props

```ts
type S3ProfileSelectProps = {
    className?: string;
    /** Assert at least one profile */
    availableProfileNames: string[];
    /**
     * Optional list of readonly profiles to display the indicator in the dropdown.
     */
    readonlyProfileNames?: string[];
    selectedProfile: {
        /** Assert match one of the  availableProfiles */
        name: string;
        url: string;
        isReadonly: boolean;
    };

    onSelectedProfileChange: (params: { profileName: string }) => void;

    /** Assert profile name match an entry with readonly false */
    onEditProfile: () => void;

    onCreateNewProfile: () => void;
};
```

# General Structure

The component is made of 2 visible blocks:

### Top trigger row

- displays the selected profile name,
- displays a chevron icon indicating the dropdown state,
- displays an edit button on the right,
- clicking the trigger opens / closes the dropdown,
- clicking the edit button does not open the dropdown.

### Dropdown panel

- displayed below the trigger when open,
- contains:
    - the selected profile URL at the top,
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

### Edit button behavior

The edit button:

- is always visible,
- is disabled when the selected profile is readonly,
- calls `props.onEditProfile()` when clicked,
- must not toggle the dropdown.

### Profile item behavior

Clicking a profile item:

- closes the dropdown,
- calls `props.onSelectedProfileChange({ profileName }).`

If the clicked profile is already selected:

- it may still close the dropdown,
- it should not call `onSelectedProfileChange` again unless you explicitly want this behavior.

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

### URL header

At the top of the dropdown, display the url of the selected profile.

Style:

- secondary / less emphasized typography than the profile names
- single line,
- ellipsis when too long.
- add an icon "swapvert" on the right of this row.

### Dropdown list items

Each profile item displays:

- the profile name,
- an optional readonly indicator,
- a selected indicator when active.

### Selected item

The currently selected profile item must be visually highlighted.

It also displays a check icon on the right.

### Readonly indicator

Readonly profiles display a dedicated icon next to the check area, as shown : `AdminPanelSettings`

This icon is only informative.
It is not clickable.

Recommended tooltip: "Read-only profile"

### Non-readonly items

No readonly icon is shown.

### Create new profile row

Last row of the dropdown:

- leading plus icon,
- label: New S3 Profile,
- full row clickable.

This row behaves like a menu action, not like a list item selection.

## Style

### Color surfaces specs :

- default color surface : `theme.colors.useCases.surfaces.surface1`
- hover color surface : `theme.colors.useCases.surfaces.surface2`
- Active color surface : `theme.colors.palette.focus.mainAlpha10`
- color background for edit button and "read only" icon background : `theme.colors.useCases.surfaces.surface3`

### Typography spec :

- S3 Profile Name : `theme.typography.variants["label 1"]`
- Create new profile label : `theme.typography.variants["label 1"]`
- Current S3 Profile URL : `theme.typography.variants["caption"]`

The radius of the component is `12px`
When the dop down is open also use drop-shadow: `theme.shadows[3]`
