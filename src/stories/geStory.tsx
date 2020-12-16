

import type { Meta } from "@storybook/react";
import { symToStr } from "app/utils/symToStr";
import type { Story } from "@storybook/react";
import React from "react";
import { ThemeProviderFactory } from "app/ThemeProvider";
import Box from "@material-ui/core/Box";
import Paper from "@material-ui/core/Paper";
import { id } from "evt/tools/typeSafety/id";
import { I18nProvider } from "app/i18n/I18nProvider";
import type { SupportedLanguages } from "app/i18n/resources";

const { AppThemeProvider } = ThemeProviderFactory(
    { "isReactStrictModeEnabled": false }
);

export function getStoryFactory<Props>(params: {
    sectionName: string;
    wrappedComponent: Record<string, (props: Props) => ReturnType<React.FC>>;
}) {

    const { sectionName, wrappedComponent } = params;

    const Component: any = Object.entries(wrappedComponent).map(([, component]) => component)[0];

    const Template: Story<Props & { isDarkModeEnabled: boolean; lang: SupportedLanguages; }> =
        ({ isDarkModeEnabled, ...props }) =>
            <I18nProvider>
                <AppThemeProvider isDarkModeEnabled={isDarkModeEnabled}>
                    <Box p={4}>
                        <Box clone p={4} m={2} display="inline-block">
                            <Paper>
                                <Component {...props} />
                            </Paper>
                        </Box>
                    </Box>
                </AppThemeProvider>;
        </I18nProvider>


    function getStory(props: Props): typeof Template {

        const out = Template.bind({});

        out.args = {
            "isDarkModeEnabled": false,
            "lang": "en",
            ...props
        };

        return out;

    }

    return {
        "meta": id<Meta>({
            "title": `${sectionName}/${symToStr(wrappedComponent)}`,
            "component": Component
        }),
        getStory
    };

}



