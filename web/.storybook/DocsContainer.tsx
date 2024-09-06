import { DocsContainer as DocsContainer_base } from "@storybook/blocks";
import React, { ComponentProps } from "react";
import { darkTheme, lightTheme } from "./theme";
import { DARK_MODE_EVENT_NAME } from "storybook-dark-mode";
import { OnyxiaUi } from "../src/ui/theme";
import { addons } from "@storybook/preview-api";

const channel = addons.getChannel();

type Props = ComponentProps<typeof DocsContainer_base>;

export function DocsContainer(props: Props) {
    // const { setIsDark, isDark } = useIsDark();

    // useEffect(() => {
    //     // listen to DARK_MODE event
    //     channel.on(DARK_MODE_EVENT_NAME, setIsDark);
    //     return () => channel.off(DARK_MODE_EVENT_NAME, setIsDark);
    // }, [channel, setIsDark]);

    return (
        <OnyxiaUi>
            <ContextualizedContainer {...props} />
        </OnyxiaUi>
    );
}

function ContextualizedContainer(props: Props) {
    const { children, context } = props;

    return (
        <DocsContainer_base context={context} theme={true ? darkTheme : lightTheme}>
            {children}
        </DocsContainer_base>
    );
}
