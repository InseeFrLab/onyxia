

import type { Meta } from "@storybook/react";
import { symToStr } from "app/tools/symToStr";
import type { Story } from "@storybook/react";
import React from "react";
import { themeProviderFactory } from "app/theme/ThemeProvider";
import Box from "@material-ui/core/Box";
import Paper from "@material-ui/core/Paper";
import { id } from "evt/tools/typeSafety/id";
import { I18nProvider } from "app/i18n/I18nProvider";
import type { SupportedLanguage } from "app/i18n/resources";
import { StoreProvider } from "app/lib/StoreProvider";
import type { OidcClientConfig, SecretsManagerClientConfig, OnyxiaApiClientConfig } from "lib/setup";
import type { Props as StoreProviderProps } from "app/lib/StoreProvider";
import { useTheme } from "app/theme/useClassNames";
import { RouteProvider } from "app/router";

const { ThemeProvider } = themeProviderFactory(
    { "isReactStrictModeEnabled": false }
);

const createStoreParams: StoreProviderProps["createStoreParams"] = {
    "isColorSchemeDarkEnabledByDefalut": false,
    "oidcClientConfig": id<OidcClientConfig.Phony>({
        "implementation": "PHONY",
        "tokenValidityDurationMs": Infinity,
        "parsedJwt": {
            "email": "john.doe@insee.fr",
            "preferred_username": "doej"
        }
    }),
    "secretsManagerClientConfig": id<SecretsManagerClientConfig.LocalStorage>({
        "implementation": "LOCAL STORAGE",
        "artificialDelayMs": 0,
        "doReset": false,
        "paramsForTranslator": {
            "baseUri": "https://vault.lab.sspcloud.fr",
            "engine": "onyxia-kv",
            "role": "onyxia-user"
        }
    }),
    "onyxiaApiClientConfig": id<OnyxiaApiClientConfig.Mock>({
        "implementation": "MOCK",
        "ip": "185.24.1.1",
        "nomComplet": "John Doe"
    })
};

function Container(props: { children: React.ReactNode; }) {

    const { children } = props;

    const theme = useTheme();

    return (
        <Box p={4} style={{ "backgroundColor": "white" }}>
            <Box clone p={4} m={2} display="inline-block">
                <Paper
                    style={{
                        "backgroundColor": theme.custom.colors.useCases.surfaces.background
                    }}
                >
                    <div
                        style={{
                            "outline": `1px solid ${theme.custom.colors.palette.whiteSnow.greyVariant2}`
                        }}
                    >
                        {children}
                    </div>
                </Paper>
            </Box>
        </Box>
    );


}

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
            <StoreProvider createStoreParams={createStoreParams}>
                {children}
            </StoreProvider>;



    const Template: Story<Props & { darkMode: boolean; lng: SupportedLanguage; }> =
        ({ darkMode, lng, ...props }) =>
            <I18nProvider lng={lng}>
                <RouteProvider>
                    <ThemeProvider isDarkModeEnabled={darkMode}>
                        <StoreProviderOrFragment>
                            <Container>
                                <Component {...props} />
                            </Container>
                        </StoreProviderOrFragment>
                    </ThemeProvider>
                </RouteProvider>
            </I18nProvider>;


    function getStory(props: Props): typeof Template {

        const out = Template.bind({});

        out.args = {
            "darkMode": false,
            "lng": id<SupportedLanguage>("fr"),
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

