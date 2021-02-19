//TODO: See if used somewhere but remove in favor of app/hooks/useScreenType

export type ScreenType = "SMALL" | "MEDIUM" | "LARGE";

export function getScreenTypeFromWidth(screenWidth: number) {
    return screenWidth < getScreenTypeBreakpoint("SMALL")
        ? "SMALL"
        : screenWidth < getScreenTypeBreakpoint("MEDIUM")
            ? "MEDIUM"
            : "LARGE";
}

export function getScreenTypeBreakpoint(screenType: ScreenType): number {
    switch (screenType) {
        case "SMALL": return 600;
        case "MEDIUM": return 960;
        case "LARGE": return 1280;
    }
}