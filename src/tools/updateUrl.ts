
export function updateUrl(
    params: {
        text: string;
        getUrl: (tagName: string) => string;
        tagName: string;
    }
): string {

    const { text, getUrl, tagName } = params;

    const uniqueId = "xKMdKx9dMxK*{#++";

    const [p1, p2] = getUrl(uniqueId).split(uniqueId);

    return text.replace(
        new RegExp(
            `(${p1.replace("/", "\\/")})[^\\/]+(${p2.replace("/", "\\/")})`, "g"),
        (...[, p1, p2]) => `${p1}${tagName}${p2}`
    );

}