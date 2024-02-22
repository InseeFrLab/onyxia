import { replaceAll } from "./String.prototype.replaceAll";

export function getMatchPositions(params: { text: string; search: string }) {
    const { text, search } = params;

    const escapedSearch = search.trim().replace(/[|\\{}()[\]^$+*?.]/g, "\\$&");
    const regexp = RegExp("(" + replaceAll(escapedSearch, " ", "|") + ")", "ig");
    let result;
    const matchPositions: number[] = [];

    if (text) {
        while ((result = regexp.exec(text)) !== null) {
            for (let i = result.index; i < regexp.lastIndex; i++) {
                matchPositions.push(i);
            }
        }
    }

    return matchPositions;
}
