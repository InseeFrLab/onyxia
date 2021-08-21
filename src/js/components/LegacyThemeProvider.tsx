import type React from "react";

import { ThemeProvider } from "@material-ui/core";
import createTheme from "./material-ui-theme";

const theme = createTheme();

export type Props = {
    children: React.ReactNode;
};

export function LegacyThemeProvider(props: Props) {
    const { children } = props;

    return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
