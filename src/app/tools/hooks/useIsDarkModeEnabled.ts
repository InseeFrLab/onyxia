import { createUseGlobalState } from "powerhooks";

export const { useIsDarkModeEnabled } = createUseGlobalState(
    "isDarkModeEnabled",
    () => (
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
    )
);
