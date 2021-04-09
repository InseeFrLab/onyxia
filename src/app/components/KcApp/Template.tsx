/* eslint-disable jsx-a11y/anchor-is-valid */

import { useReducer, useEffect, memo } from "react";
import type { ReactNode } from "react";
import { useKcMessage } from "keycloakify/lib/i18n/useKcMessage";
import { useKcLanguageTag } from "keycloakify/lib/i18n/useKcLanguageTag";
import type { KcContext } from "keycloakify/lib/KcContext";
import { assert } from "evt/tools/typeSafety/assert";
import { cx } from "tss-react";
import { getBestMatchAmongKcLanguageTag } from "keycloakify/lib/i18n/KcLanguageTag";
import { useConstCallback } from "powerhooks";
import type { KcTemplateProps } from "keycloakify";
import { Header } from "app/components/shared/Header";
//import { Footer } from "app/components/App/Footer";
import { logoMaxWidthInPercent } from "app/components/App";
import { createUseClassNames } from "app/theme/useClassNames";
import { useDomRect } from "powerhooks";
import { useWindowInnerSize } from "powerhooks";
import onyxiaNeumorphismDarkModeUrl from "app/assets/svg/OnyxiaNeumorphismDarkMode.svg";
import onyxiaNeumorphismLightModeUrl from "app/assets/svg/OnyxiaNeumorphismLightMode.svg";
import { Paper } from "app/components/designSystem/Paper";
import { Typography } from "app/components/designSystem/Typography";
import { Alert } from "app/components/designSystem/Alert";

import { appendHead } from "keycloakify/lib/tools/appendHead";
import { join as pathJoin } from "path";


export type TemplateProps = {
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
} & { kcContext: KcContext; } & KcTemplateProps;

const { useClassNames } = createUseClassNames<{ windowInnerWidth: number; aspectRatio: number; windowInnerHeight: number; }>()(
    (theme) => ({
        "root": {
            "height": "100%",
            "display": "flex",
            "flexDirection": "column",
            "backgroundColor": theme.custom.colors.useCases.surfaces.background,
        },

        "header": {
            "width": "100%",
            "paddingRight": "2%",
            "height": 64
        },
        "betweenHeaderAndFooter": {
            "flex": 1,
            "overflow": "hidden",
            "backgroundImage": `url(${(() => {
                switch (theme.palette.type) {
                    case "dark": return onyxiaNeumorphismDarkModeUrl;
                    case "light": return onyxiaNeumorphismLightModeUrl;
                }
            })()})`,
            "backgroundSize": "auto 90%",
            "backgroundPosition": "center",
            "backgroundRepeat": "no-repeat",
        },
        "page": {
            "height": "100%",
            "overflow": "auto",
        },
        "footer": {
            "height": 34
        }


    })
);

export const Template = memo((props: TemplateProps) => {

    const { kcContext, className } = props;

    useEffect(() => { console.log("Rendering this page with react using keycloakify") }, []);

    const { kcLanguageTag } = useKcLanguageTag();

    useEffect(
        () => {

            if (!kcContext.realm.internationalizationEnabled) {
                return;
            }

            assert(kcContext.locale !== undefined);

            if (kcLanguageTag === getBestMatchAmongKcLanguageTag(kcContext.locale.current)) {
                return;
            }

            window.location.href =
                kcContext.locale.supported.find(({ languageTag }) => languageTag === kcLanguageTag)!.url;

        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [kcLanguageTag]
    );


    const { domRect: { width: rootWidth }, ref: rootRef } = useDomRect();

    const logoMaxWidth = Math.floor(rootWidth * logoMaxWidthInPercent / 100);

    const { windowInnerWidth, windowInnerHeight } = useWindowInnerSize();

    const { classNames } = useClassNames({
        windowInnerWidth,
        "aspectRatio": windowInnerWidth / windowInnerHeight,
        windowInnerHeight
    });

    const onHeaderLogoClick = useConstCallback(() =>
        window.location.href = "https://docs.sspcloud.fr"
    );

    const [isExtraCssLoaded, setExtraCssLoaded] = useReducer(() => true, false);


    useEffect(
        () => {

            if (kcContext.pageId === "login.ftl" || kcContext.pageId === "register.ftl" || kcContext.pageId === "terms.ftl") {
                setExtraCssLoaded();
                return;
            }

            let isUnmounted = false;
            const cleanups: (() => void)[] = [];

            const toArr = (x: string | readonly string[] | undefined) =>
                typeof x === "string" ? x.split(" ") : x ?? [];

            Promise.all(
                [
                    ...toArr(props.stylesCommon).map(relativePath => pathJoin(kcContext.url.resourcesCommonPath, relativePath)),
                    ...toArr(props.styles).map(relativePath => pathJoin(kcContext.url.resourcesPath, relativePath))
                ].map(href => appendHead({
                    "type": "css",
                    href
                }))).then(() => {

                    if (isUnmounted) {
                        return;
                    }

                    setExtraCssLoaded();

                });

            toArr(props.scripts).forEach(
                relativePath => appendHead({
                    "type": "javascript",
                    "src": pathJoin(kcContext.url.resourcesPath, relativePath)
                })
            );

            if (props.kcHtmlClass !== undefined) {

                const htmlClassList =
                    document.getElementsByTagName("html")[0]
                        .classList;

                const tokens = cx(props.kcHtmlClass).split(" ")

                htmlClassList.add(...tokens);

                cleanups.push(() => htmlClassList.remove(...tokens));

            }

            return () => {

                isUnmounted = true;

                cleanups.forEach(f => f());

            };

        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [props.kcHtmlClass]
    );

    if (!isExtraCssLoaded) {
        return null;
    }

    return (
        <div ref={rootRef} className={cx(classNames.root, className)} >
            <Header
                type="keycloak"
                className={classNames.header}
                logoMaxWidth={logoMaxWidth}
                onLogoClick={onHeaderLogoClick}
            />
            <section className={classNames.betweenHeaderAndFooter}>
                <Page {...props} className={classNames.page} />
            </section>
            {/*<Footer className={classNames.footer} />*/}
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
    } & { kcContext: KcContext; } & KcTemplateProps;


    const { useClassNames } = createUseClassNames<{ isPaperBiggerThanContainer: boolean }>()(
        (theme, { isPaperBiggerThanContainer }) => ({
            "root": {
                "display": "flex",
                "justifyContent": "center",
                "alignItems": isPaperBiggerThanContainer ? undefined : "center"
            },
            "paper": {
                "padding": theme.spacing(4),
                "width": 490,
                "height": "fit-content",
                "marginBottom": theme.spacing(3)
            },
            "alert": {
                "alignItems": "center"
            }
        })
    );


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
            ...kcProps
        } = props;


        const { ref: containerRef, domRect: { height: containerHeight } } = useDomRect();
        const { ref: paperRef, domRect: { height: paperHeight } } = useDomRect();

        const { classNames } = useClassNames({
            "isPaperBiggerThanContainer": paperHeight > containerHeight
        });
        return (
            <div ref={containerRef} className={cx(classNames.root, className)}>
                <Paper ref={paperRef} className={classNames.paper}>

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

                </Paper>
            </div>
        );

    });

    const { Head } = (() => {

        type Props = {
            displayRequiredFields: boolean;
            headerNode: ReactNode;
            showUsernameNode?: ReactNode;
        } & { kcContext: KcContext; } & KcTemplateProps;

        const { useClassNames } = createUseClassNames()(
            theme => ({
                "root": {
                    "textAlign": "center",
                    "marginTop": theme.spacing(4),
                    "marginBottom": theme.spacing(4)
                }
            })
        );

        const Head = memo((props: Props) => {

            const {
                kcContext,
                displayRequiredFields,
                headerNode,
                showUsernameNode,
                ...kcProps
            } = props;

            const { msg } = useKcMessage();

            const { classNames } = useClassNames({});

            return (
                <header>
                    {
                        !(
                            kcContext.auth !== undefined &&
                            kcContext.auth.showUsername &&
                            !kcContext.auth.showResetCredentials
                        ) ?
                            (
                                displayRequiredFields ?
                                    (

                                        <div className={cx(kcProps.kcContentWrapperClass)}>
                                            <div className={cx(kcProps.kcLabelWrapperClass, "subtitle")}>
                                                <span className="subtitle">
                                                    <span className="required">*</span>
                                                    {msg("requiredFields")}
                                                </span>
                                            </div>
                                            <div className="col-md-10">
                                                <Typography className={classNames.root} variant="h4">{headerNode!}</Typography>
                                            </div>
                                        </div>

                                    )
                                    :
                                    (
                                        <Typography className={classNames.root} variant="h4">{headerNode!}</Typography>
                                    )
                            ) : (
                                displayRequiredFields ? (
                                    <div className={cx(kcProps.kcContentWrapperClass)}>
                                        <div className={cx(kcProps.kcLabelWrapperClass, "subtitle")}>
                                            <span className="subtitle"><span className="required">*</span> {msg("requiredFields")}</span>
                                        </div>
                                        <div className="col-md-10">
                                            {showUsernameNode}
                                            <div className={cx(kcProps.kcFormGroupClass)}>
                                                <div id="kc-username">
                                                    <label id="kc-attempted-username">{kcContext.auth?.attemptedUsername}</label>
                                                    <a id="reset-login" href={kcContext.url.loginRestartFlowUrl}>
                                                        <div className="kc-login-tooltip">
                                                            <i className={cx(kcProps.kcResetFlowIcon)}></i>
                                                            <span className="kc-tooltip-text">{msg("restartLoginTooltip")}</span>
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
                                                <label id="kc-attempted-username">{kcContext.auth?.attemptedUsername}</label>
                                                <a id="reset-login" href={kcContext.url.loginRestartFlowUrl}>
                                                    <div className="kc-login-tooltip">
                                                        <i className={cx(kcProps.kcResetFlowIcon)}></i>
                                                        <span className="kc-tooltip-text">{msg("restartLoginTooltip")}</span>
                                                    </div>
                                                </a>
                                            </div>
                                        </div>
                                    </>
                                )
                            )
                    }
                </header>
            );

        });

        return { Head };

    })();


    const { Main } = (() => {


        type Props = {
            displayMessage?: boolean;
            formNode: ReactNode
            showAnotherWayIfPresent?: boolean;
            displayWide?: boolean;
            displayInfo?: boolean;
            infoNode?: ReactNode;
        } & { kcContext: KcContext; } & KcTemplateProps;

        const { useClassNames } = createUseClassNames()(
            () => ({
                "alert": {
                    "alignItems": "center"
                }
            })
        );

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

            const { classNames } = useClassNames({});

            return (
                <div id="kc-content">
                    <div id="kc-content-wrapper">
                        {/* App-initiated actions should not see warning messages about the need to complete the action during login.*/}
                        {
                            (
                                displayMessage &&
                                kcContext.message !== undefined &&
                                (
                                    kcContext.message.type !== "warning" ||
                                    !kcContext.isAppInitiatedAction
                                )
                            ) &&
                            <Alert className={classNames.alert} severity={kcContext.message.type}>
                                {kcContext.message.summary}
                            </Alert>
                        }
                        {formNode}
                        {
                            (
                                kcContext.auth !== undefined &&
                                kcContext.auth.showTryAnotherWayLink &&
                                showAnotherWayIfPresent
                            ) &&

                            <form id="kc-select-try-another-way-form" action={kcContext.url.loginAction} method="post" className={cx(displayWide && props.kcContentWrapperClass)} >
                                <div className={cx(displayWide && [kcProps.kcFormSocialAccountContentClass, kcProps.kcFormSocialAccountClass])} >
                                    <div className={cx(kcProps.kcFormGroupClass)}>
                                        <input type="hidden" name="tryAnotherWay" value="on" />
                                        <a href="#" id="try-another-way" onClick={onTryAnotherWayClick}>{msg("doTryAnotherWay")}</a>
                                    </div>
                                </div >
                            </form>
                        }
                        {
                            displayInfo &&

                            <div id="kc-info" className={cx(kcProps.kcSignUpClass)}>
                                <div id="kc-info-wrapper" className={cx(kcProps.kcInfoAreaWrapperClass)}>
                                    {infoNode}
                                </div>
                            </div>
                        }
                    </div>
                </div>
            );

        });

        return { Main };

    })();

    return { Page };


})();


