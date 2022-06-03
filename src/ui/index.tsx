import * as reactDom from "react-dom";
import { RouteProvider } from "./routes";
import { CoreProvider } from "ui/coreApi/CoreProvider";
import { ThemeProvider, splashScreen, createGetViewPortConfig } from "./theme";
import { App } from "ui/components/App";
import { KcApp, kcContext } from "ui/components/KcApp";
import { PortraitModeUnsupported } from "ui/components/pages/PortraitModeUnsupported";
import "./envCarriedOverToKc";

const { getViewPortConfig } = createGetViewPortConfig({ PortraitModeUnsupported });

reactDom.render(
    <RouteProvider>
        <ThemeProvider
            getViewPortConfig={kcContext !== undefined ? undefined : getViewPortConfig}
            splashScreen={splashScreen}
        >
            {kcContext !== undefined ? (
                <KcApp kcContext={kcContext} />
            ) : (
                <CoreProvider>
                    <App />
                </CoreProvider>
            )}
        </ThemeProvider>
    </RouteProvider>,
    document.getElementById("root"),
);
