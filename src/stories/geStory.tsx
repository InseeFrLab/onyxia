

import { useEffect } from "react";
import type { Meta } from "@storybook/react";
import { symToStr } from "app/tools/symToStr";
import type { Story } from "@storybook/react";
import { ThemeProvider, useTheme } from "app/theme";
import { useIsDarkModeEnabled } from "onyxia-ui";
import Box from "@material-ui/core/Box";
import Paper from "@material-ui/core/Paper";
import { id } from "tsafe/id";
import { I18nProvider } from "app/i18n/I18nProvider";
import type { SupportedLanguage } from "app/i18n/resources";
import { RouteProvider } from "app/routes/router";
import { useLng } from "app/i18n/useLng";
import "./fonts.scss";
import { createStoreProvider } from "app/interfaceWithLib/StoreProvider";

const { StoreProvider } = createStoreProvider({ "doMock": true });

export function getStoryFactory<Props>(params: {
    sectionName: string;
    wrappedComponent: Record<string, (props: Props) => ReturnType<React.FC>>;
    doProvideMockStore?: boolean;
}) {

    const {
        sectionName,
        wrappedComponent,
        doProvideMockStore = false
    } = params;

    const Component: any = Object.entries(wrappedComponent).map(([, component]) => component)[0];

    const StoreProviderOrFragment: React.FC = !doProvideMockStore ?
        ({ children }) => <>{children}</> :
        ({ children }) =>
            <StoreProvider>
                {children}
            </StoreProvider>;

    const Template: Story<Props & { darkMode: boolean; lng: SupportedLanguage; width: number; }> =
        ({ darkMode, width, lng, ...props }) => {

            const { setIsDarkModeEnabled } = useIsDarkModeEnabled();

            useEffect(
                () => { setIsDarkModeEnabled(darkMode); },
                // eslint-disable-next-line react-hooks/exhaustive-deps
                [darkMode]
            );

            const { setLng } = useLng();

            useEffect(
                ()=> { setLng(lng); },
                // eslint-disable-next-line react-hooks/exhaustive-deps
                [lng]
            );

            const theme = useTheme();

            return (
                <I18nProvider>
                    <RouteProvider>
                        <ThemeProvider zoomProviderReferenceWidth={undefined}>
                            <StoreProviderOrFragment>
                                <Box p={4} style={{ "backgroundColor": "white" }}>
                                    <Box clone p={4} m={2} display="inline-block">
                                        <Paper
                                            style={{
                                                "backgroundColor": theme.colors.useCases.surfaces.background,
                                                "width": width !== 0 ? width : undefined,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    "border": `1px dotted ${theme.colors.useCases.typography.textDisabled}`
                                                }}
                                            >
                                                <Component {...props} />
                                            </div>
                                        </Paper>
                                    </Box>
                                </Box>
                            </StoreProviderOrFragment>
                        </ThemeProvider>
                    </RouteProvider>
                </I18nProvider>
            );
        }


    function getStory(props: Props): typeof Template {

        const out = Template.bind({});

        out.args = {
            "darkMode": false,
            "lng": id<SupportedLanguage>("fr"),
            "width": 0,
            ...props
        };

        return out;

    }

    return {
        "meta": id<Meta>({
            "title": `${sectionName}/${symToStr(wrappedComponent)}`,
            "component": Component,
            // https://storybook.js.org/docs/react/essentials/controls
            "argTypes": {
                "lng": {
                    "control": {
                        "type": "inline-radio",
                        "options": id<SupportedLanguage[]>(["fr", "en"]),
                    }
                },
                "width": {
                    "control": {
                        "type": "range",
                        "min": 0,
                        "max": 1920,
                        "step": 1,
                    },
                }
            }
        }),
        getStory
    };

}

export function logCallbacks<T extends string>(propertyNames: readonly T[]): Record<T, () => void> {

    const out: Record<T, () => void> = {} as any;

    propertyNames.forEach(propertyName => out[propertyName] = console.log.bind(console, propertyName));

    return out;

}

