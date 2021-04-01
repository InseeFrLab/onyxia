
import { useState, useReducer, memo } from "react";
import type { KcProps } from "keycloakify/lib/components/KcProps";
import type { KcContext } from "keycloakify";
import { useKcMessage } from "keycloakify/lib/i18n/useKcMessage";
import { cx } from "tss-react";
import { useConstCallback } from "powerhooks";
import { Template } from "./Template";
import { Button } from "app/components/designSystem/Button";
import Link from "@material-ui/core/Link";
import { Typography } from "app/components/designSystem/Typography";
import { createUseClassNames } from "app/theme/useClassNames";
import { TextField } from "app/components/designSystem/textField/TextField";
import type { TextFieldProps } from "app/components/designSystem/textField/TextField";
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from "@material-ui/core/Checkbox";


const { useClassNames } = createUseClassNames()(
    theme => ({
        "root": {
            "& .MuiTextField-root": {
                "width": "100%",
                "marginTop": theme.spacing(4)
            }
        },
        "rememberMeForgotPasswordWrapper": {
            "display": "flex",
            "marginTop": theme.spacing(3)
        },
        "forgotPassword": {
            "flex": 1,
            "display": "flex",
            "justifyContent": "flex-end",
            "alignItems": "center",
        },
        "buttonsWrapper": {
            "marginTop": theme.spacing(3),
            "display": "flex",
            "justifyContent": "flex-end"
        },
        "buttonSubmit": {
            "marginLeft": theme.spacing(1)
        },
        "linkToRegisterWrapper": {
            "marginTop": theme.spacing(3),
            "textAlign": "center",
            "& > *": {
                "display": "inline-block"
            }
        },
        "registerLink": {
            "paddingLeft": theme.spacing(1)
        }
    })
);

export const Login = memo(({ kcContext, ...props }: { kcContext: KcContext.Login; } & KcProps) => {

    const { msg, msgStr } = useKcMessage();

    const {
        social, realm, url,
        usernameEditDisabled, login,
        auth, registrationDisabled
    } = kcContext;

    const [isLoginButtonDisabled, setIsLoginButtonDisabled] = useState(false);

    const onSubmit = useConstCallback(() => {
        setIsLoginButtonDisabled(true);
        return true;
    });

    const { classNames } = useClassNames({});


    const getUsernameIsValidValue = useConstCallback<NonNullable<TextFieldProps["getIsValidValue"]>>(
        value => {

            if (value.includes(" ")) {
                return { "isValidValue": false, "message": "Can't contain spaces" };
            }

            return { "isValidValue": true };


        }
    );

    const [hasUsernameBlurred, onUsernameBlur] = useReducer(() => true, false);

    const getPasswordIsValidValue = useConstCallback<NonNullable<TextFieldProps["getIsValidValue"]>>(
        value => {

            if (value.includes(" ")) {
                return { "isValidValue": false, "message": "Can't contain spaces" };
            }

            return { "isValidValue": true };

        }
    );

    const [hasPasswordBlurred, onPasswordBlur] = useReducer(() => true, false);

    return (
        <Template
            {...{ kcContext, ...props }}
            displayInfo={social.displayInfo}
            displayWide={realm.password && social.providers !== undefined}
            headerNode={msg("doLogIn")}
            formNode={
                <div
                    id="kc-form"
                    className={cx(realm.password && social.providers !== undefined && props.kcContentWrapperClass, classNames.root)}
                >
                    <div
                        id="kc-form-wrapper"
                        className={cx(realm.password && social.providers && [props.kcFormSocialAccountContentClass, props.kcFormSocialAccountClass])}
                    >
                        {
                            realm.password &&
                            (
                                <form id="kc-form-login" onSubmit={onSubmit} action={url.loginAction} method="post">
                                    <div className={cx(props.kcFormGroupClass)}>
                                        <TextField
                                            defaultValue={login.username ?? ""}
                                            tabIndex={1}
                                            id="username"
                                            name="username"
                                            inputProps={{ "aria-label": "username" }}
                                            label={
                                                !realm.loginWithEmailAllowed ?
                                                    msg("username")
                                                    :
                                                    (
                                                        !realm.registrationEmailAsUsername ?
                                                            msg("usernameOrEmail") :
                                                            msg("email")
                                                    )
                                            }
                                            {...(usernameEditDisabled ? { "disabled": true } : { "autoFocus": true, "autoComplete": "off" })}
                                            getIsValidValue={hasUsernameBlurred ? getUsernameIsValidValue : undefined}
                                            onBlur={onUsernameBlur}
                                        />

                                    </div>
                                    <div className={cx(props.kcFormGroupClass)}>
                                        <TextField
                                            type="password"
                                            defaultValue={""}
                                            tabIndex={2}
                                            id="password"
                                            name="password"
                                            inputProps={{ "aria-label": "password" }}
                                            label={msg("password")}
                                            autoComplete="off"
                                            getIsValidValue={hasPasswordBlurred ? getPasswordIsValidValue : undefined}
                                            onBlur={onPasswordBlur}
                                        />
                                    </div>
                                    <div className={cx(props.kcFormGroupClass, props.kcFormSettingClass, classNames.rememberMeForgotPasswordWrapper)}>
                                        <div id="kc-form-options">
                                            {
                                                (
                                                    realm.rememberMe &&
                                                    !usernameEditDisabled
                                                ) &&
                                                <div className="checkbox">
                                                    <FormControlLabel
                                                        control={
                                                            <Checkbox
                                                                tabIndex={3}
                                                                defaultChecked={true}
                                                                name="rememberMe"
                                                                color="primary"
                                                            />
                                                        }
                                                        label={<Typography variant="body2">{msg("rememberMe")!}</Typography>}
                                                    />

                                                </div>
                                            }
                                        </div>
                                        <div className={cx(props.kcFormOptionsWrapperClass, classNames.forgotPassword)}>
                                            {

                                                realm.resetPasswordAllowed &&
                                                <Link
                                                    tabIndex={5}
                                                    href={url.loginResetCredentialsUrl}
                                                >
                                                    {msg("doForgotPassword")}
                                                </Link>

                                            }
                                        </div>

                                    </div>
                                    <div id="kc-form-buttons" className={cx(props.kcFormGroupClass, classNames.buttonsWrapper)}>
                                        <Button
                                            color="secondary"
                                            onClick={window.history.back.bind(window.history)}
                                        >
                                            {msg("doCancel")}
                                        </Button>
                                        <input
                                            type="hidden"
                                            id="id-hidden-input"
                                            name="credentialId"
                                            {...(auth?.selectedCredential !== undefined ? { "value": auth.selectedCredential } : {})}
                                        />
                                        <Button
                                            tabIndex={4}
                                            className={cx(classNames.buttonSubmit)}
                                            name="login"
                                            id="kc-login"
                                            type="submit"
                                            disabled={isLoginButtonDisabled}
                                        >
                                            {msgStr("doLogIn")}
                                        </Button>


                                    </div>
                                </form>
                            )
                        }
                    </div>
                    {
                        (realm.password && social.providers !== undefined) &&
                        <div id="kc-social-providers" className={cx(props.kcFormSocialAccountContentClass, props.kcFormSocialAccountClass)}>
                            <ul className={cx(props.kcFormSocialAccountListClass, social.providers.length > 4 && props.kcFormSocialAccountDoubleListClass)}>
                                {
                                    social.providers.map(p =>
                                        <li className={cx(props.kcFormSocialAccountListLinkClass)}>
                                            <a href={p.loginUrl} id={`zocial-${p.alias}`} className={cx("zocial", p.providerId)}>
                                                <span>{p.displayName}</span>
                                            </a>
                                        </li>
                                    )
                                }
                            </ul>
                        </div>
                    }
                </div>
            }
            infoNode={
                (
                    realm.password &&
                    realm.registrationAllowed &&
                    !registrationDisabled
                ) &&
                <div className={classNames.linkToRegisterWrapper}>
                    <Typography variant="body2" color="disabled">{msg("noAccount")!}</Typography>
                    <Link 
                    tabIndex={6} 
                    href={url.registrationUrl}
                    className={classNames.registerLink}
                    >
                        {msg("doRegister")}
                    </Link>

                </div>

            }
        />
    );
});
