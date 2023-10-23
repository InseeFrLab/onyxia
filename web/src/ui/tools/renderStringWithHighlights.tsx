import { id } from "tsafe/id";

export type StringWithHighlights = {
    charArray: string[];
    highlightedIndexes: number[];
};

export function renderStringWithHighlights(params: {
    stringWithHighlights: StringWithHighlights;
    doCapitalize: boolean;
    highlightedCharClassName: string;
}): JSX.Element {
    const {
        stringWithHighlights: { charArray, highlightedIndexes },
        doCapitalize,
        highlightedCharClassName
    } = params;

    return (
        <>
            {charArray
                .map(
                    !doCapitalize
                        ? id
                        : (char, i) => (i === 0 ? char.toUpperCase() : char)
                )
                .map((char, i) =>
                    highlightedIndexes.includes(i) ? (
                        <span key={i} className={highlightedCharClassName}>
                            {char}
                        </span>
                    ) : (
                        char
                    )
                )}
        </>
    );
}
