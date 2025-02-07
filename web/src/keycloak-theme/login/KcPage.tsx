import { Suspense, lazy } from "react";
import type { ClassKey } from "keycloakify/login";
import { useThemedImageUrl } from "onyxia-ui/ThemedImage";
import type { KcContext } from "./KcContext";
import { useI18n } from "./i18n";
import { loadThemedFavicon } from "keycloak-theme/login/theme";
import { tss } from "tss";
import { OnyxiaUi } from "keycloak-theme/login/theme";
import { env } from "env";
import { injectCustomFontFaceIfNotAlreadyDone } from "ui/theme/injectCustomFontFaceIfNotAlreadyDone";

injectCustomFontFaceIfNotAlreadyDone();
loadThemedFavicon();

const DefaultTemplate = lazy(() => import("keycloakify/login/Template"));
const Template = lazy(() => import("./Template"));
const DefaultPage = lazy(() => import("keycloakify/login/DefaultPage"));
const UserProfileFormFields = lazy(() => import("./UserProfileFormFields"));
const DefaultUserProfileFormFields = lazy(
    () => import("keycloakify/login/UserProfileFormFields")
);
const Terms = lazy(() => import("./pages/Terms"));
const Register = lazy(() => import("./pages/Register"));
const Login = lazy(() => import("./pages/Login"));
const IdpReviewUserProfile = lazy(() => import("./pages/IdpReviewUserProfile"));

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

    //kcContext.realm.internationalizationEnabled = false;

    const backgroundUrl = useThemedImageUrl(env.BACKGROUND_ASSET);

    const { classes: defaultPageClasses, cx } = useStyles({
        backgroundUrl
    });

    const { i18n } = useI18n({ kcContext });

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
                    case "idp-review-user-profile.ftl":
                        return (
                            <IdpReviewUserProfile
                                kcContext={kcContext}
                                i18n={i18n}
                                UserProfileFormFields={UserProfileFormFields}
                                Template={Template}
                                doMakeUserConfirmPassword={doMakeUserConfirmPassword}
                                doUseDefaultCss={false}
                            />
                        );
                    default:
                        //setBrowserColorSchemeToLight();
                        return (
                            <DefaultPage
                                kcContext={kcContext}
                                i18n={i18n}
                                Template={DefaultTemplate}
                                doUseDefaultCss={true}
                                UserProfileFormFields={DefaultUserProfileFormFields}
                                doMakeUserConfirmPassword={doMakeUserConfirmPassword}
                                classes={{
                                    ...defaultPageClasses,
                                    kcFormCardClass: cx(
                                        defaultPageClasses.kcFormCardClass,
                                        "card-pf"
                                    )
                                }}
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
    .withParams<{ backgroundUrl: string | undefined }>()
    .withNestedSelectors<"kcHeaderWrapperClass">()
    .create(
        ({ theme, backgroundUrl, classes }) =>
            ({
                kcHtmlClass: {
                    ":root": {
                        colorScheme: "light"
                    },
                    "& .kcLabelClass": {
                        color: `${theme.colors.getUseCases({ isDarkModeEnabled: false }).typography.textPrimary} !important`
                    },
                    "& .kcFormOptionsWrapperClass": {
                        "& span": {
                            color: `${theme.colors.getUseCases({ isDarkModeEnabled: false }).typography.textPrimary} !important`
                        }
                    },
                    /*
                    "& .kcButtonClass:hover": {
                        "outline": `2px solid ${theme.colors.useCases.typography.textFocus}`,
                    },
                    */
                    background: `${theme.colors.useCases.surfaces.background}`,
                    "& a": {
                        color: `${theme.colors.useCases.typography.textFocus}`
                    },
                    "& label": {
                        fontSize: 14,
                        color: theme.colors.palette.light.greyVariant3,
                        fontWeight: "normal"
                    },
                    [`& .${classes.kcHeaderWrapperClass}`]: {
                        visibility: "hidden"
                    },
                    "& #kc-info-message > p:last-child": {
                        marginTop: theme.spacing(5)
                    }
                },
                kcBodyClass: {
                    "&&": {
                        ...(backgroundUrl === undefined
                            ? undefined
                            : {
                                  backgroundImage: `url(${backgroundUrl})`,
                                  backgroundSize: "auto 60%",
                                  backgroundPosition: "center",
                                  backgroundRepeat: "no-repeat"
                              })
                    }
                },
                kcLocaleWrapperClass: {
                    //visibility: "hidden"
                    display: "none"
                },
                kcFormHeaderClass: {
                    "&& h1": {
                        ...theme.typography.variants["page heading"].style,
                        color: theme.colors.palette.dark.main
                    }
                },
                kcFormCardClass: {
                    borderRadius: 10,
                    borderColor: theme.colors.useCases.typography.textFocus
                },
                kcButtonPrimaryClass: {
                    backgroundColor: "unset",
                    backgroundImage: "unset",
                    borderColor: `${theme.colors.useCases.typography.textFocus}`,
                    borderWidth: "2px",
                    borderRadius: `20px`,
                    borderStyle: "solid",
                    color: theme.colors.useCases.typography.textFocus,
                    textTransform: "uppercase",
                    "&:hover:not(:active)": {
                        backgroundColor: theme.colors.useCases.typography.textFocus,
                        color: theme.colors.palette.light.greyVariant1
                    }
                },
                kcInputClass: {
                    borderRadius: "unset",
                    border: "unset",
                    boxShadow: "unset",
                    borderBottom: `1px solid ${theme.colors.useCases.typography.textTertiary}`,
                    "&:focus": {
                        borderColor: "unset",
                        borderBottom: `1px solid ${theme.colors.useCases.typography.textFocus}`,
                        outline: "none"
                    },
                    color: `${theme.colors.getUseCases({ isDarkModeEnabled: false }).typography.textPrimary} !important`
                },
                kcHeaderWrapperClass: {},
                kcAlertClass: {
                    marginBottom: theme.spacing(6)
                }
            }) as const satisfies { [key in ClassKey]?: unknown }
    );
