
import { useMemo } from "react";
import { useTheme } from "@material-ui/core/styles";
import { themeToOnyxiaTheme } from "../OnyxiaTheme";

export function useOnyxiaTheme() {

    const theme = useTheme();

    const onyxiaTheme = useMemo(
        () => themeToOnyxiaTheme(theme),
        [theme]
    );

    return onyxiaTheme;

}