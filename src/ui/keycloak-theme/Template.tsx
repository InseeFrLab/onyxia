/* eslint-disable jsx-a11y/anchor-is-valid */
import { memo } from "react";
import type { ReactNode } from "react";
import { useConstCallback } from "powerhooks/useConstCallback";
import type { KcTemplateProps } from "keycloakify";
import { Header } from "ui/shared/Header";
import { logoContainerWidthInPercent } from "ui/App";
import { makeStyles, IconButton, Text } from "ui/theme";
import { useDomRect, useWindowInnerSize } from "onyxia-ui";
import onyxiaNeumorphismDarkModeUrl from "ui/assets/svg/OnyxiaNeumorphismDarkMode.svg";
import onyxiaNeumorphismLightModeUrl from "ui/assets/svg/OnyxiaNeumorphismLightMode.svg";
import { Card } from "onyxia-ui/Card";
import { Alert } from "onyxia-ui/Alert";
import { symToStr } from "tsafe/symToStr";
import type { I18n } from "./i18n";
import type { TemplateProps } from "keycloakify/lib/KcProps";
import { usePrepareTemplate } from "keycloakify/lib/Template";
import type { KcContext } from "./kcContext";

export default function Template(
    props: TemplateProps<KcContext, I18n> & {
        onClickCross?: () => void;
    }
) {
    const {
        kcContext,
        i18n,
        doFetchDefaultThemeResources,
        stylesCommon,
        styles,
        scripts,
        kcHtmlClass,
        onClickCross
    } = props;

    const { url } = kcContext;

    const { isReady } = usePrepareTemplate({
        doFetchDefaultThemeResources,
        stylesCommon,
        styles,
        scripts,
        url,
        kcHtmlClass
    });

    const {
        domRect: { width: rootWidth },
        ref: rootRef
    } = useDomRect();

    const logoContainerWidth = Math.max(
        Math.floor((Math.min(rootWidth, 1920) * logoContainerWidthInPercent) / 100),
        45
    );

    const { windowInnerWidth, windowInnerHeight } = useWindowInnerSize();

    const { classes } = useStyles({
        windowInnerWidth,
        "aspectRatio": windowInnerWidth / windowInnerHeight,
        windowInnerHeight
    });

    const onHeaderLogoClick = useConstCallback(
        () => (window.location.href = "https://docs.sspcloud.fr")
    );

    if (!isReady) {
        return null;
    }

    return (
        <div ref={rootRef} className={classes.root}>
            {windowInnerHeight > 700 && (
                <Header
                    useCase="login pages"
                    className={classes.header}
                    logoContainerWidth={logoContainerWidth}
                    onLogoClick={onHeaderLogoClick}
                />
            )}
            <section className={classes.betweenHeaderAndFooter}>
                <Page {...props} className={classes.page} onClickCross={onClickCross} />
            </section>
        </div>
    );
}

const useStyles = makeStyles<{
    windowInnerWidth: number;
    aspectRatio: number;
    windowInnerHeight: number;
}>()(theme => ({
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
    type Props = {
        className?: string;
        displayInfo?: boolean;
        displayMessage?: boolean;
        displayRequiredFields?: boolean;
        displayWide?: boolean;
        showAnotherWayIfPresent?: boolean;
        headerNode: ReactNode;
        showUsernameNode?: ReactNode;
        formNode: ReactNode;
        infoNode?: ReactNode;
        onClickCross: (() => void) | undefined;
        i18n: I18n;
    } & { kcContext: KcContext } & KcTemplateProps;

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
            formNode,
            infoNode = null,
            kcContext,
            onClickCross,
            i18n,
            ...kcProps
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
                    {onClickCross !== undefined && (
                        <div className={classes.crossButtonWrapper}>
                            <div style={{ "flex": 1 }} />
                            <IconButton iconId="close" onClick={onClickCross} />
                        </div>
                    )}

                    <Head
                        {...{ kcContext, ...kcProps }}
                        displayRequiredFields={displayRequiredFields}
                        headerNode={headerNode}
                        showUsernameNode={showUsernameNode}
                        i18n={i18n}
                    />
                    <Main
                        {...{ kcContext, ...kcProps }}
                        displayMessage={displayMessage}
                        formNode={formNode}
                        showAnotherWayIfPresent={showAnotherWayIfPresent}
                        displayWide={displayWide}
                        displayInfo={displayInfo}
                        infoNode={infoNode}
                        i18n={i18n}
                    />
                </Card>
            </div>
        );
    });

    const useStyles = makeStyles<{ isPaperBiggerThanContainer: boolean }>({
        "name": { Page }
    })((theme, { isPaperBiggerThanContainer }) => ({
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
        type Props = {
            displayRequiredFields: boolean;
            headerNode: ReactNode;
            showUsernameNode?: ReactNode;
            i18n: I18n;
        } & { kcContext: KcContext } & KcTemplateProps;

        const Head = memo((props: Props) => {
            const {
                kcContext,
                displayRequiredFields,
                headerNode,
                showUsernameNode,
                i18n,
                ...kcProps
            } = props;

            const { msg } = i18n;

            const { classes, cx } = useStyles();

            return (
                <header>
                    {!(
                        kcContext.auth !== undefined &&
                        kcContext.auth.showUsername &&
                        !kcContext.auth.showResetCredentials
                    ) ? (
                        displayRequiredFields ? (
                            <div className={cx(kcProps.kcContentWrapperClass)}>
                                <div
                                    className={cx(
                                        kcProps.kcLabelWrapperClass,
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
                        <div className={cx(kcProps.kcContentWrapperClass)}>
                            <div className={cx(kcProps.kcLabelWrapperClass, "subtitle")}>
                                <span className="subtitle">
                                    <span className="required">*</span>{" "}
                                    {msg("requiredFields")}
                                </span>
                            </div>
                            <div className="col-md-10">
                                {showUsernameNode}
                                <div className={cx(kcProps.kcFormGroupClass)}>
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
                                                    className={cx(
                                                        kcProps.kcResetFlowIcon
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
                            <div className={cx(kcProps.kcFormGroupClass)}>
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
                                                className={cx(kcProps.kcResetFlowIcon)}
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

        const useStyles = makeStyles({
            "name": `${symToStr({ Template })}${symToStr({ Head })}`
        })(theme => ({
            "root": {
                "textAlign": "center",
                "marginTop": theme.spacing(3),
                "marginBottom": theme.spacing(3)
            }
        }));

        return { Head };
    })();

    const { Main } = (() => {
        type Props = {
            displayMessage?: boolean;
            formNode: ReactNode;
            showAnotherWayIfPresent?: boolean;
            displayWide?: boolean;
            displayInfo?: boolean;
            infoNode?: ReactNode;
            i18n: I18n;
        } & { kcContext: KcContext } & KcTemplateProps;

        const Main = memo((props: Props) => {
            const {
                displayMessage,
                showAnotherWayIfPresent,
                displayInfo,
                displayWide,
                kcContext,
                formNode,
                infoNode,
                i18n,
                ...kcProps
            } = props;

            const onTryAnotherWayClick = useConstCallback(() => {
                document.forms["kc-select-try-another-way-form" as never].submit();
                return false;
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
                        {formNode}
                        {kcContext.auth !== undefined &&
                            kcContext.auth.showTryAnotherWayLink &&
                            showAnotherWayIfPresent && (
                                <form
                                    id="kc-select-try-another-way-form"
                                    action={kcContext.url.loginAction}
                                    method="post"
                                    className={cx(
                                        displayWide && props.kcContentWrapperClass
                                    )}
                                >
                                    <div
                                        className={cx(
                                            displayWide && [
                                                kcProps.kcFormSocialAccountContentClass,
                                                kcProps.kcFormSocialAccountClass
                                            ]
                                        )}
                                    >
                                        <div className={cx(kcProps.kcFormGroupClass)}>
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
                            <div id="kc-info" className={cx(kcProps.kcSignUpClass)}>
                                <div
                                    id="kc-info-wrapper"
                                    className={cx(kcProps.kcInfoAreaWrapperClass)}
                                >
                                    {infoNode}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            );
        });

        const useStyles = makeStyles({
            "name": `${symToStr({ Template })}${symToStr({ Main })}`
        })(() => ({
            "alert": {
                "alignItems": "center"
            }
        }));

        return { Main };
    })();

    return { Page };
})();
