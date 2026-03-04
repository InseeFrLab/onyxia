# S3BookmarksBar Specification

## Purpose

`S3BookmarksBar` displays a horizontal list of shortcuts to frequently used S3 paths.

Bookmarks can originate from:

- The user
- The administrator

The component is controlled:

- It owns no business state.
- It does not manage persistence.
- It renders only what is provided via props.

It is always displayed:
`S3UriBar
↓
S3BookmarksBar
↓
Object list`

---

# 1. Bookmark Types

## 1.1 User Bookmarks

- Created by the current user.
- Can be removed (unpinned) by the user.
- Displayed with an interactive pin icon.
- Uses the interactive surfaces defined in the design system.

## 1.2 Admin Bookmarks

- Created by an administrator.
- Visible to users of the corresponding S3 profile.
- Cannot be removed by standard users.
- Does not expose interactive actions.
- Uses a secondary background surface similar to non-interactive cards.

---

# 2. Bookmark Definition

A bookmark represents:
`profileId + fullPath`

Where:

- `profileId` = active S3 profile
- `fullPath` = complete S3 path (bucket + prefix)

## Uniqueness Rules

- A path cannot be duplicated within the same bookmark type.
- If an admin bookmark exists for a path:
    - The user cannot create a personal bookmark for that same path.

Uniqueness enforcement belongs to the business layer.

---

# 3. Ordering Rules (Priority)

Bookmarks follow these ordering rules:

1. Most recently added bookmarks appear first.
2. When recency is equivalent:
    - User bookmarks take visual priority over admin bookmarks.

This ordering applies to:

- `S3BookmarksBar`
- Bookmark entry point lists (defined in a separate specification)

Within the horizontal bar:

- Higher priority items appear further to the left.

---

# 4. Visual Differentiation

User bookmarks and admin bookmarks must be visually distinct.

## 4.1 User Bookmark (Interactive)

Structure:
`[PinIcon] Label`

### Behavior

- Pin icon is visible.
- Clicking the pin icon triggers unpin.
- Hover produces slight elevation.
- Active state (current path) uses a subtle accent background.
- Uses the action surface variations defined in Storybook and UI tokens.

### Surface

- Interactive background surface.
- Hover and active states are visible.

---

## 4.2 Admin Bookmark (Non-interactive)

Structure:
`Label`

(No interactive pin icon.)

### Behavior

- No elevation on hover.
- No unpin interaction.
- Click action only performs navigation.

### Surface

- Simple secondary background (similar to application cards).
- No action color variations.
- No hover surface changes.

The goal is to clearly communicate that the bookmark is defined by the organisation and cannot be removed.

---

# 5. Component Architecture

## BookmarkChip

Supports two visual modes:

```ts
type BookmarkKind = "user" | "admin";
```
