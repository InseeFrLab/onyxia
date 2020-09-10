
export type ScreenType = "SMALL" | "MEDIUM" | "LARGE";

export namespace ScreenType {

    export function getWidthPoint(screenType: ScreenType): number {
        switch (screenType) {
            case "SMALL": return 600;
            case "MEDIUM": return 960;
            case "LARGE": return 1280;
        }

    }


    export function get(width: number): ScreenType {
        return width < getWidthPoint("SMALL")
            ? "SMALL"
            : width < getWidthPoint("MEDIUM")
                ? "MEDIUM"
                : "LARGE";
    }

}
