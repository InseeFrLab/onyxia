import type { Css, Cx } from "tss-react";
import type { StatefulReadonlyEvt } from "evt";
import type { Theme } from "onyxia-ui";
import type { Language, getTranslation as ofTypeGetTranslation } from "ui/i18n";
import { symToStr } from "tsafe/symToStr";

type Core = {
    note: "TODO";
};

type Onyxia = {
    core: Core;
    theme: Theme;
    css: Css;
    cx: Cx;
    lang: Language;
    setLang: (lang: Language) => void;
    getTranslation: typeof ofTypeGetTranslation;
    addEventListener: (
        callback: (eventName: "theme updated" | "language changed") => void
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

const callbacks: ((eventName: "theme updated" | "language changed") => void)[] = [
    attachToGlobalIfReady
];

const onyxia: Onyxia = {
    "core": undefined as any,
    "theme": undefined as any,
    "css": undefined as any,
    "cx": undefined as any,
    "lang": undefined as any,
    "setLang": undefined as any,
    "getTranslation": undefined as any,
    "addEventListener": callback => {
        callbacks.push(callback);
    }
};

export function pluginSystemInitCore(params: { core: Core }) {
    const { core } = params;

    onyxia.core = core;

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
