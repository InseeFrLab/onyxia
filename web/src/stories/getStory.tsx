/* eslint-disable react-hooks/exhaustive-deps */
import type { Meta, Story } from "@storybook/react";
import type { ArgType } from "@storybook/addons";
import { useEffect, useMemo } from "react";
import { symToStr } from "tsafe/symToStr";
import { breakpointsValues } from "onyxia-ui";
import { useWindowInnerSize } from "powerhooks/useWindowInnerSize";
import { OnyxiaUi, css, cx } from "ui/theme";
import { useStyles } from "tss";
import { Text } from "onyxia-ui/Text";
import { id } from "tsafe/id";
import "onyxia-ui/assets/fonts/WorkSans/font.css";
import { GlobalStyles } from "tss-react";
//import { createCoreProvider } from "core";
import { useLang, fallbackLanguage, languages, I18nFetchingSuspense } from "ui/i18n";
import type { Language } from "ui/i18n";
//import type { ReactNode } from "react";
import { Evt } from "evt";
import { useRerenderOnStateChange } from "evt/hooks";
import { createMockRouteFactory } from "ui/routes";
import { useSplashScreen } from "onyxia-ui";

export { css, cx };

const evtTriggerReRender = Evt.create(0);

//NOTE: Storybook bug hotfix.
const propsByTitle = new Map<string, any>();

//TODO: We can't use components that requires the core in storybook yet
// because there are missing required mock for initializing the core.
/*
const { CoreProvider } = createCoreProvider({
    "apiUrl": "",
    "getCurrentLang": () => "en",
    "transformUrlBeforeRedirectToLogin": url => url,
    "disablePersonalInfosInjectionInGroup": false,
    "isCommandBarEnabledByDefault": true
});
*/

export const { createMockRoute } = createMockRouteFactory({
    "triggerReRender": () => {
        evtTriggerReRender.state++;
    }
});

export function getStoryFactory<Props extends Record<string, unknown>>(params: {
    sectionName: string;
    wrappedComponent: Record<string, (props: Props) => ReturnType<React.FC>>;
    doNeedCore?: boolean;
    /** https://storybook.js.org/docs/react/essentials/controls */
    argTypes?: Partial<Record<keyof Props, ArgType>>;
    defaultContainerWidth?: number;
}) {
    const {
        sectionName,
        wrappedComponent,
        argTypes = {},
        //doNeedCore,
        defaultContainerWidth
    } = params;

    const Component: React.ComponentType<Props> = Object.entries(wrappedComponent).map(
        ([, Component]) => Component
    )[0];

    function ScreenSize() {
        const { windowInnerWidth } = useWindowInnerSize();

        const range = useMemo(() => {
            if (windowInnerWidth >= breakpointsValues["xl"]) {
                return "xl-∞";
            }

            if (windowInnerWidth >= breakpointsValues["lg"]) {
                return "lg-xl";
            }

            if (windowInnerWidth >= breakpointsValues["md"]) {
                return "md-lg";
            }

            if (windowInnerWidth >= breakpointsValues["sm"]) {
                return "sm-md";
            }

            return "0-sm";
        }, [windowInnerWidth]);

        return (
            <Text typo="body 1">
                {windowInnerWidth}px width: {range}
            </Text>
        );
    }

    /*
    const StoreProviderOrFragment: React.ComponentType<{ children: ReactNode }> =
        !doNeedCore
            ? ({ children }) => <>{children}</>
            : ({ children }) => <CoreProvider>{children}</CoreProvider>;
    */

    const title = `${sectionName}/${symToStr(wrappedComponent)}`;

    const Template: Story<{
        darkMode: boolean;
        containerWidth: number;
        lang: Language;
        componentProps: Props;
    }> = props => {
        //NOTE: We fix a bug of Storybook that override all props when we reload.
        //If storybook worked as expected we would just deconstruct from templateProps
        const { darkMode, containerWidth, lang, componentProps } = Object.assign(
            propsByTitle.get(title)!,
            props
        ) as typeof props;

        return (
            <I18nFetchingSuspense>
                <OnyxiaUi darkMode={darkMode}>
                    {/*<StoreProviderOrFragment>*/}
                    <ContextualizedTemplate
                        containerWidth={containerWidth}
                        lang={lang}
                        componentProps={componentProps}
                    />
                    {/*</StoreProviderOrFragment>*/}
                </OnyxiaUi>
            </I18nFetchingSuspense>
        );
    };

    const ContextualizedTemplate = (props: {
        containerWidth: number;
        lang: Language;
        componentProps: Props;
    }) => {
        const { containerWidth, lang, componentProps } = props;

        useRerenderOnStateChange(evtTriggerReRender);

        const { setLang } = useLang();

        useEffect(() => {
            setLang(lang);
        }, [lang]);

        const { theme } = useStyles();

        {
            const { hideRootSplashScreen } = useSplashScreen();

            useEffect(() => {
                hideRootSplashScreen();
            }, []);
        }

        return (
            <>
                <GlobalStyles
                    styles={{
                        "html": {
                            "fontSize": "100% !important",
                            "backgroundColor": `${theme.colors.useCases.surfaces.surface1} !important`
                        },
                        ".MuiScopedCssBaseline-root": {
                            "padding": theme.spacing(4)
                        }
                    }}
                />
                <ScreenSize />
                <div
                    style={{
                        "width": containerWidth || undefined,
                        "border": `1px dashed ${theme.colors.useCases.typography.textTertiary}`,
                        "display": "inline-block"
                    }}
                >
                    <Component {...componentProps} />
                </div>
            </>
        );
    };

    function getStory(props: Props): typeof Template {
        const out = Template.bind({});

        out.args = {
            "darkMode": false,
            "containerWidth": defaultContainerWidth ?? 0,
            "lang": fallbackLanguage,
            "componentProps": props
        };

        propsByTitle.set(title, out.args);

        return out;
    }

    return {
        "meta": id<Meta>({
            title,
            "component": Component,
            "argTypes": {
                "containerWidth": {
                    "control": {
                        "type": "range",
                        "min": 0,
                        "max": 1920,
                        "step": 1
                    }
                },
                "lang": {
                    "options": languages,
                    "control": {
                        "type": "inline-radio"
                    }
                },
                ...argTypes
            }
        }),
        getStory
    };
}

export function logCallbacks<T extends string>(
    propertyNames: readonly T[]
): Record<T, () => void> {
    const out: Record<T, () => void> = id<Record<string, never>>({});

    propertyNames.forEach(
        propertyName => (out[propertyName] = console.log.bind(console, propertyName))
    );

    return out;
}
