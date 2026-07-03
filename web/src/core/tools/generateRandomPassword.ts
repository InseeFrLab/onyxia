export function generateRandomPassword() {
    const array = new Uint8Array(20);
    crypto.getRandomValues(array);
    return Array.from(array, byte => (byte % 36).toString(36)).join("");
}