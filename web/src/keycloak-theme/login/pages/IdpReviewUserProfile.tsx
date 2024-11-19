import { useState } from "react";
import type { LazyOrNot } from "keycloakify/tools/LazyOrNot";
import { getKcClsx } from "keycloakify/login/lib/kcClsx";
import type { PageProps } from "keycloakify/login/pages/PageProps";
import type { UserProfileFormFieldsProps } from "keycloakify/login/UserProfileFormFieldsProps";
import type { KcContext } from "../KcContext";
import type { I18n } from "../i18n";
import { tss } from "tss";
import { Button } from "onyxia-ui/Button";
import { Tooltip } from "onyxia-ui/Tooltip";

type IdpReviewUserProfileProps = PageProps<
    Extract<KcContext, { pageId: "idp-review-user-profile.ftl" }>,
    I18n
> & {
    UserProfileFormFields: LazyOrNot<(props: UserProfileFormFieldsProps) => JSX.Element>;
    doMakeUserConfirmPassword: boolean;
};

export default function IdpReviewUserProfile(props: IdpReviewUserProfileProps) {
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

    const { msg, msgStr } = i18n;

    const { url, messagesPerField } = kcContext;

    const [isFormSubmittable, setIsFormSubmittable] = useState(false);

    return (
        <Template
            {...{ kcContext, i18n, doUseDefaultCss }}
            classes={classes_props}
            displayMessage={messagesPerField.exists("global")}
            displayRequiredFields={false}
            headerNode={msg("loginIdpReviewProfileTitle")}
        >
            <form className={classes.root} action={url.loginAction} method="post">
                <UserProfileFormFields
                    kcContext={kcContext}
                    i18n={i18n}
                    onIsFormSubmittableValueChange={setIsFormSubmittable}
                    kcClsx={kcClsx}
                    doMakeUserConfirmPassword={doMakeUserConfirmPassword}
                />
                <div className={classes.buttonsWrapper}>
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

const useStyles = tss.withName({ IdpReviewUserProfile }).create(({ theme }) => ({
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
