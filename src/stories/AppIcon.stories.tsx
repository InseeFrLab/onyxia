
import React from "react";
import type { Story, Meta } from "@storybook/react";
import { id } from "evt/tools/typeSafety/id";

import { AppIcon } from "../app/atoms/AppIcon";
import type { Props as AppIconProps } from "../app/atoms/AppIcon";
import { AppThemeProviderFactory } from "app/appTheme";

export default id<Meta>({
    "title": AppIcon.name,
    "component": AppIcon
});

const Template: Story<AppIconProps> = ({ ...props }) => {

    const { AppThemeProvider } = AppThemeProviderFactory(
        { "isReactStrictModeEnabled": false }
    );

    return (
        <AppThemeProvider isDarkModeEnabled={true}>
            <AppIcon {...props} />
        </AppThemeProvider>
    );

}

export const Home = Template.bind({});

Home.args = { "type": "home" };
