


export function capitalize<S extends string>(str: S): Capitalize<S> {
    return str.charAt(0).toUpperCase() + str.slice(1) as any;
}