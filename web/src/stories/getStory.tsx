/* eslint-disable react-hooks/exhaustive-deps */
import type { Meta, Story } from "@storybook/react";
import type { ArgType } from "@storybook/addons";
import { useEffect, useMemo } from "react";
import { symToStr } from "tsafe/symToStr";
import { useDarkMode, breakpointsValues } from "onyxia-ui";
import { useWindowInnerSize } from "powerhooks/useWindowInnerSize";
import { OnyxiaUi } from "ui/theme";
import { useStyles } from "tss";
import { Text } from "onyxia-ui/Text";
import { id } from "tsafe/id";
import "onyxia-ui/assets/fonts/WorkSans/font.css";
import { GlobalStyles } from "tss-react";
import { createCoreProvider } from "core";
import { RouteProvider } from "ui/routes";
import { useLang, fallbackLanguage, languages } from "ui/i18n";
import type { Language } from "ui/i18n";
import type { ReactNode } from "react";
import { Evt } from "evt";
import { createMockRouteFactory } from "ui/routes";

const evtTriggerReRender = Evt.create(0);

//NOTE: Storybook bug hotfix.
const propsByTitle = new Map<string, any>();

const { CoreProvider } = createCoreProvider({
    "apiUrl": "",
    "getCurrentLang": () => "en",
    "transformUrlBeforeRedirectToLogin": url => url,
    "disablePersonalInfosInjectionInGroup": false,
    "isCommandBarEnabledByDefault": true
});

export const { createMockRoute } = createMockRouteFactory({
    "triggerReRender": () => {
        evtTriggerReRender.state++;
    }
});

export function getStoryFactory<Props>(params: {
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
        doNeedCore,
        defaultContainerWidth
    } = params;

    const Component: React.ComponentType<Props> = Object.entries(wrappedComponent).map(
        ([, component]) => component
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

    const StoreProviderOrFragment: React.ComponentType<{ children: ReactNode }> =
        !doNeedCore
            ? ({ children }) => <>{children}</>
            : ({ children }) => <CoreProvider>{children}</CoreProvider>;

    const title = `${sectionName}/${symToStr(wrappedComponent)}`;

    const Template: Story<
        Props & {
            darkMode: boolean;
            containerWidth: number;
            lang: Language;
        }
    > = templateProps => {
        //NOTE: We fix a bug of Storybook that override all props when we reload.
        //If storybook worked as expected we would just deconstruct from templateProps
        const { darkMode, containerWidth, lang, ...props } = Object.assign(
            propsByTitle.get(title)!,
            templateProps
        ) as typeof templateProps;

        const { setIsDarkModeEnabled } = useDarkMode();

        useEffect(() => {
            setIsDarkModeEnabled(darkMode);
        }, [darkMode]);

        const { setLang } = useLang();

        useEffect(() => {
            setLang(lang);
        }, [lang]);

        const { theme } = useStyles();

        return (
            <>
                {
                    <GlobalStyles
                        styles={{
                            "html": {
                                "fontSize": "100% !important"
                            },
                            "body": {
                                "padding": `0 !important`,
                                "backgroundColor": `${theme.colors.useCases.surfaces.surface1} !important`
                            }
                        }}
                    />
                }
                <OnyxiaUi>
                    <ScreenSize />
                    <div
                        style={{
                            "marginLeft": 50,
                            "width": containerWidth || undefined,
                            "border": "1px dotted grey",
                            "display": "inline-block"
                        }}
                    >
                        <StoreProviderOrFragment>
                            <RouteProvider>
                                <Component {...(props as any)} />
                            </RouteProvider>
                        </StoreProviderOrFragment>
                    </div>
                </OnyxiaUi>
            </>
        );
    };

    function getStory(props: Props): typeof Template {
        const out = Template.bind({});

        out.args = {
            "darkMode": false,
            "containerWidth": defaultContainerWidth ?? 0,
            "targetWindowInnerWidth": 0,
            "chromeFontSize": "Medium (Recommended)",
            "lang": fallbackLanguage,
            ...props
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
