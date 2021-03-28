/* eslint-disable jsx-a11y/anchor-is-valid */

import { useReducer, useEffect, memo } from "react";
import type { ReactNode } from "react";
import { useKcMessage } from "keycloakify/lib/i18n/useKcMessage";
import { useKcLanguageTag } from "keycloakify/lib/i18n/useKcLanguageTag";
import type { KcContext } from "keycloakify/lib/KcContext";
import { assert } from "evt/tools/typeSafety/assert";
import { cx } from "tss-react";
import type { KcLanguageTag } from "keycloakify/lib/i18n/KcLanguageTag";
import { getBestMatchAmongKcLanguageTag } from "keycloakify/lib/i18n/KcLanguageTag";
import { getKcLanguageTagLabel } from "keycloakify/lib/i18n/KcLanguageTag";
import { useCallbackFactory } from "powerhooks";
import { appendHead } from "keycloakify/lib/tools/appendHead";
import { join as pathJoin } from "path";
import { useConstCallback } from "powerhooks";
import type { KcTemplateProps } from "keycloakify";
import { Header } from "app/components/App/Header";
import type { Props as HeaderProps } from "app/components/App/Header";
import { logoMaxWidthInPercent } from "app/components/App";
import { createUseClassNames } from "app/theme/useClassNames";
import { useDomRect } from "powerhooks";
import { useIsDarkModeEnabled } from "app/theme/useIsDarkModeEnabled";
import { useIsCloudShellVisible } from "js/components/cloud-shell/cloud-shell";
import { routes } from "app/router";

export type TemplateProps = {
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

const { useClassNames } = createUseClassNames()(
    () => ({
        "header": {
            "width": "100%",
            "paddingRight": "2%",
            "height": 64
        }
    })
);

export const Template = memo((props: TemplateProps) => {

    const {
        displayInfo = false,
        displayMessage = true,
        displayRequiredFields = false,
        displayWide = false,
        showAnotherWayIfPresent = true,
        headerNode,
        showUsernameNode = null,
        formNode,
        infoNode = null,
        kcContext
    } = props;

    useEffect(() => { console.log("Rendering this page with react using keycloakify") }, []);

    const { msg } = useKcMessage();

    const { kcLanguageTag, setKcLanguageTag } = useKcLanguageTag();


    const onChangeLanguageClickFactory = useCallbackFactory(
        ([languageTag]: [KcLanguageTag]) =>
            setKcLanguageTag(languageTag)
    );

    const onTryAnotherWayClick = useConstCallback(() => {
        document.forms["kc-select-try-another-way-form" as never].submit();
        return false;
    });

    const {
        realm, locale, auth,
        url, message, isAppInitiatedAction
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

    const [isExtraCssLoaded, setExtraCssLoaded] = useReducer(() => true, false);

    useEffect(
        () => {

            let isUnmounted = false;
            const cleanups: (() => void)[] = [];

            const toArr = (x: string | readonly string[] | undefined) =>
                typeof x === "string" ? x.split(" ") : x ?? [];

            Promise.all(
                [
                    ...toArr(props.stylesCommon).map(relativePath => pathJoin(url.resourcesCommonPath, relativePath)),
                    ...toArr(props.styles).map(relativePath => pathJoin(url.resourcesPath, relativePath))
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
                    "src": pathJoin(url.resourcesPath, relativePath)
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

    const { classNames } = useClassNames({});

    const { domRect: { width: rootWidth }, ref: rootRef } = useDomRect();

    const logoMaxWidth = Math.floor(rootWidth * logoMaxWidthInPercent / 100);

    const onHeaderClick = useConstCallback(
        (target: Parameters<HeaderProps["onClick"]>[0]) => {
            switch (target) {
                case "logo": routes.home().push(); return;
                case "auth button": assert(false);
            }
        }
    );

    if (!isExtraCssLoaded) {
        return null;
    }



    return (
        <div ref={rootRef} className={cx(props.kcLoginClass)}>

            <Header
                className={classNames.header}
                logoMaxWidth={logoMaxWidth}
                isUserLoggedIn={false}
                useIsDarkModeEnabled={useIsDarkModeEnabled}
                useIsCloudShellVisible={useIsCloudShellVisible}
                onClick={onHeaderClick}
            />

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
                        {/* App-initiated actions should not see warning messages about the need to complete the action during login. */}
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
});