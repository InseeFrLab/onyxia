
import { useState, useReducer, useRef, useEffect, memo } from "react";
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
import { useSplashScreen } from "app/components/shared/SplashScreen";
import { getBrowser } from "app/tools/getBrowser";
import { useEvt } from "evt/hooks";
import { Evt } from "evt";

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

    const usernameInputRef = useRef<HTMLInputElement>(null);
    const passwordInputRef = useRef<HTMLInputElement>(null);
    const submitButtonRef = useRef<HTMLButtonElement>(null);

    const [areTextInputsDisabled, setAreTextInputsDisabled] = useState(
        () => getBrowser() === "safari" 
    );

    useSplashScreen({
        "onHidden": () => {

            if (!areTextInputsDisabled) {
                return;
            }
            setAreTextInputsDisabled(false);
            usernameInputRef.current!.focus();

        }
    });

    //TODO: Export useEvtFromElement to evt
    {

        const [passwordInput, setPasswordInput] = useState<HTMLInputElement | null>(null);

        useEffect(
            () => { setPasswordInput(passwordInputRef.current); },
            // eslint-disable-next-line react-hooks/exhaustive-deps
            [passwordInputRef.current ?? {}]
        );

        useEvt(
            ctx => {

                if (passwordInput === null) {
                    return;
                }

                switch (getBrowser()) {
                    case "chrome":
                    case "safari":
                        Evt.from(ctx, passwordInput, "change")
                            .attach(
                                () => usernameInputRef.current?.matches(":-webkit-autofill") ?? false,
                                () => {
                                    switch (getBrowser()) {
                                        case "chrome":
                                            //NOTE: Only works after user input
                                            submitButtonRef.current?.focus();
                                            break;
                                        case "safari":
                                            setTimeout(() => submitButtonRef.current?.focus(), 100);
                                            break;
                                    }

                                }
                            );
                        break;
                }

            },
            [passwordInput]
        );


    }


    const onSubmit = useConstCallback(() => {
        setIsLoginButtonDisabled(true);
        return true;
    });

    const { classNames } = useClassNames({});


    const getUsernameIsValidValue = useConstCallback<TextFieldProps["getIsValidValue"]>(
        value => {

            if (value.includes(" ")) {
                return { "isValidValue": false, "message": "Can't contain spaces" };
            }

            return { "isValidValue": true };

        }
    );

    const [hasUsernameBlurred, onUsernameBlur] = useReducer(() => true, false);

    const getPasswordIsValidValue = useConstCallback<TextFieldProps["getIsValidValue"]>(
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
                <div className={classNames.root} >
                    <div>
                        {
                            realm.password &&
                            (
                                <form onSubmit={onSubmit} action={url.loginAction} method="post">
                                    <div>
                                        <TextField
                                            disabled={usernameEditDisabled || areTextInputsDisabled}
                                            defaultValue={login.username ?? ""}
                                            id="username"
                                            name="username"
                                            inputProps={{
                                                "ref": usernameInputRef,
                                                "aria-label": "username",
                                                "tabIndex": 1,
                                                "autoFocus": !areTextInputsDisabled,
                                                "spellCheck": false
                                            }}
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
                                            autoComplete="off"
                                            getIsValidValue={hasUsernameBlurred ? getUsernameIsValidValue : undefined}
                                            onBlur={onUsernameBlur}
                                        />

                                    </div>
                                    <div>
                                        <TextField
                                            disabled={areTextInputsDisabled}
                                            type="password"
                                            defaultValue={""}
                                            id="password"
                                            name="password"
                                            inputProps={{
                                                "ref": passwordInputRef,
                                                "aria-label": "password",
                                                "tabIndex": 2
                                            }}
                                            label={msg("password")}
                                            autoComplete="off"
                                            getIsValidValue={hasPasswordBlurred ? getPasswordIsValidValue : undefined}
                                            onBlur={onPasswordBlur}
                                        />
                                    </div>
                                    <div className={classNames.rememberMeForgotPasswordWrapper}>
                                        <div>
                                            {
                                                (
                                                    realm.rememberMe &&
                                                    !usernameEditDisabled
                                                ) &&
                                                <div className="checkbox">
                                                    <FormControlLabel
                                                        control={
                                                            <Checkbox
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
                                        <div className={classNames.forgotPassword}>
                                            {

                                                realm.resetPasswordAllowed &&
                                                <Link
                                                    href={url.loginResetCredentialsUrl}
                                                >
                                                    {msg("doForgotPassword")}
                                                </Link>

                                            }
                                        </div>

                                    </div>
                                    <div className={classNames.buttonsWrapper}>
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
                                            ref={submitButtonRef}
                                            tabIndex={3}
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
                        <div>
                            <ul>
                                {
                                    social.providers.map(p =>
                                        <li >
                                            <a href={p.loginUrl}>
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
