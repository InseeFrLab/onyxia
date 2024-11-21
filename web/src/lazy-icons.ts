import { createGetIconUrl } from "mui-icons-material-lazy";
import { getOnyxiaInstancePublicUrl } from "keycloak-theme/login/onyxiaInstancePublicUrl";
import { env } from "env";

export const { getIconUrl, getIconUrlByName } = createGetIconUrl({
    BASE_URL: (() => {
        // NOTE: We delete the icons in the Keycloak theme not increasing the payload too much
        // so we fetch the icons from the onyxia instance if needed.
        if (window.kcContext !== undefined) {
            return getOnyxiaInstancePublicUrl();
        }

        return env.PUBLIC_URL;
    })()
});

export const customIcons = {
    servicesSvgUrl: `${env.PUBLIC_URL}/icons/services.svg?v=2`,
    secretsSvgUrl: `${env.PUBLIC_URL}/icons/secrets.svg?v=2`,
    accountSvgUrl: `${env.PUBLIC_URL}/icons/account.svg?v=2`,
    homeSvgUrl: `${env.PUBLIC_URL}/icons/home.svg?v=2`,
    filesSvgUrl: `${env.PUBLIC_URL}/icons/files.svg?v=2`,
    catalogSvgUrl: `${env.PUBLIC_URL}/icons/catalog.svg?v=2`
};
