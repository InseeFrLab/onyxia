//This is just a helper to generate the regexp that defines email allowed to register
//the actual regexp is configured in keycloak.
//https://user-images.githubusercontent.com/6702424/158169264-e3832e38-741f-49d8-9afd-6f855f7ccb4b.png

const start = "^[^@]+@([^.]+\\\\.)*(";
const end = ")$";

export function emailDomainsToRegExpStr(emailDomains: string[]): string {
    return [
        emailDomains
            .map(t => t.replace(/\n/, ""))
            .map(t => t.replace(/\./g, "\\\\."))
            .map(t => `(${t})`)
            .join("|"),
    ].map(regExpStr => `${start}${regExpStr}${end}`)[0];
}

export function regExpStrToEmailDomains(regExpStr: string): string[] {
    return [regExpStr]
        .map(regExpStr => regExpStr.replace(/\\/g, "\\\\"))
        .map(regExpStr => {
            const [, ...rest] = regExpStr.split(start);

            return rest.join("");
        })
        .map(regExpStr => {
            const [, ...rest] = regExpStr.split(end).reverse();

            return rest.reverse().join("");
        })
        .map(regExpStr =>
            regExpStr
                .split("|")
                .map(part => part.replace(/^\(/, ""))
                .map(part => part.replace(/\)$/, ""))
                .map(part => part.replace(/\\\\/g, "")),
        )[0];
}
