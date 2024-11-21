import { useState } from "react";
import type { PageProps } from "keycloakify/login/pages/PageProps";
import type { LazyOrNot } from "keycloakify/tools/LazyOrNot";
import { getKcClsx } from "keycloakify/login/lib/kcClsx";
import type { UserProfileFormFieldsProps } from "keycloakify/login/UserProfileFormFieldsProps";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";
import { tss } from "tss";
import { Button } from "onyxia-ui/Button";
import { Tooltip } from "onyxia-ui/Tooltip";

type RegisterProps = PageProps<Extract<KcContext, { pageId: "register.ftl" }>, I18n> & {
    UserProfileFormFields: LazyOrNot<(props: UserProfileFormFieldsProps) => JSX.Element>;
    doMakeUserConfirmPassword: boolean;
};

export default function Register(props: RegisterProps) {
    const {
        kcContext,
        i18n,
        doUseDefaultCss,
        Template,
        classes: classes_props,
        UserProfileFormFields,
        doMakeUserConfirmPassword
    } = props;

    const { classes, cx, css } = useStyles();

    const { kcClsx } = getKcClsx({
        doUseDefaultCss,
        classes: {
            ...classes_props,
            kcFormGroupClass: cx(
                classes_props?.kcFormGroupClass,
                css({ marginBottom: 20 })
            )
        }
    });

    const { url, messagesPerField, recaptchaRequired, recaptchaSiteKey } = kcContext;

    const { msg, msgStr } = i18n;

    const [isFormSubmittable, setIsFormSubmittable] = useState(false);

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
                    kcClsx={kcClsx}
                    doMakeUserConfirmPassword={doMakeUserConfirmPassword}
                />
                {recaptchaRequired && (
                    <div className="form-group">
                        <div className={kcClsx("kcInputWrapperClass")}>
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
                        href={url.loginUrl}
                        doOpenNewTabIfHref={false}
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

const useStyles = tss.withName({ Register }).create(({ theme }) => ({
    root: {
        "& .MuiTextField-root": {
            width: "100%",
            marginTop: theme.spacing(6)
        }
    },
    buttonsWrapper: {
        marginTop: theme.spacing(8),
        display: "flex",
        justifyContent: "flex-end"
    },
    buttonSubmit: {
        marginLeft: theme.spacing(2)
    }
}));
