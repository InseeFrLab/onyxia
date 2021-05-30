
import { useTheme } from "@material-ui/core/styles";
import { useWindowInnerSize } from "powerhooks";

export function useBreakpointKey() {

    const theme = useTheme();

    const { windowInnerWidth } = useWindowInnerSize();

    for (const key of ["xl", "lg", "md", "sm"] as const) {

        if (windowInnerWidth >= theme.breakpoints.width(key)) {
            return key;
        }

    }

    return "xs";

}