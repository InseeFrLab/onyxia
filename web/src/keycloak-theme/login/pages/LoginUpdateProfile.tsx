import { useState } from "react";
import type { PageProps } from "keycloakify/login/pages/PageProps";
import { useGetClassName } from "keycloakify/login/lib/useGetClassName";
import { useStyles } from "tss";
import type { KcContext } from "../kcContext";
import type { I18n } from "../i18n";

export default function LoginUpdateProfile(
    props: PageProps<Extract<KcContext, { pageId: "login-update-profile.ftl" }>, I18n>
) {
    const { kcContext, i18n, doUseDefaultCss, Template, classes } = props;

    const { url, user, messagesPerField, isAppInitiatedAction } = kcContext;

    const { getClassName } = useGetClassName({
        doUseDefaultCss,
        classes
    });

    const { msg, msgStr } = i18n;

    const { cx } = useStyles();

    const [username, setUsername] = useState(
        generateUsername({
            "firstName": user.firstName ?? "",
            "lastName": user.lastName ?? ""
        })
    );

    return (
        <Template
            {...{ kcContext, i18n, doUseDefaultCss, classes }}
            headerNode={msg("loginProfileTitle")}
            i18n={i18n}
        >
            <form
                id="kc-update-profile-form"
                className={getClassName("kcFormClass")}
                action={url.loginAction}
                method="post"
            >
                {user.editUsernameAllowed && (
                    <div
                        className={cx(
                            getClassName("kcFormGroupClass"),
                            messagesPerField.printIfExists(
                                "username",
                                getClassName("kcFormGroupErrorClass")
                            )
                        )}
                    >
                        <div className={getClassName("kcLabelWrapperClass")}>
                            <label
                                htmlFor="username"
                                className={getClassName("kcLabelClass")}
                            >
                                {msg("username")}
                            </label>
                        </div>
                        <div className={getClassName("kcInputWrapperClass")}>
                            <input
                                spellCheck={false}
                                type="text"
                                id="username"
                                name="username"
                                value={username}
                                onChange={event =>
                                    setUsername(toAlphaNumerical(event.target.value))
                                }
                                className={getClassName("kcInputClass")}
                            />
                        </div>
                    </div>
                )}

                <div
                    className={cx(
                        getClassName("kcFormGroupClass"),
                        messagesPerField.printIfExists(
                            "email",
                            getClassName("kcFormGroupErrorClass")
                        )
                    )}
                >
                    <div className={getClassName("kcLabelWrapperClass")}>
                        <label htmlFor="email" className={getClassName("kcLabelClass")}>
                            {msg("email")}
                        </label>
                    </div>
                    <div className={getClassName("kcInputWrapperClass")}>
                        <input
                            readOnly
                            type="text"
                            id="email"
                            name="email"
                            defaultValue={user.email ?? ""}
                            className={getClassName("kcInputClass")}
                        />
                    </div>
                </div>

                <div
                    className={cx(
                        getClassName("kcFormGroupClass"),
                        messagesPerField.printIfExists(
                            "firstName",
                            getClassName("kcFormGroupErrorClass")
                        )
                    )}
                >
                    <div className={getClassName("kcLabelWrapperClass")}>
                        <label
                            htmlFor="firstName"
                            className={getClassName("kcLabelClass")}
                        >
                            {msg("firstName")}
                        </label>
                    </div>
                    <div className={getClassName("kcInputWrapperClass")}>
                        <input
                            readOnly
                            type="text"
                            id="firstName"
                            name="firstName"
                            defaultValue={user.firstName ?? ""}
                            className={getClassName("kcInputClass")}
                        />
                    </div>
                </div>

                <div
                    className={cx(
                        getClassName("kcFormGroupClass"),
                        messagesPerField.printIfExists(
                            "lastName",
                            getClassName("kcFormGroupErrorClass")
                        )
                    )}
                >
                    <div className={getClassName("kcLabelWrapperClass")}>
                        <label
                            htmlFor="lastName"
                            className={getClassName("kcLabelClass")}
                        >
                            {msg("lastName")}
                        </label>
                    </div>
                    <div className={getClassName("kcInputWrapperClass")}>
                        <input
                            readOnly
                            type="text"
                            id="lastName"
                            name="lastName"
                            defaultValue={user.lastName ?? ""}
                            className={getClassName("kcInputClass")}
                        />
                    </div>
                </div>

                <div className={getClassName("kcFormGroupClass")}>
                    <div
                        id="kc-form-options"
                        className={getClassName("kcFormOptionsClass")}
                    >
                        <div className={getClassName("kcFormOptionsWrapperClass")} />
                    </div>

                    <div
                        id="kc-form-buttons"
                        className={getClassName("kcFormButtonsClass")}
                    >
                        {isAppInitiatedAction ? (
                            <>
                                <input
                                    className={cx(
                                        getClassName("kcButtonClass"),
                                        getClassName("kcButtonPrimaryClass"),
                                        getClassName("kcButtonLargeClass")
                                    )}
                                    type="submit"
                                    defaultValue={msgStr("doSubmit")}
                                />
                                <button
                                    className={cx(
                                        getClassName("kcButtonClass"),
                                        getClassName("kcButtonDefaultClass"),
                                        getClassName("kcButtonLargeClass")
                                    )}
                                    type="submit"
                                    name="cancel-aia"
                                    value="true"
                                >
                                    {msg("doCancel")}
                                </button>
                            </>
                        ) : (
                            <input
                                className={cx(
                                    getClassName("kcButtonClass"),
                                    getClassName("kcButtonPrimaryClass"),
                                    getClassName("kcButtonBlockClass"),
                                    getClassName("kcButtonLargeClass")
                                )}
                                type="submit"
                                defaultValue={msgStr("doSubmit")}
                            />
                        )}
                    </div>
                </div>
            </form>
        </Template>
    );
}

function toAlphaNumerical(value: string) {
    return value.replace(/[^a-zA-Z0-9]/g, "x");
}

function generateUsername(params: { firstName: string; lastName: string }) {
    const { firstName, lastName } = params;

    return toAlphaNumerical(`${firstName[0] ?? ""}${lastName}`).toLowerCase();
}
