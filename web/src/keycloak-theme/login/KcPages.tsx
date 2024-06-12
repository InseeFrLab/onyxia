import { Suspense, lazy } from "react";
import type { ClassKey } from "keycloakify/login";
import type { KcContext } from "./KcContext";
import { useI18n } from "./i18n";
import { loadThemedFavicon } from "keycloak-theme/login/theme";
import { tss } from "tss";
import onyxiaNeumorphismDarkModeUrl from "ui/assets/svg/OnyxiaNeumorphismDarkMode.svg";
import onyxiaNeumorphismLightModeUrl from "ui/assets/svg/OnyxiaNeumorphismLightMode.svg";
import { OnyxiaUi } from "keycloak-theme/login/theme";
import { useDownloadTerms } from "keycloakify/login";
import { downloadTermsMarkdown } from "ui/shared/downloadTermsMarkdown";

loadThemedFavicon();

const DefaultTemplate = lazy(() => import("keycloakify/login/Template"));
const Template = lazy(() => import("./Template"));
const DefaultPage = lazy(() => import("keycloakify/login/DefaultPage"));
const UserProfileFormFields = lazy(() => import("./UserProfileFormFields"));
const Terms = lazy(() => import("./pages/Terms"));
const Register = lazy(() => import("./pages/Register"));
const Login = lazy(() => import("./pages/Login"));

type Props = {
    kcContext: KcContext;
};

export default function KcApp(props: Props) {
    return (
        <OnyxiaUi>
            <ContextualizedKcApp {...props} />
        </OnyxiaUi>
    );
}

function ContextualizedKcApp(props: Props) {
    const { kcContext } = props;

    const { classes: defaultPageClasses } = useStyles();

    const { i18n } = useI18n({ kcContext });

    useDownloadTerms({
        kcContext,
        "downloadTermsMarkdown": async ({ currentLanguageTag }) => {
            const { termsMarkdown, langOfTheTerms } = await downloadTermsMarkdown({
                currentLanguageTag
            });

            return {
                termsMarkdown,
                termsLanguageTag: langOfTheTerms
            };
        }
    });

    return (
        <Suspense>
            {(() => {
                switch (kcContext.pageId) {
                    case "login.ftl":
                        return (
                            <Login
                                kcContext={kcContext}
                                i18n={i18n}
                                Template={Template}
                                doUseDefaultCss={false}
                            />
                        );
                    case "register.ftl":
                        return (
                            <Register
                                kcContext={kcContext}
                                i18n={i18n}
                                UserProfileFormFields={UserProfileFormFields}
                                doMakeUserConfirmPassword={doMakeUserConfirmPassword}
                                Template={Template}
                                doUseDefaultCss={false}
                            />
                        );
                    case "terms.ftl":
                        return (
                            <Terms
                                kcContext={kcContext}
                                i18n={i18n}
                                Template={Template}
                                doUseDefaultCss={false}
                            />
                        );
                    default:
                        return (
                            <DefaultPage
                                kcContext={kcContext}
                                i18n={i18n}
                                Template={DefaultTemplate}
                                doUseDefaultCss={true}
                                UserProfileFormFields={UserProfileFormFields}
                                doMakeUserConfirmPassword={doMakeUserConfirmPassword}
                                classes={defaultPageClasses}
                            />
                        );
                }
            })()}
        </Suspense>
    );
}

const doMakeUserConfirmPassword = false;

const useStyles = tss
    .withName({ KcApp })
    .withNestedSelectors<"kcHeaderWrapperClass">()
    .create(
        ({ theme, classes }) =>
            ({
                "kcHtmlClass": {
                    "& body": {
                        "background": `url(${
                            theme.isDarkModeEnabled
                                ? onyxiaNeumorphismDarkModeUrl
                                : onyxiaNeumorphismLightModeUrl
                        }) no-repeat center center fixed`,
                        "fontFamily": theme.typography.fontFamily
                    },
                    "background": `${theme.colors.useCases.surfaces.background}`,
                    "& a": {
                        "color": `${theme.colors.useCases.typography.textFocus}`
                    },
                    "& label": {
                        "fontSize": 14,
                        "color": theme.colors.palette.light.greyVariant3,
                        "fontWeight": "normal"
                    },
                    [`& .${classes.kcHeaderWrapperClass}`]: {
                        "visibility": "hidden"
                    },
                    "& #kc-info-message > p:last-child": {
                        "marginTop": theme.spacing(5)
                    }
                },
                "kcBodyClass": {
                    "background": `url(${
                        theme.isDarkModeEnabled
                            ? onyxiaNeumorphismDarkModeUrl
                            : onyxiaNeumorphismLightModeUrl
                    }) no-repeat center center fixed`,
                    "fontFamily": theme.typography.fontFamily
                },
                "kcLocaleWrapperClass": {
                    "visibility": "hidden"
                },
                "kcFormHeaderClass": {
                    "&& h1": {
                        ...theme.typography.variants["page heading"].style,
                        "color": theme.colors.palette.dark.main
                    }
                },
                "kcFormCardClass": {
                    "borderRadius": 10,
                    "borderColor": theme.colors.useCases.typography.textFocus
                },
                "kcButtonPrimaryClass": {
                    "backgroundColor": "unset",
                    "backgroundImage": "unset",
                    "borderColor": `${theme.colors.useCases.typography.textFocus}`,
                    "borderWidth": "2px",
                    "borderRadius": `20px`,
                    "color": `${theme.colors.useCases.typography.textFocus}`,
                    "textTransform": "uppercase"
                },
                "kcInputClass": {
                    "borderRadius": "unset",
                    "border": "unset",
                    "boxShadow": "unset",
                    "borderBottom": `1px solid ${theme.colors.useCases.typography.textTertiary}`,
                    "&:focus": {
                        "borderColor": "unset",
                        "borderBottom": `1px solid ${theme.colors.useCases.typography.textFocus}`
                    }
                },
                "kcHeaderWrapperClass": {}
            }) as const satisfies { [key in ClassKey]?: unknown }
    );
