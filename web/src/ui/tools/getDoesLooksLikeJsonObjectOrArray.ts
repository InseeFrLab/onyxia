export function getDoesLooksLikeJsonObjectOrArray(str: string): boolean {
    return /^\s*[{[].*[}\]]\s*$/.test(str.replace(/\r?\n/g, " "));
}
