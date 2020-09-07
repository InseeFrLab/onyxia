import { assert } from "evt/tools/typeSafety/assert";
import decode from "jwt-decode";
import { safeLocalStorage } from "./safeLocalStorage";

const KEY = "onyxia/localStorage/user/token";

export const getToken = () =>
	safeLocalStorage.getItem(KEY) ?? undefined;

export const setToken = (token: string) => 
	safeLocalStorage.setItem(KEY, token);

export const clearToken = ()=> 
	safeLocalStorage.removeItem(KEY);

/** Assert getToken() !== undefined (user is authenticated) */
export const getDecodedToken = () => { 

	const token = getToken();

	assert(token !== undefined, "Wrong assertion, user should be logged here");

	//TODO: Se what the decoded object actually is. 
	decode<{ gitlab_group: unknown; }>(token);
}

