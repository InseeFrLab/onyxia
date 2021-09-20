import * as reactDom from "react-dom";
import { I18nProvider } from "./i18n/I18nProvider";
import { RouteProvider } from "./routes/router";
import { createStoreProvider } from "app/interfaceWithLib/StoreProvider";
import { ThemeProvider, getThemeProviderProps } from "./theme";
import { App } from "app/components/App";
import { KcApp, kcContext } from "app/components/KcApp";
import { PortraitModeUnsupported } from "app/components/pages/PortraitModeUnsupported";
import { validateEnvs } from "validateEnv";

validateEnvs();

const { StoreProvider } = createStoreProvider({ "isStorybook": false });

reactDom.render(
    <I18nProvider>
        <RouteProvider>
            <ThemeProvider
                {...getThemeProviderProps({
                    PortraitModeUnsupported,
                    "doDisableViewPortAdapter": kcContext !== undefined,
                })}
            >
                {kcContext !== undefined ? (
                    <KcApp kcContext={kcContext} />
                ) : (
                    <StoreProvider>
                        <App />
                    </StoreProvider>
                )}
            </ThemeProvider>
        </RouteProvider>
    </I18nProvider>,
    document.getElementById("root"),
);
