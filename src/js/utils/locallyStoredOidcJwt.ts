import { assert } from "evt/tools/typeSafety/assert";
import decode from "jwt-decode";
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

const KEY = "onyxia/localStorage/user/token";

export const locallyStoredOidcJwt = {
	"get": () => localStorage.getItem(KEY) ?? undefined,
	"set": (token: string) => localStorage.setItem(KEY, token),
	"clear": () => localStorage.removeItem(KEY),
	/** Assert getToken() !== undefined (meaning user is authenticated) */
	"getDecoded": () => {

		const token = locallyStoredOidcJwt.get();

		assert(token !== undefined, "Wrong assertion, user should be logged here");

		//TODO: Se what the decoded object actually is. 
		return decode<{ gitlab_group: string[] | null; }>(token);

	}
};

