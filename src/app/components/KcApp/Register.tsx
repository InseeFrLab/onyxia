

import { useState, useMemo, memo } from "react";
import { Template } from "./Template";
import type { KcProps } from "keycloakify/lib/components/KcProps";
import type { KcContext } from "keycloakify/lib/KcContext";
import { useKcMessage } from "keycloakify/lib/i18n/useKcMessage";
import { cx } from "tss-react";
import { TextField } from "app/components/designSystem/TextField";
import type { TextFieldProps } from "app/components/designSystem/TextField";
import { useTranslation } from "app/i18n/useTranslations";
import { useCallbackFactory } from "powerhooks";
import { emailRegExp } from "app/tools/emailRegExp";
import type { Params } from "evt/tools/typeSafety";
import { Button } from "app/components/designSystem/Button";
import { createUseClassNames } from "app/theme/useClassNames";
import { useConstCallback } from "powerhooks";
import { capitalize } from "app/tools/capitalize";


const allowedEmailDomains = ["insee.fr", "gouv.fr"];
const allowedEmailDomainsStr = allowedEmailDomains.map(domain => `@${domain}`).join(", ");
//NOTE: Client side validation only the actual policy is set on the Keycloak server.
const passwordMinLength = 12

function toAlphaNumerical(value: string) {
    return value.replace(/[^a-zA-Z0-9]/g, "x");
}

const { useClassNames } = createUseClassNames()(
    theme => ({
        "root": {
            "& .MuiTextField-root": {
                "width": "100%",
                "marginTop": theme.spacing(5)
            }
        },
        "buttonsWrapper": {
            "marginTop": theme.spacing(7),
            "display": "flex",
            "justifyContent": "flex-end"
        },
        "buttonSubmit": {
            "marginLeft": theme.spacing(1)
        }
    })
);


export const Register = memo(({ kcContext, ...props }: { kcContext: KcContext.Register; } & KcProps) => {

    const { msg, msgStr } = useKcMessage();

    const {
        url,
        register,
        realm,
        passwordRequired,
        recaptchaRequired,
        recaptchaSiteKey
    } = kcContext;

    const [firstName, setFirstName] = useState(register.formData.firstName ?? "");
    const [lastName, setLastName] = useState(register.formData.lastName ?? "");

    const usernameDefaultValue = useMemo(
        () => toAlphaNumerical(`${firstName[0] ?? ""}${lastName}`).toLowerCase(),
        [firstName, lastName]
    );

    const [username, setUsername] = useState(usernameDefaultValue);
    const [password, setPassword] = useState("");

    const { t } = useTranslation("Register");

    const getIsValidValueFactory = useCallbackFactory(
        (
            [target]: ["firstName" | "lastName" | "email" | "username" | "password" | "passwordConfirm"],
            [value]: [string]
        ) => {

            if (value === "") {
                return {
                    "isValidValue": false,
                    "message": t("required field")
                };
            }

            switch (target) {
                case "firstName":
                case "lastName":
                    if (!/^[\p{L} ,.'-]+$/u.test(value)) {
                        return {
                            "isValidValue": false,
                            "message": t("not a valid", { "what": msgStr(target) })
                        };
                    }
                    break;
                case "email":
                    if (!emailRegExp.test(value)) {
                        return {
                            "isValidValue": false,
                            "message": t("not a valid", { "what": msgStr(target) })
                        };
                    }
                    if (!allowedEmailDomains.includes(value.split("@")[1].toLowerCase())) {
                        return {
                            "isValidValue": false,
                            "message": ""
                        };
                    }
                    break;
                case "username":
                    if (!/[a-zA-Z0-9]+/.test(value)) {
                        return {
                            "isValidValue": false,
                            "message": ""
                        };
                    }
                    break;
                case "password":
                    if (value.length < passwordMinLength) {
                        return {
                            "isValidValue": false,
                            "message": ""
                        };
                    }
                    if (value === username) {
                        return {
                            "isValidValue": false,
                            "message": t("must be different from username")
                        };
                    }
                    break;
                case "passwordConfirm":
                    if (password !== value) {
                        return {
                            "isValidValue": false,
                            "message": t("password mismatch")
                        };
                    }
                    break;
            }

            return { "isValidValue": true } as const;

        }
    );

    const onValueBeingTypedChangeFactory = useCallbackFactory(
        (
            [target]: ["firstName" | "lastName" | "email" | "username" | "password" | "passwordConfirm"],
            [params]: [Params<TextFieldProps["onValueBeingTypedChange"]>]
        ) => {
            const { value } = params;
            switch (target) {
                case "firstName": setFirstName(value); break;
                case "lastName": setLastName(value); break;
                case "username": setUsername(value); break;
                case "password": setPassword(value); break;
            }
        }
    );

    const redirectToLogin = useConstCallback(() => window.location.href = url.loginUrl);

    const { classNames } = useClassNames({});

    return (
        <Template
            {...{ kcContext, ...props }}
            headerNode={msg("registerTitle")}
            formNode={
                <form className={classNames.root} action={url.registrationAction} method="post">

                    <>
                        {
                            (["firstName", "lastName", "email", "username", "password", "passwordConfirm"] as const).map(
                                (target, i) =>
                                    (
                                        target === "firstName" ||
                                        target === "lastName" ||
                                        target === "email" ||
                                        (target === "username" && !realm.registrationEmailAsUsername) ||
                                        ((target === "password" || target === "passwordConfirm") && passwordRequired)
                                    ) &&
                                    <div key={i}>
                                        <TextField
                                            name={target}
                                            type={(() => {
                                                switch (target) {
                                                    case "email": return "email";
                                                    case "password":
                                                    case "passwordConfirm":
                                                        return "password";
                                                    default: return "text";
                                                }
                                            })()}
                                            inputProps_aria-label={target}
                                            inputProps_tabIndex={target === "username" ? -1 : i + 1}
                                            inputProps_autoFocus={i === 0}
                                            inputProps_spellCheck={false}
                                            transformValueBeingTyped={
                                                (() => {
                                                    switch (target) {
                                                        case "firstName":
                                                        case "lastName":
                                                            return capitalize;
                                                        default: return undefined;
                                                    }
                                                })()
                                            }
                                            label={msg(target)}
                                            onValueBeingTypedChange={onValueBeingTypedChangeFactory(target)}
                                            helperText={
                                                (() => {
                                                    switch (target) {
                                                        case "email": return t("allowed email domain", { "list": allowedEmailDomainsStr })
                                                        case "username": return t("alphanumerical chars only")
                                                        case "password": return t("minimum length", { "n": `${passwordMinLength}` })
                                                        default: return undefined;
                                                    }
                                                })()
                                            }
                                            defaultValue={target !== "username" ? "" : usernameDefaultValue}
                                            getIsValidValue={getIsValidValueFactory(target)}
                                        />
                                    </div>
                            )
                        }
                    </>
                    {
                        recaptchaRequired &&
                        <div className="form-group">
                            <div className={cx(props.kcInputWrapperClass)}>
                                <div className="g-recaptcha" data-size="compact" data-sitekey={recaptchaSiteKey}></div>
                            </div>
                        </div>
                    }
                    <div className={classNames.buttonsWrapper}>
                        <Button
                            color="secondary"
                            onClick={redirectToLogin}
                        >
                            {t("go back")}
                        </Button>
                        <Button
                            className={cx(classNames.buttonSubmit)}
                            name="login"
                            type="submit"
                        >
                            {msgStr("doRegister")}
                        </Button>
                    </div>
                </form>
            }
        />
    );
});

export declare namespace Register {

    export type I18nScheme = {
        'required field': undefined;
        'not a valid': { what: string; };
        'allowed email domain': { list: string; };
        'alphanumerical chars only': undefined;
        'minimum length': { n: string; };
        'must be different from username': undefined;
        'password mismatch': undefined;
        'go back': undefined;
    };

}