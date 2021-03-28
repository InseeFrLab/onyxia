/* eslint-disable jsx-a11y/anchor-is-valid */

import { useEffect, memo } from "react";
import type { ReactNode } from "react";
//import { useKcMessage } from "keycloakify/lib/i18n/useKcMessage";
import { useKcLanguageTag } from "keycloakify/lib/i18n/useKcLanguageTag";
import type { KcContext } from "keycloakify/lib/KcContext";
import { assert } from "evt/tools/typeSafety/assert";
import { cx } from "tss-react";
//import type { KcLanguageTag } from "keycloakify/lib/i18n/KcLanguageTag";
import { getBestMatchAmongKcLanguageTag } from "keycloakify/lib/i18n/KcLanguageTag";
//import { getKcLanguageTagLabel } from "keycloakify/lib/i18n/KcLanguageTag";
//import { useCallbackFactory } from "powerhooks";
//import { appendHead } from "keycloakify/lib/tools/appendHead";
//import { join as pathJoin } from "path";
import { useConstCallback } from "powerhooks";
import type { KcTemplateProps } from "keycloakify";
import { Header } from "app/components/App/Header";
import { Footer } from "app/components/App/Footer";
import { logoMaxWidthInPercent } from "app/components/App";
import { createUseClassNames } from "app/theme/useClassNames";
import { useDomRect } from "powerhooks";
import { routes } from "app/router";
import { useWindowInnerSize } from "powerhooks";
import onyxiaNeumorphismDarkModeUrl from "app/assets/svg/OnyxiaNeumorphismDarkMode.svg";
import onyxiaNeumorphismLightModeUrl from "app/assets/svg/OnyxiaNeumorphismLightMode.svg";
import { Paper } from "app/components/designSystem/Paper";

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
} & { kcContext: KcContext.Template; } & KcTemplateProps;

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
            "background": `center / contain no-repeat url(${(() => {
                switch (theme.palette.type) {
                    case "dark": return onyxiaNeumorphismDarkModeUrl;
                    case "light": return onyxiaNeumorphismLightModeUrl;
                }
            })()})`,
        },
        "page": {
            "height": "100%"
        },
        "footer": {
            "height": 34
        },


    })
);

export const Template = memo((props: TemplateProps) => {

    const {
        className,
        //displayInfo = false,
        //displayMessage = true,
        //displayRequiredFields = false,
        //displayWide = false,
        //showAnotherWayIfPresent = true,
        //headerNode,
        //showUsernameNode = null,
        //formNode,
        //infoNode = null,
        kcContext
    } = props;

    useEffect(() => { console.log("Rendering this page with react using keycloakify") }, []);

    //const { msg } = useKcMessage();

    const { kcLanguageTag } = useKcLanguageTag();

    /*
    const onTryAnotherWayClick = useConstCallback(() => {
        document.forms["kc-select-try-another-way-form" as never].submit();
        return false;
    });
    */

    const {
        realm, locale,
        //auth,
        //url, message, isAppInitiatedAction
    } = kcContext;

    useEffect(
        () => {

            if (!realm.internationalizationEnabled) {
                return;
            }

            assert(locale !== undefined);

            if (kcLanguageTag === getBestMatchAmongKcLanguageTag(locale.current)) {
                return;
            }

            window.location.href =
                locale.supported.find(({ languageTag }) => languageTag === kcLanguageTag)!.url;

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

    const onHeaderLogoClick = useConstCallback(() => routes.home().push());

    return (
        <div ref={rootRef} className={cx(classNames.root, className)} >
            <Header
                type="keycloak"
                className={classNames.header}
                logoMaxWidth={logoMaxWidth}
                onLogoClick={onHeaderLogoClick}
            />
            <section className={classNames.betweenHeaderAndFooter}>
                <Page className={classNames.page} />
            </section>
            <Footer className={classNames.footer} />
        </div>
    );



    /*
    return (
        <div ref={rootRef} className={cx(props.kcLoginClass)}>

            <div id="kc-header" className={cx(props.kcHeaderClass)}>
                <div id="kc-header-wrapper" className={cx(props.kcHeaderWrapperClass)}>
                    {msg("loginTitleHtml", realm.displayNameHtml)}
                </div>
            </div>

            <div className={cx(props.kcFormCardClass, displayWide && props.kcFormCardAccountClass)}>
                <header className={cx(props.kcFormHeaderClass)}>
                    {
                        (
                            realm.internationalizationEnabled &&
                            (assert(locale !== undefined), true) &&
                            locale.supported.length > 1
                        ) &&
                        <div id="kc-locale">
                            <div id="kc-locale-wrapper" className={cx(props.kcLocaleWrapperClass)}>
                                <div className="kc-dropdown" id="kc-locale-dropdown">
                                    <a href="#" id="kc-current-locale-link">
                                        {getKcLanguageTagLabel(kcLanguageTag)}
                                    </a>
                                    <ul>
                                        {
                                            locale.supported.map(
                                                ({ languageTag }) =>
                                                    <li key={languageTag} className="kc-dropdown-item">
                                                        <a href="#" onClick={onChangeLanguageClickFactory(languageTag)}>
                                                            {getKcLanguageTagLabel(languageTag)}
                                                        </a>

                                                    </li>
                                            )
                                        }
                                    </ul>
                                </div>
                            </div>
                        </div>

                    }
                    {
                        !(
                            auth !== undefined &&
                            auth.showUsername &&
                            !auth.showResetCredentials
                        ) ?
                            (
                                displayRequiredFields ?
                                    (

                                        <div className={cx(props.kcContentWrapperClass)}>
                                            <div className={cx(props.kcLabelWrapperClass, "subtitle")}>
                                                <span className="subtitle">
                                                    <span className="required">*</span>
                                                    {msg("requiredFields")}
                                                </span>
                                            </div>
                                            <div className="col-md-10">
                                                <h1 id="kc-page-title">{headerNode}</h1>
                                            </div>
                                        </div>

                                    )
                                    :
                                    (

                                        <h1 id="kc-page-title">{headerNode}</h1>

                                    )
                            ) : (
                                displayRequiredFields ? (
                                    <div className={cx(props.kcContentWrapperClass)}>
                                        <div className={cx(props.kcLabelWrapperClass, "subtitle")}>
                                            <span className="subtitle"><span className="required">*</span> {msg("requiredFields")}</span>
                                        </div>
                                        <div className="col-md-10">
                                            {showUsernameNode}
                                            <div className={cx(props.kcFormGroupClass)}>
                                                <div id="kc-username">
                                                    <label id="kc-attempted-username">{auth?.attemptedUsername}</label>
                                                    <a id="reset-login" href={url.loginRestartFlowUrl}>
                                                        <div className="kc-login-tooltip">
                                                            <i className={cx(props.kcResetFlowIcon)}></i>
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
                                        <div className={cx(props.kcFormGroupClass)}>
                                            <div id="kc-username">
                                                <label id="kc-attempted-username">{auth?.attemptedUsername}</label>
                                                <a id="reset-login" href={url.loginRestartFlowUrl}>
                                                    <div className="kc-login-tooltip">
                                                        <i className={cx(props.kcResetFlowIcon)}></i>
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
                <div id="kc-content">
                    <div id="kc-content-wrapper">
                        {// App-initiated actions should not see warning messages about the need to complete the action during login. }
                        {
                            (
                                displayMessage &&
                                message !== undefined &&
                                (
                                    message.type !== "warning" ||
                                    !isAppInitiatedAction
                                )
                            ) &&
                            <div className={cx("alert", `alert-${message.type}`)}>
                                {message.type === "success" && <span className={cx(props.kcFeedbackSuccessIcon)}></span>}
                                {message.type === "warning" && <span className={cx(props.kcFeedbackWarningIcon)}></span>}
                                {message.type === "error" && <span className={cx(props.kcFeedbackErrorIcon)}></span>}
                                {message.type === "info" && <span className={cx(props.kcFeedbackInfoIcon)}></span>}
                                <span className="kc-feedback-text">{message.summary}</span>
                            </div>
                        }
                        {formNode}
                        {
                            (
                                auth !== undefined &&
                                auth.showTryAnotherWayLink &&
                                showAnotherWayIfPresent
                            ) &&

                            <form id="kc-select-try-another-way-form" action={url.loginAction} method="post" className={cx(displayWide && props.kcContentWrapperClass)} >
                                <div className={cx(displayWide && [props.kcFormSocialAccountContentClass, props.kcFormSocialAccountClass])} >
                                    <div className={cx(props.kcFormGroupClass)}>
                                        <input type="hidden" name="tryAnotherWay" value="on" />
                                        <a href="#" id="try-another-way" onClick={onTryAnotherWayClick}>{msg("doTryAnotherWay")}</a>
                                    </div>
                                </div >
                            </form>
                        }
                        {
                            displayInfo &&

                            <div id="kc-info" className={cx(props.kcSignUpClass)}>
                                <div id="kc-info-wrapper" className={cx(props.kcInfoAreaWrapperClass)}>
                                    {infoNode}
                                </div>
                            </div>
                        }
                    </div>
                </div>
            </div>
        </div>
    );
    */
});

const { Page } = (() => {

    type Props = {
        className: string;
    };

    const { useClassNames } = createUseClassNames()(
        (theme) => ({
            "root": {
                "display": "flex",
                "justifyContent": "center",
                "alignItems": "center"
            },
            "paper": {
                "padding": theme.spacing(3)
            }
        })
    );

    const Page = memo((props: Props) => {

        const { className } = props;

        const { classNames } = useClassNames({});

        return (
            <div className={cx(classNames.root, className)}>
                <Paper className={classNames.paper}>
                    <h1>Hello! I define the content</h1>
                </Paper>
            </div>
        );

    });

    return { Page };


})();


