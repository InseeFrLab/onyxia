# S3DirectoryMenu

## Purpose

A popup for the actions available on the current S3 directory. It follows the
Figma directory-menu layout while reusing the application's icons, typography,
surface colors, and shadows in both light and dark themes.

## Contract

- `className?: string` styles the menu paper and takes precedence over internal styles.
- `id: string` identifies the menu list.
- `labelledBy: string` identifies the breadcrumb button that labels the menu.
- `anchorEl: HTMLElement | null` positions the popup below the current breadcrumb;
  `null` closes it. The popup is portalled so the bar cannot clip it.
- `onClose: () => void` requests dismissal. The parent controls the anchor.
- `actionGroups: S3DirectoryMenuAction[][]` supplies translated actions in display
  order. Each action has a stable, unique `id`, `label`, existing `Icon`-compatible
  `icon`, and `onClick: (() => void) | undefined`.

## Rendering and interaction

- Empty groups are omitted. A divider separates consecutive nonempty groups;
  there are no leading, trailing, or doubled dividers.
- An undefined callback displays a disabled item. Omitted actions do not appear.
- Activating an enabled item requests closure, then calls its callback exactly once.
- Opening or dismissing the menu never invokes an action.
- Escape, Tab, and outside clicks dismiss the popup. Keyboard arrows and typeahead
  navigate enabled items; Enter/Space activate them. Focus returns to the anchor
  when dismissed, using MUI's menu behavior.
- Rows have a leading 16px icon, a text label, rounded hover/focus styling, and a
  minimum height of 32px. The 300px-wide paper has 8px padding, a 12px radius, and
  fits within the viewport; long translated labels wrap.

## Ownership and integration

The component owns no S3 operations, clipboard writes, policy decisions, routing,
or dialogs. `S3UriBar` supplies only actions already implemented by its parent:
copy path, bookmark, access policy, create folder, upload, request files, and share.
Unavailable share/request/policy actions are absent; read-only
bookmarks and disabled upload/create actions remain disabled.

The Figma-only download, delete, copy/move/paste-prefix actions and an Organize
submenu are outside this change. Create folder is shown directly because it is
the only currently implemented organization action for the directory.

The existing toolbar buttons remain available. `S3UriBar` owns the trigger and
closes this menu when its URI, editing mode, or copy-feedback display changes.

## Stories

- `Default`: existing directory actions and no unimplemented actions.
- `PublicAndBookmarked`: current policy and bookmark labels/icons.
- `RestrictedActions`: disabled actions, omitted groups, and dividers.
- `KeyboardNavigation`: opening, disabled-item skipping, Escape, and focus restoration.
- `SelectAction`: one callback invocation and closure.
