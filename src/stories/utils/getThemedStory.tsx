

import type { Meta } from "@storybook/react";
import { symToStr } from "app/utils/symToStr";
import type { Story } from "@storybook/react";
import React from "react";
import { ThemeProviderFactory } from "app/ThemeProvider";
import Box from "@material-ui/core/Box";
import Paper from "@material-ui/core/Paper";
import { id } from "evt/tools/typeSafety/id";

const { AppThemeProvider } = ThemeProviderFactory(
    { "isReactStrictModeEnabled": false }
);

export function getThemedStoryFactory<Props>(params: {
    sectionName: string;
    wrappedComponent: Record<string, (props: Props) => ReturnType<React.FC>>;
}) {

    const { sectionName, wrappedComponent } = params;

    const Component: any = Object.entries(wrappedComponent).map(([, component]) => component)[0];

    const Template: Story<Props & { isDarkModeEnabled: boolean; }> =
        ({ isDarkModeEnabled, ...props }) =>
            <AppThemeProvider isDarkModeEnabled={isDarkModeEnabled}>
                <Box p={4}>
                    <Box clone p={4} m={2} display="inline-block">
                        <Paper>
                            <Component {...props} />
                        </Paper>
                    </Box>
                </Box>
            </AppThemeProvider>;


    function getThemedStory(props: Props): typeof Template {

        const out = Template.bind({});

        out.args = {
            "isDarkModeEnabled": false,
            ...props
        };

        return out;

    }

    return {
        "meta": id<Meta>({
            "title": `${sectionName}/${symToStr(wrappedComponent)}`,
            "component": Component
        }),
        getThemedStory
    };

}



