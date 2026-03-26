# UI General Spec

## Styling Guidelines (tss-react)

- Each component owns one dedicated `useStyles` created with `tss.create()`.
- Prefer `tss.withParams<...>().create(...)` for conditional styles.
- Avoid style explosion from many atomic variant class combinations.

Recommended pattern:

- `const { classes, cx } = useStyles({ ...params })`
- `className={cx(classes.root, props.className)}`

## className props

Every component should have an option className props.

Allows the parent to position/size the component.

Must take precedence over internal styles:
className={cx(classes.root, props.className)}
