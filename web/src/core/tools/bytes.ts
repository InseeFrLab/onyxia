import bytes from "bytes";

export function toBytes(str: string) {
    const validBytesInput = (() => {
        const s = str.trim();

        if (s === "0") {
            return "0b";
        }

        if (/^\d+$/.test(s)) {
            return s + "b";
        }

        if (s.endsWith("B")) {
            return s.toLowerCase();
        }

        if (s.endsWith("Ki") || s.endsWith("K")) {
            return s.slice(0, -2) + "kb";
        }

        if (s.endsWith("Mi") || s.endsWith("M")) {
            return s.slice(0, -2) + "mb";
        }

        if (s.endsWith("Gi") || s.endsWith("G")) {
            return s.slice(0, -2) + "gb";
        }

        if (s.endsWith("Ti") || s.endsWith("T")) {
            return s.slice(0, -2) + "tb";
        }

        if (s.endsWith("Pi") || s.endsWith("P")) {
            return s.slice(0, -2) + "pb";
        }

        return undefined;
    })();

    if (validBytesInput === undefined) {
        throw new Error(`${str} is not a valid bytes input`);
    }

    return bytes(validBytesInput);
}
