import { getCore } from "core";

export async function enforceLogin(): Promise<void | never> {
    const core = await getCore();

    if (!core.states.userAuthentication.getMain().isUserLoggedIn) {
        await core.functions.userAuthentication.login({
            doesCurrentHrefRequiresAuth: true
        });
    }
}
