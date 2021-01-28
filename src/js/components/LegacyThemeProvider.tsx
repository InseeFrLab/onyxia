
import type React from "react";

import { MuiThemeProvider } from '@material-ui/core/styles';
import createTheme from './material-ui-theme';

const theme = createTheme();


export type Props = {
    children: React.ReactNode;
};


export function LegacyThemeProvider(props: Props) {

    const { children } = props;

    return (
        <MuiThemeProvider theme={theme}>
            {children}
        </MuiThemeProvider>
    );

}
