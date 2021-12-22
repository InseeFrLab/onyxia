export function smartTrim(params: {
    text: string;
    maxLength: number;
    minCharAtTheEnd: number;
}): string {
    const { text, maxLength, minCharAtTheEnd } = params;

    if (!text || maxLength < 1 || text.length <= maxLength) {
        return text;
    }

    if (maxLength === 1) {
        return text.substring(0, 1) + "...";
    }

    const left = text.substr(0, text.length - minCharAtTheEnd);

    const right = text.substr(-minCharAtTheEnd);

    const maxLeft = maxLength - minCharAtTheEnd - 3;

    const croppedLeft = left.substr(0, maxLeft);

    return croppedLeft + "..." + right;
}
