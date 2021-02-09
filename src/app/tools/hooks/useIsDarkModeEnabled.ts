import { createUseGlobalState } from "app/tools/hooks/useGlobalState";

export const { useIsDarkModeEnabled } = createUseGlobalState(
    "isDarkModeEnabled",
    () => (
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
    )
);

console.log("=>", useIsDarkModeEnabled)
