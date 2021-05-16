

import type { Meta } from "@storybook/react";
import { symToStr } from "app/tools/symToStr";
import type { Story } from "@storybook/react";
import { themeProviderFactory } from "app/theme/ThemeProvider";
import Box from "@material-ui/core/Box";
import Paper from "@material-ui/core/Paper";
import { id } from "tsafe/id";
import { I18nProvider } from "app/i18n/I18nProvider";
import type { SupportedLanguage } from "app/i18n/resources";
import { StoreProvider } from "app/interfaceWithLib/StoreProvider";
import type { OidcClientConfig, SecretsManagerClientConfig, OnyxiaApiClientConfig } from "lib/setup";
import type { Props as StoreProviderProps } from "app/interfaceWithLib/StoreProvider";
import { useTheme } from "@material-ui/core/styles";
import { RouteProvider } from "app/router";
import type { Public_Configuration } from "lib/ports/OnyxiaApiClient";
import "./fonts.scss";

const { ThemeProvider } = themeProviderFactory(
    { "isReactStrictModeEnabled": false }
);

const getStoreInitializationParams: StoreProviderProps["getStoreInitializationParams"] = () => ({
    "oidcClientConfig": id<OidcClientConfig.Phony>({
        "implementation": "PHONY",
        "tokenValidityDurationMs": Infinity,
        "parsedJwt": {
            "email": "john.doe@insee.fr",
            "preferred_username": "jdoe",
            "family_name": "Doe",
            "given_name": "John",
            "groups": ["sspcloud-admin", "dsi-ddc"],
            "locale": "en"
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
        regions,
        build
    })
});

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
                            "border": `1px dotted ${theme.custom.colors.useCases.typography.textDisabled}`
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
            <StoreProvider getStoreInitializationParams={getStoreInitializationParams}>
                {children}
            </StoreProvider>;



    const Template: Story<Props & { darkMode: boolean; lng: SupportedLanguage; }> =
        ({ darkMode, lng, ...props }) =>
            <I18nProvider lng={lng}>
                <RouteProvider>
                    <ThemeProvider isDarkModeEnabled={darkMode} zoomProviderReferenceWidth={undefined}>
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


const regions: Public_Configuration["regions"] =
    [
        {
            "id": 'datalab',
            "name": 'DG Insee',
            "description": 'Region principale. Plateforme hébergée sur les serveurs de la direction générale de l\'INSEE',
            "location": {
                "lat": 48.8164,
                "name": 'Montrouge (France)',
                "long": 2.3174
            },
            "services": {
                "type": 'MARATHON',
                "defaultIpProtection": true,
                "network": 'calico',
                "namespacePrefix": 'users',
                "marathonDnsSuffix": 'marathon.containerip.dcos.thisdcos.directory',
                "expose": {
                    "domain": 'lab.sspcloud.fr'
                },
                "monitoring": {
                    "URLPattern": 'https://grafana.lab.sspcloud.fr/d/mZUaipcmk/app-generique?orgId=1&refresh=5s&var-id=$appIdSlug'
                },
                "cloudshell": {
                    "catalogId": 'internal',
                    "packageName": 'shelly'
                },
                "initScript": 'https://git.lab.sspcloud.fr/innovation/plateforme-onyxia/services-ressources/-/raw/master/onyxia-init.sh'
            },
            "data": {
                "S3": {
                    "monitoring": {
                        "URLPattern": 'https://grafana.lab.sspcloud.fr/d/PhCwEJkMz/minio-user?orgId=1&var-username=$bucketId'
                    },
                    "URL": 'https://minio.lab.sspcloud.fr'
                }
            }
        },
        {
            "id": 'gke',
            "name": 'Google cloud',
            "description": 'Region de test. Aucune garantie de service. A n\'utiliser que pour des tests.',
            "location": {
                "lat": 50.8503,
                "name": 'St. Ghislain (Belgium)',
                "long": 4.3517
            },
            "services": {
                "type": 'KUBERNETES',
                "defaultIpProtection": false,
                "namespacePrefix": 'user-',
                "expose": {
                    "domain": 'demo.dev.sspcloud.fr'
                },
                "cloudshell": {
                    "catalogId": 'inseefrlab-helm-charts-datascience',
                    "packageName": 'cloudshell'
                }
            },
            "data": {
                "S3": {
                    "URL": 'https://minio.demo.dev.sspcloud.fr'
                }
            }
        }
    ];

const build: Public_Configuration["build"] = {
    "version": "0.7.3",
    "timestamp": Date.now()
};
