import { assert } from "evt/tools/typeSafety/assert";
import decodeJwt from "jwt-decode";
import { id } from "evt/tools/typeSafety/id";

/** 
 * window.localStorage or, if the browser does not implement it, 
 * a mock ( non persistent across reloads ) 
 */
const localStorage = (() => {

	if (typeof window.localStorage === "undefined") {
		return undefined;
	}

	const key = "__a_random_key_SiSd9"
	const value = "yes";

	try {

		window.localStorage.setItem(key, value);

		if (window.localStorage.getItem(key) !== value) {
			return undefined;
		}

		window.localStorage.removeItem(key);

		return window.localStorage;

	} catch {

		return undefined;

	}

})() ?? (() => {

	const map = new Map<string, string>();

	return id<Pick<typeof window.localStorage, "getItem" | "removeItem" | "setItem">>({
		"getItem": key => map.get(key) ?? null,
		"removeItem": key => map.delete(key),
		"setItem": (key, value) => map.set(key, value)
	});


})();

const key = "onyxia/localStorage/user/token";

export type ParsedOidcAccessToken = {
	gitlab_group: string[] | null;
	preferred_username: string;
	name: string;
	email: string;
};

export const locallyStoredOidcAccessToken = {
	"get": () => ({ "oidcAccessToken": localStorage.getItem(key) ?? undefined }),
	"set": (token: string) => localStorage.setItem(key, token),
	"clear": () => localStorage.removeItem(key),
	/** Assert getToken() !== undefined (meaning user is authenticated) */
	"getParsed": () => {

		const { oidcAccessToken } = locallyStoredOidcAccessToken.get();

		assert(oidcAccessToken !== undefined, "Wrong assertion, user should be logged here");

		//TODO: Se what the decoded object actually is. 
		return decodeJwt<ParsedOidcAccessToken>(oidcAccessToken);

	}
};

