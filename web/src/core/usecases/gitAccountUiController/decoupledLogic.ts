import { OAuthAuthorizationError } from "core/ports/GitForge";
import type { CardError } from "./state";

/** Why signing in failed, in the terms the card displays */
export function getSignInCardError(params: { error: unknown }): CardError {
    const { error } = params;

    if (!(error instanceof OAuthAuthorizationError)) {
        return { type: "sign in failed" };
    }

    switch (error.reason) {
        case "popup blocked":
            return { type: "popup blocked" };
        case "popup closed":
            return { type: "sign in cancelled" };
        case "timeout":
            return { type: "sign in failed" };
        case "denied":
            return getIsGrantScopeConflict({ forgeError: error.forgeError })
                ? { type: "grant scope conflict" }
                : { type: "sign in denied", forgeError: error.forgeError };
    }
}

/**
 * Forgejo (and Gitea) refuse an authorization request whose scopes differ from the
 * existing grant's, e.g. one given before Onyxia changed the scopes it asks for. The
 * user has to revoke it on the forge first.
 */
function getIsGrantScopeConflict(params: { forgeError: string | undefined }): boolean {
    const { forgeError } = params;

    return forgeError?.includes("a grant exists with different scope") ?? false;
}
