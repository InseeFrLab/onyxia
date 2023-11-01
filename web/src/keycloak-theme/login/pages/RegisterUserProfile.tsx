import { useState } from "react";
import { UserProfileFormFields } from "./shared/UserProfileFormFields";
import type { PageProps } from "keycloakify/login/pages/PageProps";
import { useGetClassName } from "keycloakify/login/lib/useGetClassName";
import type { KcContext } from "../kcContext";
import type { I18n } from "../i18n";
import { tss } from "keycloak-theme/login/theme";
import { Button } from "onyxia-ui/Button";
import { Tooltip } from "onyxia-ui/Tooltip";

export default function RegisterUserProfile(
    props: PageProps<Extract<KcContext, { pageId: "register-user-profile.ftl" }>, I18n>
) {
    const { kcContext, i18n, doUseDefaultCss, Template, classes: classes_props } = props;

    const { classes, cx, css } = useStyles();

    const { getClassName } = useGetClassName({
        doUseDefaultCss,
        "classes": {
            ...classes_props,
            "kcFormGroupClass": cx(
                classes_props?.kcFormGroupClass,
                css({ "marginBottom": 20 })
            )
        }
    });

    const { url, messagesPerField, recaptchaRequired, recaptchaSiteKey } = kcContext;

    const { msg, msgStr } = i18n;

    const [isFormSubmittable, setIsFormSubmittable] = useState(false);

    const getIncrementedTabIndex = (() => {
        let counter = 1;
        return () => counter++;
    })();

    return (
        <Template
            {...{ kcContext, i18n, doUseDefaultCss }}
            classes={classes_props}
            displayMessage={messagesPerField.exists("global")}
            displayRequiredFields={false}
            headerNode={msg("registerTitle")}
        >
            <form className={classes.root} action={url.registrationAction} method="post">
                <UserProfileFormFields
                    kcContext={kcContext}
                    onIsFormSubmittableValueChange={setIsFormSubmittable}
                    i18n={i18n}
                    getClassName={getClassName}
                    getIncrementedTabIndex={getIncrementedTabIndex}
                />
                {recaptchaRequired && (
                    <div className="form-group">
                        <div className={getClassName("kcInputWrapperClass")}>
                            <div
                                className="g-recaptcha"
                                data-size="compact"
                                data-sitekey={recaptchaSiteKey}
                            />
                        </div>
                    </div>
                )}
                <div className={classes.buttonsWrapper}>
                    <Button
                        variant="secondary"
                        onClick={() => global.history.back()}
                        tabIndex={-1}
                    >
                        {msg("go back")}
                    </Button>
                    {(() => {
                        const button = (
                            <Button
                                className={classes.buttonSubmit}
                                disabled={!isFormSubmittable}
                                type="submit"
                                tabIndex={getIncrementedTabIndex()}
                            >
                                {msgStr("doRegister")}
                            </Button>
                        );

                        return isFormSubmittable ? (
                            button
                        ) : (
                            <Tooltip title={msg("form not filled properly yet")}>
                                <span>{button}</span>
                            </Tooltip>
                        );
                    })()}
                </div>
            </form>
        </Template>
    );
}

const useStyles = tss.withName({ RegisterUserProfile }).create(({ theme }) => ({
    "root": {
        "& .MuiTextField-root": {
            "width": "100%",
            "marginTop": theme.spacing(6)
        }
    },
    "buttonsWrapper": {
        "marginTop": theme.spacing(8),
        "display": "flex",
        "justifyContent": "flex-end"
    },
    "buttonSubmit": {
        "marginLeft": theme.spacing(2)
    }
}));
