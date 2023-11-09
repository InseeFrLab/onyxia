export function parseCssSpacing(value: string): `${string}${"px" | "em" | "rem" | "%"}` {
    if (!/^-?[0-9]+(?:\.[0.9]+)?(?:(?:px)|(?:em)|(?:rem)|%)?$/.test(value)) {
        throw new Error(
            `CSS Spacing Malformed. Example of valid value: 10 or -10 or 10px or 1.5em or -1.5rem or 10%. Got: ${value}`
        );
    }

    if (/[0-9]$/.test(value)) {
        return `${value}px`;
    }

    return value as any;
}
