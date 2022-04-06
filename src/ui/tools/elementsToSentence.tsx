export function elementsToSentence(params: {
    elements: ArrayLike<JSX.Element>;
    language: "fr" | "en" | "zh-CN";
}): JSX.Element {
    const { elements, language } = params;

    const separatorWord = (() => {
        switch (language) {
            case "en":
                return "and";
            case "fr":
                return "et";
            case "zh-CN":
                return "和";
        }
    })();

    return (
        <>
            {Array.from(elements).map((element, i) => (
                <span key={i}>
                    {element}
                    {i === elements.length - 1
                        ? ""
                        : i === elements.length - 2
                        ? ` ${separatorWord} `
                        : ", "}
                </span>
            ))}
        </>
    );
}
