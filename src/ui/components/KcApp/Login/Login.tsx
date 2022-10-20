import { useState, memo } from "react";
import type { KcProps } from "keycloakify/lib/components/KcProps";
import { useConstCallback } from "powerhooks/useConstCallback";
import { Template } from "../Template";
import { Button } from "ui/theme";
import Link from "@mui/material/Link";
import { makeStyles, Text } from "ui/theme";
import { TextField } from "onyxia-ui/TextField";
import type { TextFieldProps } from "onyxia-ui/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import { Checkbox } from "onyxia-ui/Checkbox";
import { useSplashScreen } from "onyxia-ui";
import { getBrowser } from "ui/tools/getBrowser";
import { useEvt } from "evt/hooks";
import { Evt } from "evt";
import { LoginDivider } from "./LoginDivider";
import { AgentConnectButton } from "./AgentConnectButton";
import { useTranslation } from "ui/i18n";
import type { KcContext } from "../kcContext";
import { useStateRef } from "powerhooks/useStateRef";
import { declareComponentKeys } from "i18nifty";
import type { I18n } from "../i18n";

type KcContext_Login = Extract<KcContext, { pageId: "login.ftl" }>;

const Login = memo(
    ({
        kcContext,
        i18n,
        ...props
    }: { kcContext: KcContext_Login; i18n: I18n } & KcProps) => {
        const { msg, msgStr } = i18n;

        const {
            social,
            realm,
            url,
            usernameEditDisabled,
            login,
            auth,
            registrationDisabled,
        } = kcContext;

        const [isLoginButtonDisabled, setIsLoginButtonDisabled] = useState(false);

        const usernameInputRef = useStateRef<HTMLInputElement>(null);
        const passwordInputRef = useStateRef<HTMLInputElement>(null);
        const submitButtonRef = useStateRef<HTMLButtonElement>(null);

        const [areTextInputsDisabled, setAreTextInputsDisabled] = useState(
            () => getBrowser() === "safari",
        );

        useSplashScreen({
            "onHidden": () => {
                if (!areTextInputsDisabled) {
                    return;
                }
                setAreTextInputsDisabled(false);
                usernameInputRef.current!.focus();
            },
        });

        useEvt(
            ctx => {
                const passwordInput = passwordInputRef.current;

                if (passwordInput === null) {
                    return;
                }

                switch (getBrowser()) {
                    case "chrome":
                    case "safari":
                        Evt.from(ctx, passwordInput, "change").attach(
                            () =>
                                usernameInputRef.current?.matches(":-webkit-autofill") ??
                                false,
                            () => {
                                switch (getBrowser()) {
                                    case "chrome":
                                        //NOTE: Only works after user input
                                        submitButtonRef.current?.focus();
                                        break;
                                    case "safari":
                                        setTimeout(
                                            () => submitButtonRef.current?.focus(),
                                            100,
                                        );
                                        break;
                                }
                            },
                        );
                        break;
                }
            },
            [passwordInputRef.current],
        );

        const onSubmit = useConstCallback(() => {
            setIsLoginButtonDisabled(true);
            return true;
        });

        const { classes } = useStyles();

        const getUsernameIsValidValue = useConstCallback<
            TextFieldProps["getIsValidValue"]
        >(value => {
            if (value.includes(" ")) {
                return {
                    "isValidValue": false,
                    "message": "Can't contain spaces",
                };
            }

            return { "isValidValue": true };
        });

        const getPasswordIsValidValue = useConstCallback<
            TextFieldProps["getIsValidValue"]
        >(value => {
            if (value.includes(" ")) {
                return {
                    "isValidValue": false,
                    "message": "Can't contain spaces",
                };
            }

            return { "isValidValue": true };
        });

        const { t } = useTranslation({ Login });

        return (
            <Template
                {...{ kcContext, ...props }}
                onClickCross={window.history.back.bind(window.history)}
                doFetchDefaultThemeResources={false}
                displayInfo={social.displayInfo}
                displayWide={realm.password && social.providers !== undefined}
                headerNode={msg("doLogIn")}
                i18n={i18n}
                formNode={
                    <div className={classes.root}>
                        {realm.password && social.providers !== undefined && (
                            <>
                                <div>
                                    <ul className={classes.providers}>
                                        {social.providers.map(p => (
                                            <li key={p.providerId}>
                                                {p.displayName
                                                    .toLocaleLowerCase()
                                                    .replace(/ /g, "")
                                                    .includes("agentconnect") ? (
                                                    <AgentConnectButton
                                                        url={p.loginUrl}
                                                    />
                                                ) : (
                                                    <Button href={p.loginUrl}>
                                                        {p.displayName}
                                                    </Button>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <LoginDivider className={classes.divider} />
                            </>
                        )}
                        <div>
                            {realm.password && (
                                <form
                                    onSubmit={onSubmit}
                                    action={url.loginAction}
                                    method="post"
                                >
                                    <div>
                                        <TextField
                                            disabled={
                                                usernameEditDisabled ||
                                                areTextInputsDisabled
                                            }
                                            defaultValue={login.username ?? ""}
                                            id="username"
                                            name="username"
                                            inputProps_ref={usernameInputRef}
                                            inputProps_aria-label="username"
                                            inputProps_tabIndex={1}
                                            inputProps_autoFocus={!areTextInputsDisabled}
                                            inputProps_spellCheck={false}
                                            label={
                                                !realm.loginWithEmailAllowed
                                                    ? msg("username")
                                                    : !realm.registrationEmailAsUsername
                                                    ? msg("usernameOrEmail")
                                                    : msg("email")
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
                                    <div
                                        className={
                                            classes.rememberMeForgotPasswordWrapper
                                        }
                                    >
                                        <div>
                                            {realm.rememberMe && !usernameEditDisabled && (
                                                <div className="checkbox">
                                                    <FormControlLabel
                                                        control={
                                                            <Checkbox
                                                                tabIndex={3}
                                                                defaultChecked={
                                                                    !!login.rememberMe
                                                                }
                                                                name="rememberMe"
                                                                color="primary"
                                                            />
                                                        }
                                                        label={
                                                            <Text typo="body 2">
                                                                {msg("rememberMe")!}
                                                            </Text>
                                                        }
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <div className={classes.forgotPassword}>
                                            {realm.resetPasswordAllowed && (
                                                <Link
                                                    href={url.loginResetCredentialsUrl}
                                                    underline="hover"
                                                >
                                                    {msg("doForgotPassword")}
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                    <div className={classes.buttonsWrapper}>
                                        <input
                                            type="hidden"
                                            name="credentialId"
                                            {...(auth?.selectedCredential !== undefined
                                                ? {
                                                      "value": auth.selectedCredential,
                                                  }
                                                : {})}
                                        />
                                        <Button
                                            ref={submitButtonRef}
                                            tabIndex={3}
                                            className={classes.buttonSubmit}
                                            name="login"
                                            type="submit"
                                            disabled={isLoginButtonDisabled}
                                        >
                                            {msgStr("doLogIn")}
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                }
                infoNode={
                    realm.password &&
                    realm.registrationAllowed &&
                    !registrationDisabled && (
                        <div className={classes.linkToRegisterWrapper}>
                            <Text typo="body 2" color="secondary">
                                {msg("noAccount")!}
                            </Text>
                            <Link
                                href={url.registrationUrl}
                                className={classes.registerLink}
                                underline="hover"
                            >
                                {t("doRegister")}
                            </Link>
                        </div>
                    )
                }
            />
        );
    },
);

export default Login;

export const { i18n } = declareComponentKeys<"doRegister">()({ Login });

const useStyles = makeStyles({ "name": { Login } })(theme => ({
    "root": {
        "& .MuiTextField-root": {
            "width": "100%",
            "marginTop": theme.spacing(5),
        },
    },
    "rememberMeForgotPasswordWrapper": {
        "display": "flex",
        "marginTop": theme.spacing(4),
    },
    "forgotPassword": {
        "flex": 1,
        "display": "flex",
        "justifyContent": "flex-end",
        "alignItems": "center",
    },
    "buttonsWrapper": {
        "marginTop": theme.spacing(4),
        "display": "flex",
        "justifyContent": "flex-end",
    },
    "buttonSubmit": {
        "marginLeft": theme.spacing(2),
    },
    "linkToRegisterWrapper": {
        "marginTop": theme.spacing(5),
        "textAlign": "center",
        "& > *": {
            "display": "inline-block",
        },
    },
    "registerLink": {
        "paddingLeft": theme.spacing(2),
    },
    "divider": {
        ...theme.spacing.topBottom("margin", 5),
    },
    "providers": {
        "listStyleType": "none",
        "padding": 0,
    },
}));
