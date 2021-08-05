export function toAlphaNumerical(value: string) {
    return value.replace(/[^a-zA-Z0-9]/g, "x");
}

export function generateUsername(params: { firstName: string; lastName: string }) {
    const { firstName, lastName } = params;

    return toAlphaNumerical(`${firstName[0] ?? ""}${lastName}`).toLowerCase();
}
