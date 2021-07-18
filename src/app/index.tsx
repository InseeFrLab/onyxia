import { StrictMode } from "react";
import * as reactDom from "react-dom";
import { I18nProvider } from "./i18n/I18nProvider";
import { RouteProvider } from "./routes/router";
import { createStoreProvider } from "app/interfaceWithLib/StoreProvider";
import { ThemeProvider, getThemeProviderProps } from "./theme";
import { App } from "app/components/App";
import { KcApp, kcContext } from "app/components/KcApp";
import { PortraitModeUnsupported } from "app/components/pages/PortraitModeUnsupported";

const { StoreProvider } = createStoreProvider({ "doMock": false });

reactDom.render(
    <StrictMode>
        <I18nProvider>
            <RouteProvider>
                <ThemeProvider
                    {...getThemeProviderProps({ PortraitModeUnsupported })}
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
        </I18nProvider>
    </StrictMode>,
    document.getElementById("root"),
);
