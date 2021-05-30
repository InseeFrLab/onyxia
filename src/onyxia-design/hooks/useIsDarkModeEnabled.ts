import { createUseGlobalState } from "powerhooks";

export function getIsDarkModeEnabledOsDefault(){
    return (
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
    );
}

export const { useIsDarkModeEnabled } = createUseGlobalState(
    "isDarkModeEnabled",
    getIsDarkModeEnabledOsDefault
);
