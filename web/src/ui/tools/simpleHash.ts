export function simpleHash(str: string) {
    let hash = 2166136261; // FNV offset basis
    for (let i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i);
        hash *= 16777619; // FNV prime
    }
    // Use bitwise XOR for converting hash to 32-bit integer, then convert to string
    return (hash >>> 0).toString();
}
