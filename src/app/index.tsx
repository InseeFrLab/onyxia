import { StrictMode } from "react";
import * as reactDom from "react-dom";
import { I18nProvider } from "./i18n/I18nProvider";
import { RouteProvider } from "./routes/router";
import { createStoreProvider } from "app/interfaceWithLib/StoreProvider";
import { ThemeProvider } from "./theme";
import { SplashScreenProvider } from "onyxia-ui";
import { App } from "app/components/App";
import {
    kcContext as realKcContext,
    kcContextMocks
} from "keycloakify";
import { KcApp } from "app/components/KcApp";
import { ReactComponent as OnyxiaLogoSvg } from "app/assets/svg/OnyxiaLogo.svg";
import { PortraitModeUnsupported } from "app/components/pages/PortraitModeUnsupported";

const { StoreProvider } = createStoreProvider({ "doMock": false });

kcContextMocks.kcLoginContext.social.providers = [
    {
        "alias": "Agent connect (alias)",
        "displayName": "Agent Connect",
        "loginUrl": "https://example.com",
        "providerId": "agentConnect"
    }
];

kcContextMocks.kcLoginContext.message = undefined;

const kcContext = realKcContext ?? (
    true /* Set to true to test the login pages outside of Keycloak */
        ? kcContextMocks.kcLoginContext /* Change to .kcRegisterContext for example */
        :
        undefined
);

reactDom.render(
    <StrictMode>
        <I18nProvider>
            <RouteProvider>
                <ThemeProvider
                    zoomProviderReferenceWidth={kcContext !== undefined ? undefined : 1920}
                    portraitModeUnsupportedMessage={<PortraitModeUnsupported />}
                >
                    <SplashScreenProvider Logo={OnyxiaLogoSvg}>
                        {kcContext !== undefined ?
                            <KcApp kcContext={kcContext} /> :
                            <StoreProvider>
                                <App />
                            </StoreProvider>
                        }
                    </SplashScreenProvider>
                </ThemeProvider>
            </RouteProvider>
        </I18nProvider>
    </StrictMode>,
    document.getElementById("root")
);
