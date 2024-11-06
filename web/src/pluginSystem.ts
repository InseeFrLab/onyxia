import type { Css, Cx } from "tss-react";
import type { StatefulReadonlyEvt } from "evt";
import type { Theme } from "onyxia-ui";
import type { Language, getTranslation as ofTypeGetTranslation } from "ui/i18n";
import { symToStr } from "tsafe/symToStr";
import type { session as ofTypeSession, routes as ofTypeRoutes } from "ui/routes";
import type { Param0 } from "tsafe/Param0";
import { id } from "tsafe/id";
import type { Core, Context as CoreContext } from "core/bootstrap";

export type Onyxia = {
    core: Core;
    coreAdapters: CoreContext;
    theme: Theme;
    css: Css;
    cx: Cx;
    lang: Language;
    setLang: (lang: Language) => void;
    getTranslation: typeof ofTypeGetTranslation;
    routes: typeof ofTypeRoutes;
    route: ReturnType<(typeof ofTypeSession)["getInitialRoute"]>;
    addEventListener: (
        callback: (
            eventName:
                | "theme updated"
                | "language changed"
                | "route changed"
                | "route params changed"
        ) => void
    ) => void;
};

const attachToGlobalIfReady = () => {
    if (symToStr({ onyxia }) in window) {
        return;
    }

    if (Object.values(onyxia).some(value => value === undefined)) {
        return;
    }

    Object.assign(window, { onyxia });

    window.dispatchEvent(new CustomEvent("onyxiaready"));
};

const callbacks: Param0<Onyxia["addEventListener"]>[] = [attachToGlobalIfReady];

const onyxia: Onyxia = {
    ...id<Pick<Onyxia, "addEventListener">>({
        addEventListener: callback => {
            callbacks.push(callback);
        }
    })
} as any;

export function pluginSystemInitCore(params: { core: Core; context: CoreContext }) {
    const { core, context } = params;

    onyxia.core = core;
    onyxia.coreAdapters = context;

    attachToGlobalIfReady();
}

export function pluginSystemInitTheme(params: {
    css: Css;
    cx: Cx;
    evtTheme: StatefulReadonlyEvt<Theme>;
}) {
    const { css, cx, evtTheme } = params;

    onyxia.css = css;
    onyxia.cx = cx;

    evtTheme.attach(theme => {
        onyxia.theme = theme;

        callbacks.forEach(callback => callback("theme updated"));
    });
}

export function pluginSystemInitRouter(params: {
    routes: typeof ofTypeRoutes;
    session: typeof ofTypeSession;
}) {
    const { routes, session } = params;

    onyxia.routes = routes;

    onyxia.route = session.getInitialRoute();

    session.listen(nextRoute => {
        const isNameChange = nextRoute.name !== onyxia.route.name;

        onyxia.route = nextRoute;

        callbacks.forEach(callback =>
            callback(isNameChange ? "route changed" : "route params changed")
        );
    });
}

export function pluginSystemInitI18n(props: {
    setLang: (lang: Language) => void;
    evtReadyLang: StatefulReadonlyEvt<Language | undefined>;
    getTranslation: typeof ofTypeGetTranslation;
}) {
    const { setLang, evtReadyLang, getTranslation } = props;

    onyxia.setLang = setLang;
    onyxia.getTranslation = getTranslation;

    evtReadyLang.attach(lang => {
        if (lang === undefined) {
            return;
        }

        onyxia.lang = lang;

        callbacks.forEach(callback => callback("language changed"));
    });
}
