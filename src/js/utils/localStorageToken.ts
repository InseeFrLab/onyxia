import { assert } from "evt/tools/typeSafety/assert";
import decode from "jwt-decode";
import { safeLocalStorage } from "./safeLocalStorage";

const KEY = "onyxia/localStorage/user/token";

export const get = () =>
	safeLocalStorage.getItem(KEY) ?? undefined;

export const set = (token: string) => 
	safeLocalStorage.setItem(KEY, token);

export const clear = ()=> 
	safeLocalStorage.removeItem(KEY);

/** Assert getToken() !== undefined (meaning user is authenticated) */
export const getDecoded = () => { 

	const token = get();

	assert(token !== undefined, "Wrong assertion, user should be logged here");

	//TODO: Se what the decoded object actually is. 
	return decode<{ gitlab_group: string[] | null; }>(token);

}

