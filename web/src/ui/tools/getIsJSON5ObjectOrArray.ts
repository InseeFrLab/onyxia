import JSON5 from "json5";

export function getIsJSON5ObjectOrArray(str: string): boolean {
    let parsed: unknown;

    try {
        parsed = JSON5.parse(str);
    } catch {
        return false;
    }

    return typeof parsed === "object" && parsed !== null;
}
