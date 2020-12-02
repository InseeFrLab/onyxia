
import type { Story } from "@storybook/react";
import React from "react";
import { AppThemeProviderFactory } from "app/appTheme";
import Box from "@material-ui/core/Box";
import Paper from '@material-ui/core/Paper';

export function getThemedStoryFactory<Props>(component: (props: Props) => ReturnType<React.FC>) {

    const Component: any = component;

    const Template: Story<Props & { isDarkModeEnabled: boolean; }> = ({ isDarkModeEnabled, ...props }) => {

        const { AppThemeProvider } = AppThemeProviderFactory(
            { "isReactStrictModeEnabled": false }
        );

        return (
            <AppThemeProvider isDarkModeEnabled={isDarkModeEnabled}>
                <Box p={4}>
                    <Box clone p={4} m={2} display="inline-block">
                        <Paper>
                            <Component {...props} />
                        </Paper>
                    </Box>
                </Box>
            </AppThemeProvider>
        );

    }

    function getThemedStory(props: Props): typeof Template {

        const out = Template.bind({});

        out.args = {
            "isDarkModeEnabled": false,
            ...props
        };

        return out;

    }

    return { getThemedStory };

}