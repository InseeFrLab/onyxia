import bytes from "bytes";

export function toBytes(str: string) {
    const validBytesInput = (() => {
        const s = str.trim().toLowerCase();

        if (s === "0") {
            return "0b";
        }

        if (s.endsWith("b")) {
            //return s.slice(0, -1) + ;
            return s;
        }

        if (s.endsWith("ki") || s.endsWith("k")) {
            return s.slice(0, -2) + "kb";
        }

        if (s.endsWith("mi") || s.endsWith("m")) {
            return s.slice(0, -2) + "mb";
        }

        if (s.endsWith("gi") || s.endsWith("g")) {
            return s.slice(0, -2) + "gb";
        }

        if (s.endsWith("ti") || s.endsWith("t")) {
            return s.slice(0, -2) + "tb";
        }

        if (s.endsWith("pi") || s.endsWith("p")) {
            return s.slice(0, -2) + "pb";
        }

        return undefined;
    })();

    if (validBytesInput === undefined) {
        throw new Error(`${str} is not a valid bytes input`);
    }

    return bytes(validBytesInput);
}
