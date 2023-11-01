/* eslint-disable jsx-a11y/anchor-is-valid */

import { usePrepareTemplate } from "keycloakify/lib/usePrepareTemplate";
import { type TemplateProps as GenericTemplateProps } from "keycloakify/login/TemplateProps";
import { useGetClassName } from "keycloakify/login/lib/useGetClassName";
import type { KcContext } from "./kcContext";
import type { I18n } from "./i18n";
import { memo } from "react";
import { useConstCallback } from "powerhooks/useConstCallback";
import { Header } from "ui/shared/Header";
import { logoContainerWidthInPercent } from "ui/App/logoContainerWidthInPercent";
import { ThemeProvider, tss } from "keycloak-theme/login/theme";
import { Text } from "onyxia-ui/Text";
import { IconButton } from "onyxia-ui/IconButton";
import { useDomRect } from "powerhooks/useDomRect";
import { useWindowInnerSize } from "powerhooks/useWindowInnerSize";
import CloseIcon from "@mui/icons-material/Close";
import onyxiaNeumorphismDarkModeUrl from "ui/assets/svg/OnyxiaNeumorphismDarkMode.svg";
import onyxiaNeumorphismLightModeUrl from "ui/assets/svg/OnyxiaNeumorphismLightMode.svg";
import { Card } from "onyxia-ui/Card";
import { Alert } from "onyxia-ui/Alert";
import { symToStr } from "tsafe/symToStr";

type TemplateProps = GenericTemplateProps<KcContext, I18n>;

export default function Template(props: TemplateProps) {
    return (
        <ThemeProvider>
            <ContextualizedTemplate {...props} />
        </ThemeProvider>
    );
}

function ContextualizedTemplate(props: TemplateProps) {
    const { kcContext, doUseDefaultCss, classes: classes_props, children } = props;

    const {
        domRect: { width: rootWidth },
        ref: rootRef
    } = useDomRect();

    const logoContainerWidth = Math.max(
        Math.floor((Math.min(rootWidth, 1920) * logoContainerWidthInPercent) / 100),
        45
    );

    const { windowInnerWidth, windowInnerHeight } = useWindowInnerSize();

    const { classes, cx } = useStyles({
        windowInnerWidth,
        "aspectRatio": windowInnerWidth / windowInnerHeight,
        windowInnerHeight
    });

    const { getClassName } = useGetClassName({
        doUseDefaultCss,
        "classes": classes_props
    });

    const { url } = kcContext;

    const { isReady } = usePrepareTemplate({
        "doFetchDefaultThemeResources": doUseDefaultCss,
        "styles": [
            `${url.resourcesCommonPath}/node_modules/patternfly/dist/css/patternfly.min.css`,
            `${url.resourcesCommonPath}/node_modules/patternfly/dist/css/patternfly-additions.min.css`,
            `${url.resourcesCommonPath}/lib/zocial/zocial.css`,
            `${url.resourcesPath}/css/login.css`
        ],
        "htmlClassName": getClassName("kcHtmlClass"),
        "bodyClassName": undefined
    });

    if (!isReady) {
        return null;
    }

    return (
        <div ref={rootRef} className={cx(classes.root, getClassName("kcLoginClass"))}>
            {windowInnerHeight > 700 && (
                <Header
                    useCase="login pages"
                    className={classes.header}
                    logoContainerWidth={logoContainerWidth}
                    onLogoClick={() =>
                        (window.location.href = "https://docs.sspcloud.fr")
                    }
                />
            )}
            <section className={classes.betweenHeaderAndFooter}>
                <Page {...props} className={classes.page}>
                    {children}
                </Page>
            </section>
        </div>
    );
}

const useStyles = tss.create(({ theme }) => ({
    "root": {
        "height": "100vh",
        "display": "flex",
        "flexDirection": "column",
        "backgroundColor": theme.colors.useCases.surfaces.background
    },

    "header": {
        "width": "100%",
        "paddingRight": "2%",
        "height": 64
    },
    "betweenHeaderAndFooter": {
        "flex": 1,
        "overflow": "hidden",
        "backgroundImage": `url( ${
            theme.isDarkModeEnabled
                ? onyxiaNeumorphismDarkModeUrl
                : onyxiaNeumorphismLightModeUrl
        })`,
        "backgroundSize": "auto 90%",
        "backgroundPosition": "center",
        "backgroundRepeat": "no-repeat"
    },
    "page": {
        "height": "100%",
        "overflow": "auto"
    }
}));

const { Page } = (() => {
    type Props = { className: string } & Pick<
        TemplateProps,
        | "displayInfo"
        | "displayMessage"
        | "displayRequiredFields"
        | "displayWide"
        | "showAnotherWayIfPresent"
        | "headerNode"
        | "showUsernameNode"
        | "infoNode"
        | "kcContext"
        | "i18n"
        | "children"
        | "doUseDefaultCss"
    >;

    const Page = memo((props: Props) => {
        const {
            className,
            displayInfo = false,
            displayMessage = true,
            displayRequiredFields = false,
            displayWide = false,
            showAnotherWayIfPresent = true,
            headerNode,
            showUsernameNode = null,
            infoNode = null,
            kcContext,
            doUseDefaultCss,
            i18n,
            children
        } = props;

        const {
            ref: containerRef,
            domRect: { height: containerHeight }
        } = useDomRect();
        const {
            ref: paperRef,
            domRect: { height: paperHeight }
        } = useDomRect();

        const { classes, cx } = useStyles({
            "isPaperBiggerThanContainer": paperHeight > containerHeight
        });
        return (
            <div ref={containerRef} className={cx(classes.root, className)}>
                <Card ref={paperRef} className={classes.paper}>
                    {kcContext.pageId === "login.ftl" && (
                        <div className={classes.crossButtonWrapper}>
                            <div style={{ "flex": 1 }} />
                            <IconButton
                                icon={CloseIcon}
                                tabIndex={-1}
                                onClick={() => window.history.back()}
                            />
                        </div>
                    )}
                    <Head
                        kcContext={kcContext}
                        displayRequiredFields={displayRequiredFields}
                        headerNode={headerNode}
                        showUsernameNode={showUsernameNode}
                        i18n={i18n}
                        doUseDefaultCss={doUseDefaultCss}
                    />
                    <Main
                        kcContext={kcContext}
                        displayMessage={displayMessage}
                        showAnotherWayIfPresent={showAnotherWayIfPresent}
                        displayWide={displayWide}
                        displayInfo={displayInfo}
                        infoNode={infoNode}
                        i18n={i18n}
                        doUseDefaultCss={doUseDefaultCss}
                    >
                        {children}
                    </Main>
                </Card>
            </div>
        );
    });

    const useStyles = tss
        .withParams<{
            isPaperBiggerThanContainer: boolean;
        }>()
        .withName({ Page })
        .create(({ theme, isPaperBiggerThanContainer }) => ({
            "root": {
                "display": "flex",
                "justifyContent": "center",
                "alignItems": isPaperBiggerThanContainer ? undefined : "center"
            },
            "paper": {
                "padding": theme.spacing(5),
                "width": 490,
                "height": "fit-content",
                "marginBottom": theme.spacing(4),
                "borderRadius": 8
            },
            "alert": {
                "alignItems": "center"
            },
            "crossButtonWrapper": {
                "display": "flex"
            }
        }));

    const { Head } = (() => {
        type Props = Pick<
            TemplateProps,
            | "displayRequiredFields"
            | "headerNode"
            | "showUsernameNode"
            | "i18n"
            | "classes"
            | "doUseDefaultCss"
            | "kcContext"
        >;

        const Head = memo((props: Props) => {
            const {
                kcContext,
                displayRequiredFields,
                headerNode,
                showUsernameNode,
                i18n,
                classes: classes_props,
                doUseDefaultCss
            } = props;

            const { msg } = i18n;

            const { classes, cx } = useStyles();

            const { getClassName } = useGetClassName({
                doUseDefaultCss,
                "classes": classes_props
            });

            return (
                <header>
                    {!(
                        kcContext.auth !== undefined &&
                        kcContext.auth.showUsername &&
                        !kcContext.auth.showResetCredentials
                    ) ? (
                        displayRequiredFields ? (
                            <div className={getClassName("kcContentWrapperClass")}>
                                <div
                                    className={cx(
                                        getClassName("kcLabelWrapperClass"),
                                        "subtitle"
                                    )}
                                >
                                    <span className="subtitle">
                                        <span className="required">*</span>
                                        {msg("requiredFields")}
                                    </span>
                                </div>
                                <div className="col-md-10">
                                    <Text className={classes.root} typo="section heading">
                                        {headerNode!}
                                    </Text>
                                </div>
                            </div>
                        ) : (
                            <Text className={classes.root} typo="section heading">
                                {headerNode!}
                            </Text>
                        )
                    ) : displayRequiredFields ? (
                        <div className={getClassName("kcContentWrapperClass")}>
                            <div
                                className={cx(
                                    getClassName("kcLabelWrapperClass"),
                                    "subtitle"
                                )}
                            >
                                <span className="subtitle">
                                    <span className="required">*</span>{" "}
                                    {msg("requiredFields")}
                                </span>
                            </div>
                            <div className="col-md-10">
                                {showUsernameNode}
                                <div className={getClassName("kcFormGroupClass")}>
                                    <div id="kc-username">
                                        <label id="kc-attempted-username">
                                            {kcContext.auth?.attemptedUsername}
                                        </label>
                                        <a
                                            id="reset-login"
                                            href={kcContext.url.loginRestartFlowUrl}
                                        >
                                            <div className="kc-login-tooltip">
                                                <i
                                                    className={getClassName(
                                                        "kcResetFlowIcon"
                                                    )}
                                                ></i>
                                                <span className="kc-tooltip-text">
                                                    {msg("restartLoginTooltip")}
                                                </span>
                                            </div>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {showUsernameNode}
                            <div className={getClassName("kcFormGroupClass")}>
                                <div id="kc-username">
                                    <label id="kc-attempted-username">
                                        {kcContext.auth?.attemptedUsername}
                                    </label>
                                    <a
                                        id="reset-login"
                                        href={kcContext.url.loginRestartFlowUrl}
                                    >
                                        <div className="kc-login-tooltip">
                                            <i
                                                className={getClassName(
                                                    "kcResetFlowIcon"
                                                )}
                                            ></i>
                                            <span className="kc-tooltip-text">
                                                {msg("restartLoginTooltip")}
                                            </span>
                                        </div>
                                    </a>
                                </div>
                            </div>
                        </>
                    )}
                </header>
            );
        });

        const useStyles = tss
            .withName(`${symToStr({ Template })}${symToStr({ Head })}`)
            .create(({ theme }) => ({
                "root": {
                    "textAlign": "center",
                    "marginTop": theme.spacing(3),
                    "marginBottom": theme.spacing(3)
                }
            }));

        return { Head };
    })();

    const { Main } = (() => {
        type Props = Pick<
            TemplateProps,
            | "displayMessage"
            | "children"
            | "showAnotherWayIfPresent"
            | "displayWide"
            | "displayInfo"
            | "infoNode"
            | "i18n"
            | "kcContext"
            | "doUseDefaultCss"
            | "classes"
        >;

        const Main = memo((props: Props) => {
            const {
                displayMessage,
                showAnotherWayIfPresent,
                displayInfo,
                displayWide,
                kcContext,
                children,
                infoNode,
                i18n,
                doUseDefaultCss,
                classes: classes_props
            } = props;

            const onTryAnotherWayClick = useConstCallback(() => {
                document.forms["kc-select-try-another-way-form" as never].submit();
                return false;
            });

            const { getClassName } = useGetClassName({
                doUseDefaultCss,
                "classes": classes_props
            });

            const { msg } = i18n;

            const { classes, cx } = useStyles();

            return (
                <div id="kc-content">
                    <div id="kc-content-wrapper">
                        {/* App-initiated actions should not see warning messages about the need to complete the action during login.*/}
                        {displayMessage &&
                            kcContext.message !== undefined &&
                            (kcContext.message.type !== "warning" ||
                                !kcContext.isAppInitiatedAction) && (
                                <Alert
                                    className={classes.alert}
                                    severity={kcContext.message.type}
                                >
                                    <Text typo="label 2">
                                        <span
                                            dangerouslySetInnerHTML={{
                                                "__html": kcContext.message.summary
                                            }}
                                        />
                                    </Text>
                                </Alert>
                            )}
                        {children}
                        {kcContext.auth !== undefined &&
                            kcContext.auth.showTryAnotherWayLink &&
                            showAnotherWayIfPresent && (
                                <form
                                    id="kc-select-try-another-way-form"
                                    action={kcContext.url.loginAction}
                                    method="post"
                                    className={cx(
                                        displayWide &&
                                            getClassName("kcContentWrapperClass")
                                    )}
                                >
                                    <div
                                        className={cx(
                                            displayWide && [
                                                getClassName(
                                                    "kcFormSocialAccountContentClass"
                                                ),
                                                getClassName("kcFormSocialAccountClass")
                                            ]
                                        )}
                                    >
                                        <div
                                            className={cx(
                                                getClassName("kcFormGroupClass")
                                            )}
                                        >
                                            <input
                                                type="hidden"
                                                name="tryAnotherWay"
                                                value="on"
                                            />
                                            <a
                                                href="#"
                                                id="try-another-way"
                                                onClick={onTryAnotherWayClick}
                                            >
                                                {msg("doTryAnotherWay")}
                                            </a>
                                        </div>
                                    </div>
                                </form>
                            )}
                        {displayInfo && (
                            <div
                                id="kc-info"
                                className={cx(getClassName("kcSignUpClass"))}
                            >
                                <div
                                    id="kc-info-wrapper"
                                    className={cx(getClassName("kcInfoAreaWrapperClass"))}
                                >
                                    {infoNode}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            );
        });

        const useStyles = tss
            .withName(`${symToStr({ Template })}${symToStr({ Main })}`)
            .create({
                "alert": {
                    "alignItems": "center"
                }
            });

        return { Main };
    })();

    return { Page };
})();
