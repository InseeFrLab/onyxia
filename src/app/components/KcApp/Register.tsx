

import { useState, memo } from "react";
import { Template } from "keycloakify/lib/components/Template";
import type { KcProps } from "keycloakify/lib/components/KcProps";
import type { KcContext } from "keycloakify/lib/KcContext";
import { useKcMessage } from "keycloakify/lib/i18n/useKcMessage";
import { cx } from "tss-react";
import { capitalize } from "powerhooks/tools/capitalize";
import { useEffectOnValueChange } from "powerhooks";


function toAlphaNumerical(value: string){
    return value.replace(/[^a-zA-Z0-9]/g, "x");
}

function buildUsername(
    params: {
        firstName: string;
        lastName: string;
    }
){

    const { firstName, lastName} = params;

    return toAlphaNumerical(`${firstName[0] ?? ""}${lastName}`).toLowerCase();

}

export const Register = memo(({ kcContext, ...props }: { kcContext: KcContext.Register; } & KcProps) => {

    const { msg, msgStr } = useKcMessage();

    const {
        url,
        messagesPerField,
        register,
        realm,
        passwordRequired,
        recaptchaRequired,
        recaptchaSiteKey
    } = kcContext;

    const [firstName, setFirstName] = useState<string>(register.formData.firstName ?? "");
    const [lastName, setLastName] = useState<string>(register.formData.lastName ?? "");
    const [username, setUsername] = useState<string>(register.formData.username ?? "");


    
    useEffectOnValueChange(
        ()=>{ setUsername(buildUsername({ firstName, lastName })); },
        [firstName, lastName]
    );


    


    return (
        <Template
            {...{ kcContext, ...props }}
            headerNode={msg("registerTitle")}
            formNode={
                <form id="kc-register-form" className={cx(props.kcFormClass)} action={url.registrationAction} method="post">

                    <div className={cx(props.kcFormGroupClass, messagesPerField.printIfExists('firstName', props.kcFormGroupErrorClass))}>
                        <div className={cx(props.kcLabelWrapperClass)}>
                            <label htmlFor="firstName" className={cx(props.kcLabelClass)}>{msg("firstName")}</label>
                        </div>
                        <div className={cx(props.kcInputWrapperClass)}>
                            <input type="text" id="firstName" className={cx(props.kcInputClass)} name="firstName" 
                                onChange={e => setFirstName(capitalize(toAlphaNumerical(e.target.value)))}
                                value={firstName}
                            />
                        </div>
                    </div>

                    <div className={cx(props.kcFormGroupClass, messagesPerField.printIfExists("lastName", props.kcFormGroupErrorClass))}>
                        <div className={cx(props.kcLabelWrapperClass)}>
                            <label htmlFor="lastName" className={cx(props.kcLabelClass)}>{msg("lastName")}</label>
                        </div>
                        <div className={cx(props.kcInputWrapperClass)}>
                            <input type="text" id="lastName" className={cx(props.kcInputClass)} name="lastName"
                                onChange={e => setLastName(capitalize(toAlphaNumerical(e.target.value)))}
                                value={lastName}
                            />
                        </div>
                    </div>

                    <div className={cx(props.kcFormGroupClass, messagesPerField.printIfExists('email', props.kcFormGroupErrorClass))}>
                        <div className={cx(props.kcLabelWrapperClass)}>
                            <label htmlFor="email" className={cx(props.kcLabelClass)}>{msg("email")}</label>
                        </div>
                        <div className={cx(props.kcInputWrapperClass)}>
                            <input type="text" id="email" className={cx(props.kcInputClass)} name="email"
                                defaultValue={register.formData.email ?? ""} autoComplete="email"
                            />
                        </div>
                    </div>
                    {
                        !realm.registrationEmailAsUsername &&

                        <div className={cx(props.kcFormGroupClass, messagesPerField.printIfExists('username', props.kcFormGroupErrorClass))}>
                            <div className={cx(props.kcLabelWrapperClass)}>
                                <label htmlFor="username" className={cx(props.kcLabelClass)}>{msg("username")}</label>
                            </div>
                            <div className={cx(props.kcInputWrapperClass)}>
                                <input type="text" id="username" className={cx(props.kcInputClass)} name="username"
                                    onChange={e => setUsername(toAlphaNumerical(e.target.value))}
                                    value={username}
                                    autoComplete="username" 
                                    />
                            </div>
                        </div >

                    }
                    {
                        passwordRequired &&
                        <>

                            <div className={cx(props.kcFormGroupClass, messagesPerField.printIfExists("password", props.kcFormGroupErrorClass))}>
                                <div className={cx(props.kcLabelWrapperClass)}>
                                    <label htmlFor="password" className={cx(props.kcLabelClass)}>{msg("password")}</label>
                                </div>
                                <div className={cx(props.kcInputWrapperClass)}>
                                    <input type="password" id="password" className={cx(props.kcInputClass)} name="password" autoComplete="new-password" />
                                </div>
                            </div>

                            <div className={cx(props.kcFormGroupClass, messagesPerField.printIfExists("password-confirm", props.kcFormGroupErrorClass))}>
                                <div className={cx(props.kcLabelWrapperClass)}>
                                    <label htmlFor="password-confirm" className={cx(props.kcLabelClass)}>{msg("passwordConfirm")}</label>
                                </div>
                                <div className={cx(props.kcInputWrapperClass)}>
                                    <input type="password" id="password-confirm" className={cx(props.kcInputClass)} name="password-confirm" />
                                </div>
                            </div>
                        </>

                    }
                    {
                        recaptchaRequired &&
                        <div className="form-group">
                            <div className={cx(props.kcInputWrapperClass)}>
                                <div className="g-recaptcha" data-size="compact" data-sitekey={recaptchaSiteKey}></div>
                            </div>
                        </div>
                    }
                    <div className={cx(props.kcFormGroupClass)}>
                        <div id="kc-form-options" className={cx(props.kcFormOptionsClass)}>
                            <div className={cx(props.kcFormOptionsWrapperClass)}>
                                <span><a href={url.loginUrl}>{msg("backToLogin")}</a></span>
                            </div>
                        </div>

                        <div id="kc-form-buttons" className={cx(props.kcFormButtonsClass)}>
                            <input className={cx(props.kcButtonClass, props.kcButtonPrimaryClass, props.kcButtonBlockClass, props.kcButtonLargeClass)} type="submit"
                                value={msgStr("doRegister")} />
                        </div>
                    </div>
                </form >
            }
        />
    );
});