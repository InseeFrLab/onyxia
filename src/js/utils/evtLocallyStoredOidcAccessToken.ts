import decodeJwt from "jwt-decode";
import { id } from "evt/tools/typeSafety/id";
import { Evt } from "evt";

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


export type ParsedOidcAccessToken = {
	gitlab_group: string[] | null;
	preferred_username: string;
	name: string;
	email: string;
};

const key = "onyxia/localStorage/user/token";

export const evtLocallyStoredOidcAccessToken = Evt.create(localStorage.getItem(key) ?? undefined);

evtLocallyStoredOidcAccessToken.evtChange.attach(oidcAccessToken => {


	if (oidcAccessToken === undefined) {

		localStorage.removeItem(key)

	} else {

		localStorage.setItem(key, oidcAccessToken);

	}

});

export function parseOidcAccessToken(oidcAccessToken: string) {
	return decodeJwt<ParsedOidcAccessToken>(oidcAccessToken);
}


