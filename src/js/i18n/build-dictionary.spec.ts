import { createDictionary, getLang } from "./build-dictionary";

["browserLanguage", "language"].forEach(property => {
    test(`should return the french version when the navigator.${property} is FR`, () => {
        const dictionary = {
            welcome: {
                fr: "bonjour"
            }
        };
        expect(createDictionary("fr")(dictionary).welcome).toBe(dictionary.welcome.fr);
    });

    test(`should return the english version when the navigator.${property} is EN`, () => {
        const dictionary = {
            welcome: {
                en: "welcome"
            }
        };
        expect(createDictionary("en")(dictionary).welcome).toBe(dictionary.welcome.en);
    });

    test(`should return the english version the navigator.${property} is not supported`, () => {
        const dictionary = {
            welcome: {
                en: "welcome"
            }
        };
        expect(createDictionary("de")(dictionary).welcome).toBeUndefined();
    });

    test("should handle array values", () => {
        const dictionary = {
            welcome: {
                fr: [1, 2],
                en: [3, 4]
            }
        };
        expect(createDictionary("en")(dictionary).welcome).toBe(dictionary.welcome.en);
    });
    test(`should handle sub object`, () => {
        const dictionary = {
            welcome: {
                string: {
                    fr: "bonjour",
                    en: "welcome"
                }
            }
        };
        expect(createDictionary("en")(dictionary).welcome.string).toBe(
            dictionary.welcome.string.en
        );
        expect(createDictionary("fr")(dictionary).welcome.string).toBe(
            dictionary.welcome.string.fr
        );
    });

    test("should handle function", () => {
        const dictionary = {
            func: {
                fr: (d: any) => `Bonjour ${d}`,
                en: (d: any) => `Welcome ${d}`
            }
        };
        expect(createDictionary("en")(dictionary).func("toto")).toBe("Welcome toto");
    });
});

test(`should return fr when we passe fr as a paremeter`, () => {
    expect(getLang("fr")).toBe("fr");
});

test(`should return fr when we passe fr-FR as a paremeter`, () => {
    expect(getLang("fr-FR")).toBe("fr");
});
