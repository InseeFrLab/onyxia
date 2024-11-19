import { useEffect } from "react";
import type { TemplateProps as TemplateProps_generic } from "keycloakify/login/TemplateProps";
import { getKcClsx } from "keycloakify/login/lib/kcClsx";
import { useInitialize } from "keycloakify/login/Template.useInitialize";
import { useSetClassName } from "keycloakify/tools/useSetClassName";
import type { KcContext } from "./KcContext";
import type { I18n } from "./i18n";
import { memo } from "react";
import { useConstCallback } from "powerhooks/useConstCallback";
import { tss } from "tss";
import { Text } from "onyxia-ui/Text";
import { IconButton } from "onyxia-ui/IconButton";
import { useDomRect } from "powerhooks/useDomRect";
import { useWindowInnerSize } from "powerhooks/useWindowInnerSize";
import CloseIcon from "@mui/icons-material/Close";
import { Card } from "onyxia-ui/Card";
import { Alert } from "onyxia-ui/Alert";
import { symToStr } from "tsafe/symToStr";
import { BrandHeaderSection } from "ui/shared/BrandHeaderSection";
import { getReferrerUrl } from "keycloak-theme/login/tools/getReferrerUrl";
import { useConst } from "powerhooks/useConst";
import { env } from "env";
import { useThemedImageUrl } from "onyxia-ui/ThemedImage";
import { kcSanitize } from "keycloakify/lib/kcSanitize";

type TemplateProps = TemplateProps_generic<KcContext, I18n>;

export default function Template(props: TemplateProps) {
    const {
        bodyClassName,
        kcContext,
        i18n,
        doUseDefaultCss,
        classes: classes_props,
        children
    } = props;

    const backgroundUrl = useThemedImageUrl(env.BACKGROUND_ASSET);

    const { classes, cx } = useStyles({
        backgroundUrl
    });

    const { kcClsx } = getKcClsx({
        doUseDefaultCss,
        classes: classes_props
    });

    useEffect(() => {
        document.title = `${env.TAB_TITLE} - ${i18n.msgStr("tabTitleSuffix")}`;
    }, []);

    useSetClassName({
        qualifiedName: "html",
        className: kcClsx("kcHtmlClass")
    });

    useSetClassName({
        qualifiedName: "body",
        className: bodyClassName ?? kcClsx("kcBodyClass")
    });

    const { isReadyToRender } = useInitialize({ kcContext, doUseDefaultCss });

    if (!isReadyToRender) {
        return null;
    }

    return (
        <div className={cx(classes.root, kcClsx("kcLoginClass"))}>
            <Header className={classes.header} />
            <section className={classes.betweenHeaderAndFooter}>
                <Page {...props} className={classes.page}>
                    {children}
                </Page>
            </section>
        </div>
    );
}

const useStyles = tss
    .withName({ Template })
    .withParams<{ backgroundUrl: string | undefined }>()
    .create(({ theme, backgroundUrl }) => ({
        root: {
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            backgroundColor: theme.colors.useCases.surfaces.background
        },

        header: {
            width: "100%",
            paddingRight: "2%",
            height: 64
        },
        betweenHeaderAndFooter: {
            flex: 1,
            overflow: "hidden",
            ...(backgroundUrl === undefined
                ? undefined
                : {
                      backgroundImage: `url(${backgroundUrl})`,
                      backgroundSize: "auto 90%",
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat"
                  })
        },
        page: {
            height: "100%",
            overflow: "auto"
        }
    }));

const { Header } = (() => {
    type Params = {
        className?: string;
    };

    function Header(params: Params) {
        const { className } = params;

        const { cx, classes } = useStyles();

        const { windowInnerHeight } = useWindowInnerSize();

        const referrerUrl = useConst(() => getReferrerUrl());

        if (windowInnerHeight < 700) {
            return null;
        }

        return (
            <header className={cx(classes.root, className)}>
                <BrandHeaderSection
                    doShowOnyxia={false}
                    link={{
                        href: referrerUrl ?? "#",
                        onClick: () => {}
                    }}
                />
            </header>
        );
    }

    const useStyles = tss.withName({ Header }).create(({ theme }) => ({
        root: {
            backgroundColor: theme.colors.useCases.surfaces.background,
            overflow: "auto",
            display: "flex",
            alignItems: "center",
            ...theme.spacing.topBottom("padding", 2)
        }
    }));

    return { Header };
})();

const { Page } = (() => {
    type Props = { className: string } & Pick<
        TemplateProps,
        | "displayInfo"
        | "displayMessage"
        | "displayRequiredFields"
        | "headerNode"
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
            headerNode,
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
            isPaperBiggerThanContainer: paperHeight > containerHeight
        });
        return (
            <div ref={containerRef} className={cx(classes.root, className)}>
                <Card ref={paperRef} className={classes.paper}>
                    {kcContext.pageId === "login.ftl" &&
                        !env.AUTHENTICATION_GLOBALLY_REQUIRED && (
                            <div className={classes.crossButtonWrapper}>
                                <div style={{ flex: 1 }} />
                                <IconButton
                                    icon={CloseIcon}
                                    tabIndex={-1}
                                    onClick={() => {
                                        const referrerUrl = getReferrerUrl();

                                        if (referrerUrl === undefined) {
                                            window.history.back();
                                            return;
                                        }

                                        window.location.href = referrerUrl;
                                    }}
                                />
                            </div>
                        )}
                    <Head
                        kcContext={kcContext}
                        displayRequiredFields={displayRequiredFields}
                        headerNode={headerNode}
                        i18n={i18n}
                        doUseDefaultCss={doUseDefaultCss}
                    />
                    <Main
                        kcContext={kcContext}
                        displayMessage={displayMessage}
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
            root: {
                display: "flex",
                justifyContent: "center",
                alignItems: isPaperBiggerThanContainer ? undefined : "center"
            },
            paper: {
                padding: theme.spacing(5),
                width: 490,
                height: "fit-content",
                marginBottom: theme.spacing(4),
                borderRadius: 8
            },
            alert: {
                alignItems: "center"
            },
            crossButtonWrapper: {
                display: "flex"
            }
        }));

    const { Head } = (() => {
        type Props = Pick<
            TemplateProps,
            | "displayRequiredFields"
            | "headerNode"
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
                i18n,
                classes: classes_props,
                doUseDefaultCss
            } = props;

            const { msg } = i18n;

            const { classes, cx } = useStyles();

            const { kcClsx } = getKcClsx({
                doUseDefaultCss,
                classes: classes_props
            });

            return (
                <header>
                    {!(
                        kcContext.auth !== undefined &&
                        kcContext.auth.showUsername &&
                        !kcContext.auth.showResetCredentials
                    ) ? (
                        displayRequiredFields ? (
                            <div className={kcClsx("kcContentWrapperClass")}>
                                <div
                                    className={cx(
                                        kcClsx("kcLabelWrapperClass"),
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
                        <div className={kcClsx("kcContentWrapperClass")}>
                            <div
                                className={cx(kcClsx("kcLabelWrapperClass"), "subtitle")}
                            >
                                <span className="subtitle">
                                    <span className="required">*</span>{" "}
                                    {msg("requiredFields")}
                                </span>
                            </div>
                            <div className="col-md-10">
                                <div className={kcClsx("kcFormGroupClass")}>
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
                                                    className={kcClsx("kcResetFlowIcon")}
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
                            <div className={kcClsx("kcFormGroupClass")}>
                                <div id="kc-username">
                                    <label id="kc-attempted-username">
                                        {kcContext.auth?.attemptedUsername}
                                    </label>
                                    <a
                                        id="reset-login"
                                        href={kcContext.url.loginRestartFlowUrl}
                                    >
                                        <div className="kc-login-tooltip">
                                            <i className={kcClsx("kcResetFlowIcon")}></i>
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
                root: {
                    textAlign: "center",
                    marginTop: theme.spacing(3),
                    marginBottom: theme.spacing(3)
                }
            }));

        return { Head };
    })();

    const { Main } = (() => {
        type Props = Pick<
            TemplateProps,
            | "displayMessage"
            | "children"
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
                displayInfo,
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

            const { kcClsx } = getKcClsx({
                doUseDefaultCss,
                classes: classes_props
            });

            const { msg } = i18n;

            const { classes } = useStyles();

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
                                                __html: kcSanitize(
                                                    kcContext.message.summary
                                                )
                                            }}
                                        />
                                    </Text>
                                </Alert>
                            )}
                        {children}
                        {kcContext.auth !== undefined &&
                            kcContext.auth.showTryAnotherWayLink && (
                                <form
                                    id="kc-select-try-another-way-form"
                                    action={kcContext.url.loginAction}
                                    method="post"
                                >
                                    <div>
                                        <div className={kcClsx("kcFormGroupClass")}>
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
                            <div id="kc-info" className={kcClsx("kcSignUpClass")}>
                                <div
                                    id="kc-info-wrapper"
                                    className={kcClsx("kcInfoAreaWrapperClass")}
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
                alert: {
                    alignItems: "center"
                }
            });

        return { Main };
    })();

    return { Page };
})();
