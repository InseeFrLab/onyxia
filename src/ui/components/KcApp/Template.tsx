/* eslint-disable jsx-a11y/anchor-is-valid */

import { useReducer, useEffect, memo } from "react";
import type { ReactNode } from "react";
import { useKcMessage } from "keycloakify/lib/i18n/useKcMessage";
import { useKcLanguageTag } from "keycloakify/lib/i18n/useKcLanguageTag";
import { assert } from "tsafe/assert";

import { getBestMatchAmongKcLanguageTag } from "keycloakify/lib/i18n/KcLanguageTag";
import { useConstCallback } from "powerhooks/useConstCallback";
import type { KcTemplateProps } from "keycloakify";
import { Header } from "ui/components/shared/Header";
import { logoContainerWidthInPercent } from "ui/components/App";
import { makeStyles, IconButton, Text } from "ui/theme";
import { useDomRect, useWindowInnerSize } from "onyxia-ui";
import onyxiaNeumorphismDarkModeUrl from "ui/assets/svg/OnyxiaNeumorphismDarkMode.svg";
import onyxiaNeumorphismLightModeUrl from "ui/assets/svg/OnyxiaNeumorphismLightMode.svg";
import { Card } from "onyxia-ui/Card";
import { Alert } from "onyxia-ui/Alert";
import { headInsert } from "keycloakify/lib/tools/headInsert";
import { join as pathJoin } from "path";
import type { KcContext } from "./kcContext";
import { symToStr } from "tsafe/symToStr";

export type TemplateProps = {
    doFetchDefaultThemeResources: boolean;
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
    onClickCross?(): void;
} & { kcContext: KcContext } & KcTemplateProps;

const useStyles = makeStyles<{
    windowInnerWidth: number;
    aspectRatio: number;
    windowInnerHeight: number;
}>()(theme => ({
    "root": {
        "height": "100vh",
        "display": "flex",
        "flexDirection": "column",
        "backgroundColor": theme.colors.useCases.surfaces.background,
    },

    "header": {
        "width": "100%",
        "paddingRight": "2%",
        "height": 64,
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
        "backgroundRepeat": "no-repeat",
    },
    "page": {
        "height": "100%",
        "overflow": "auto",
    },
    "footer": {
        "height": 34,
    },
}));

export const Template = memo((props: TemplateProps) => {
    const { kcContext, className, doFetchDefaultThemeResources, onClickCross } = props;

    useEffect(() => {
        console.log("Rendering this page with react using keycloakify");
    }, []);

    const { kcLanguageTag } = useKcLanguageTag();

    useEffect(() => {
        if (!kcContext.realm.internationalizationEnabled) {
            return;
        }

        assert(kcContext.locale !== undefined);

        if (kcLanguageTag === getBestMatchAmongKcLanguageTag(kcContext.locale.current)) {
            return;
        }

        window.location.href = kcContext.locale.supported.find(
            ({ languageTag }) => languageTag === kcLanguageTag,
        )!.url;
    }, [kcLanguageTag]);

    const {
        domRect: { width: rootWidth },
        ref: rootRef,
    } = useDomRect();

    const logoContainerWidth = Math.max(
        Math.floor((Math.min(rootWidth, 1920) * logoContainerWidthInPercent) / 100),
        45,
    );

    const { windowInnerWidth, windowInnerHeight } = useWindowInnerSize();

    const { classes, cx } = useStyles({
        windowInnerWidth,
        "aspectRatio": windowInnerWidth / windowInnerHeight,
        windowInnerHeight,
    });

    const onHeaderLogoClick = useConstCallback(
        () => (window.location.href = "https://docs.sspcloud.fr"),
    );

    const [isExtraCssLoaded, setExtraCssLoaded] = useReducer(() => true, false);

    useEffect(() => {
        if (!doFetchDefaultThemeResources) {
            setExtraCssLoaded();
            return;
        }

        let isUnmounted = false;
        const cleanups: (() => void)[] = [];

        const toArr = (x: string | readonly string[] | undefined) =>
            typeof x === "string" ? x.split(" ") : x ?? [];

        Promise.all(
            [
                ...toArr(props.stylesCommon).map(relativePath =>
                    pathJoin(kcContext.url.resourcesCommonPath, relativePath),
                ),
                ...toArr(props.styles).map(relativePath =>
                    pathJoin(kcContext.url.resourcesPath, relativePath),
                ),
            ].map(href =>
                headInsert({
                    "type": "css",
                    href,
                    "position": "prepend",
                }),
            ),
        ).then(() => {
            if (isUnmounted) {
                return;
            }

            setExtraCssLoaded();
        });

        toArr(props.scripts).forEach(relativePath =>
            headInsert({
                "type": "javascript",
                "src": pathJoin(kcContext.url.resourcesPath, relativePath),
            }),
        );

        if (props.kcHtmlClass !== undefined) {
            const htmlClassList = document.getElementsByTagName("html")[0].classList;

            const tokens = cx(props.kcHtmlClass).split(" ");

            htmlClassList.add(...tokens);

            cleanups.push(() => htmlClassList.remove(...tokens));
        }

        return () => {
            isUnmounted = true;

            cleanups.forEach(f => f());
        };
    }, [props.kcHtmlClass]);

    if (!isExtraCssLoaded) {
        return null;
    }

    return (
        <div ref={rootRef} className={cx(classes.root, className)}>
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
});

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
            ...kcProps
        } = props;

        const {
            ref: containerRef,
            domRect: { height: containerHeight },
        } = useDomRect();
        const {
            ref: paperRef,
            domRect: { height: paperHeight },
        } = useDomRect();

        const { classes, cx } = useStyles({
            "isPaperBiggerThanContainer": paperHeight > containerHeight,
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
                    />
                    <Main
                        {...{ kcContext, ...kcProps }}
                        displayMessage={displayMessage}
                        formNode={formNode}
                        showAnotherWayIfPresent={showAnotherWayIfPresent}
                        displayWide={displayWide}
                        displayInfo={displayInfo}
                        infoNode={infoNode}
                    />
                </Card>
            </div>
        );
    });

    const useStyles = makeStyles<{ isPaperBiggerThanContainer: boolean }>({
        "name": { Page },
    })((theme, { isPaperBiggerThanContainer }) => ({
        "root": {
            "display": "flex",
            "justifyContent": "center",
            "alignItems": isPaperBiggerThanContainer ? undefined : "center",
        },
        "paper": {
            "padding": theme.spacing(5),
            "width": 490,
            "height": "fit-content",
            "marginBottom": theme.spacing(4),
            "borderRadius": 8,
        },
        "alert": {
            "alignItems": "center",
        },
        "crossButtonWrapper": {
            "display": "flex",
        },
    }));

    const { Head } = (() => {
        type Props = {
            displayRequiredFields: boolean;
            headerNode: ReactNode;
            showUsernameNode?: ReactNode;
        } & { kcContext: KcContext } & KcTemplateProps;

        const Head = memo((props: Props) => {
            const {
                kcContext,
                displayRequiredFields,
                headerNode,
                showUsernameNode,
                ...kcProps
            } = props;

            const { msg } = useKcMessage();

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
                                        "subtitle",
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
                                                        kcProps.kcResetFlowIcon,
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
            "name": `${symToStr({ Template })}${symToStr({ Head })}`,
        })(theme => ({
            "root": {
                "textAlign": "center",
                "marginTop": theme.spacing(3),
                "marginBottom": theme.spacing(3),
            },
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
                ...kcProps
            } = props;

            const onTryAnotherWayClick = useConstCallback(() => {
                document.forms["kc-select-try-another-way-form" as never].submit();
                return false;
            });

            const { msg } = useKcMessage();

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
                                                "__html": kcContext.message.summary,
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
                                        displayWide && props.kcContentWrapperClass,
                                    )}
                                >
                                    <div
                                        className={cx(
                                            displayWide && [
                                                kcProps.kcFormSocialAccountContentClass,
                                                kcProps.kcFormSocialAccountClass,
                                            ],
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
            "name": `${symToStr({ Template })}${symToStr({ Main })}`,
        })(() => ({
            "alert": {
                "alignItems": "center",
            },
        }));

        return { Main };
    })();

    return { Page };
})();
