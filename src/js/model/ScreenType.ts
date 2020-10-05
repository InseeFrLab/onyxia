
export type ScreenType = "SMALL" | "MEDIUM" | "LARGE";

export namespace ScreenType {

    export function get(width: number): ScreenType {
        return width < getBreakPoint("SMALL")
            ? "SMALL"
            : width < getBreakPoint("MEDIUM")
                ? "MEDIUM"
                : "LARGE";
    }

    export function getBreakPoint(screenType: ScreenType): number {
        switch (screenType) {
            case "SMALL": return 600;
            case "MEDIUM": return 960;
            case "LARGE": return 1280;
        }

    }

}
