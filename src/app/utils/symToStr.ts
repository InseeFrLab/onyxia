

/** symbolAsString({ foo }) === "foo" */
export function symToStr(wrap: Record<string, unknown>): string {
    return Object.keys(wrap)[0];
}