import { describe, expect, it } from "vitest";
import { createUserForge, type UserForge } from "./userForges";

const gitForgesConfig = {
    description: undefined,
    forges: [],
    disallowUserToAddForges: false
};

const userForge_https: UserForge = {
    id: "user:git.example.com",
    type: "gitlab",
    url: "https://git.example.com",
    displayName: "git.example.com"
};

describe(createUserForge.name, () => {
    it("refuses the http url of a forge added with https: same id", () => {
        expect(
            createUserForge({
                type: "gitlab",
                url: "http://git.example.com",
                displayName: "",
                gitForgesConfig,
                userForges: [userForge_https]
            })
        ).toStrictEqual({ isSuccess: false, error: "already configured" });
    });

    it("accepts another url", () => {
        expect(
            createUserForge({
                type: "gitlab",
                url: "https://gitlab.com",
                displayName: "",
                gitForgesConfig,
                userForges: [userForge_https]
            })
        ).toStrictEqual({
            isSuccess: true,
            userForge: {
                id: "user:gitlab.com",
                type: "gitlab",
                url: "https://gitlab.com",
                displayName: "gitlab.com"
            }
        });
    });
});
