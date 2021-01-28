
export function getIsOsPreferredColorSchemeDark() {
    return (
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
    );
}
