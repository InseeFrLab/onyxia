
import { useState } from "react";
import { Evt } from "evt";
import { useEvt } from "evt/hooks";
import { useConstCallback } from "app/tools/hooks/useConstCallback";

const key = "isDarkModeEnabled_dXddOm";

export function getIsOsPreferredColorSchemeDark() {
    return (
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
    );
}

const evtIsDarkModeEnabled = Evt.create(
    (() => {

        const value = localStorage.getItem(key);

        return value === null ? null : value === "true";

    })() ??
    getIsOsPreferredColorSchemeDark()
);

evtIsDarkModeEnabled.attach(
    isDarkModeEnabled => localStorage.setItem(
        key, isDarkModeEnabled ? "true" : "false"
    )
);



/** Synchronized with local storage */
export function useIsDarkModeEnabled(): {
    isDarkModeEnabled: boolean;
    setIsDarkModeEnabled(value: boolean): void;
} {

    const [isDarkModeEnabled, setIsDarkModeEnabled] =
        useState(evtIsDarkModeEnabled.state);

    useEvt(ctx =>
        evtIsDarkModeEnabled
            .toStateless(ctx) //We use .toStateless() to avoid calling setIsDarkModeEnabled on first render 
            .attach(setIsDarkModeEnabled),
        []
    );

    return {
        isDarkModeEnabled,
        "setIsDarkModeEnabled": useConstCallback(
            value => evtIsDarkModeEnabled.state = value
        )
    };

}