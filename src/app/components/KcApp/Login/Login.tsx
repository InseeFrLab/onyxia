
import { useState, useRef, useEffect, memo } from "react";
import type { KcProps } from "keycloakify/lib/components/KcProps";
import { useKcMessage } from "keycloakify/lib/i18n/useKcMessage";
import { useConstCallback } from "powerhooks";
import { Template } from "../Template";
import { Button } from "app/theme";
import Link from "@material-ui/core/Link";
import { Typography } from "onyxia-ui";
import { createUseClassNames } from "app/theme";
import { TextField } from "onyxia-ui";
import type { TextFieldProps } from "onyxia-ui";
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from "@material-ui/core/Checkbox";
import { useSplashScreen } from "onyxia-ui";
import { getBrowser } from "app/tools/getBrowser";
import { useEvt } from "evt/hooks";
import { Evt } from "evt";
import { LoginDivider } from "./LoginDivider";
import { AgentConnectButton } from "./AgentConnectButton";
import { useTranslation } from "app/i18n/useTranslations";
import type { KcContext } from "../kcContext";

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
            "marginTop": theme.spacing(4),
            "textAlign": "center",
            "& > *": {
                "display": "inline-block"
            }
        },
        "registerLink": {
            "paddingLeft": theme.spacing(1)
        },
        "divider": {
            "margin": theme.spacing(4, 0)
        },
        "providers": {
            "listStyleType": "none",
            "padding": 0
        }
    })
);

type KcContext_Login = Extract<KcContext, { pageId: "login.ftl"; }>;

export const Login = memo(({ kcContext, ...props }: { kcContext: KcContext_Login; } & KcProps) => {

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


    const getPasswordIsValidValue = useConstCallback<TextFieldProps["getIsValidValue"]>(
        value => {

            if (value.includes(" ")) {
                return { "isValidValue": false, "message": "Can't contain spaces" };
            }

            return { "isValidValue": true };

        }
    );


    const { t } = useTranslation("Login");

    return (
        <Template
            {...{ kcContext, ...props }}
            onClickCross={window.history.back.bind(window.history)}
            doFetchDefaultThemeResources={false}
            displayInfo={social.displayInfo}
            displayWide={realm.password && social.providers !== undefined}
            headerNode={msg("doLogIn")}
            formNode={
                <div className={classNames.root} >
                    {
                        (realm.password && social.providers !== undefined) &&
                        <>
                            <div>
                                <ul className={classNames.providers}>
                                    {
                                        social.providers.map(p =>
                                            <li key={p.providerId}>
                                                {
                                                    p.displayName.toLocaleLowerCase().replace(/ /g, "").includes("agentconnect") ?
                                                        <AgentConnectButton url={p.loginUrl} /> :
                                                        <Button href={p.loginUrl}>{p.displayName}</Button>
                                                }
                                            </li>
                                        )
                                    }
                                </ul>
                            </div>
                            <LoginDivider className={classNames.divider}/>
                        </>
                    }
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
                                            inputProps_ref={usernameInputRef}
                                            inputProps_aria-label="username"
                                            inputProps_tabIndex={1}
                                            inputProps_autoFocus={!areTextInputsDisabled}
                                            inputProps_spellCheck={false}
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
                                            getIsValidValue={getUsernameIsValidValue}
                                        />

                                    </div>
                                    <div>
                                        <TextField
                                            disabled={areTextInputsDisabled}
                                            type="password"
                                            defaultValue={""}
                                            id="password"
                                            name="password"
                                            inputProps_ref={passwordInputRef}
                                            inputProps_aria-label={"password"}
                                            inputProps_tabIndex={2}
                                            label={msg("password")}
                                            autoComplete="off"
                                            getIsValidValue={getPasswordIsValidValue}
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
                                        <input
                                            type="hidden"
                                            name="credentialId"
                                            {...(auth?.selectedCredential !== undefined ? { "value": auth.selectedCredential } : {})}
                                        />
                                        <Button
                                            ref={submitButtonRef}
                                            tabIndex={3}
                                            className={classNames.buttonSubmit}
                                            name="login"
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
                </div>
            }
            infoNode={
                (
                    realm.password &&
                    realm.registrationAllowed &&
                    !registrationDisabled
                ) &&
                <div className={classNames.linkToRegisterWrapper}>
                    <Typography variant="body2" color="secondary">{msg("noAccount")!}</Typography>
                    <Link
                        href={url.registrationUrl}
                        className={classNames.registerLink}
                    >
                        {t("doRegister")}
                    </Link>

                </div>

            }
        />
    );
});


export declare namespace Login {

    export type I18nScheme = {
        'doRegister': undefined;
    };

}

