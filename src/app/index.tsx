import * as reactDom from "react-dom";
import { I18nProvider } from "./i18n/I18nProvider";
import { RouteProvider } from "./routes/router";
import { LibProvider } from "app/libApi/LibProvider";
import { ThemeProvider, getThemeProviderProps } from "./theme";
import { App } from "app/components/App";
import { KcApp, kcContext } from "app/components/KcApp";
import { PortraitModeUnsupported } from "app/components/pages/PortraitModeUnsupported";
import "./envCarriedOverToKc";

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
                    <LibProvider>
                        <App />
                    </LibProvider>
                )}
            </ThemeProvider>
        </RouteProvider>
    </I18nProvider>,
    document.getElementById("root"),
);
