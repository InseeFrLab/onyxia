import { describe, expect, it } from "vitest";
import { createUserProvider, type UserProvider } from "./userProviders";

const gitProvidersConfig = {
    description: undefined,
    providers: [],
    disallowUserToAddProviders: false
};

const userProvider_https: UserProvider = {
    id: "user:git.example.com",
    type: "gitlab",
    url: "https://git.example.com",
    displayName: "git.example.com"
};

describe(createUserProvider.name, () => {
    it("refuses the http url of a provider added with https: same id", () => {
        expect(
            createUserProvider({
                type: "gitlab",
                url: "http://git.example.com",
                displayName: "",
                gitProvidersConfig,
                userProviders: [userProvider_https]
            })
        ).toStrictEqual({ isSuccess: false, error: "already configured" });
    });

    it("accepts another url", () => {
        expect(
            createUserProvider({
                type: "gitlab",
                url: "https://gitlab.com",
                displayName: "",
                gitProvidersConfig,
                userProviders: [userProvider_https]
            })
        ).toStrictEqual({
            isSuccess: true,
            userProvider: {
                id: "user:gitlab.com",
                type: "gitlab",
                url: "https://gitlab.com",
                displayName: "gitlab.com"
            }
        });
    });
});
