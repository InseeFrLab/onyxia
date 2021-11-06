import { useMemo, memo, useEffect, useState, Fragment } from "react";
import { Template } from "./Template";
import type { KcProps } from "keycloakify";
import type { KcContextBase, Attribute } from "keycloakify";
import { useKcMessage } from "keycloakify";
import { useCssAndCx } from "tss-react";
import type { ReactComponent } from "keycloakify/lib/tools/ReactComponent";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { useFormValidationSlice } from "keycloakify";
import { useTranslation } from "app/i18n/useTranslations";
import { Button, makeStyles } from "app/theme";
import { useConstCallback } from "powerhooks/useConstCallback";
import { Tooltip } from "onyxia-ui/Tooltip";
import { TextField } from "onyxia-ui/TextField";
import type { Param0 } from "tsafe";
import type { TextFieldProps } from "onyxia-ui/TextField";
import { capitalize } from "tsafe/capitalize";
import { generateUsername } from "./generateUsername";

export const RegisterUserProfile = memo(
    ({
        kcContext,
        ...props_
    }: { kcContext: KcContextBase.RegisterUserProfile } & KcProps) => {
        const { url, messagesPerField, recaptchaRequired, recaptchaSiteKey } = kcContext;

        const { msg, msgStr } = useKcMessage();

        const { classes, cx, css } = useStyles();

        const props = useMemo(
            () => ({
                ...props_,
                "kcFormGroupClass": cx(
                    props_.kcFormGroupClass,
                    css({ "marginBottom": 20 }),
                ),
            }),
            [cx, css],
        );

        const [isFomSubmittable, setIsFomSubmittable] = useState(false);

        const { t } = useTranslation("Register");

        const redirectToLogin = useConstCallback(
            () => (window.location.href = url.loginUrl),
        );

        return (
            <Template
                {...{ kcContext, ...props }}
                displayMessage={messagesPerField.exists("global")}
                displayRequiredFields={false}
                doFetchDefaultThemeResources={false}
                headerNode={msg("registerTitle")}
                formNode={
                    <form
                        className={classes.root}
                        action={url.registrationAction}
                        method="post"
                    >
                        <UserProfileFormFields
                            kcContext={kcContext}
                            onIsFormSubmittableValueChange={setIsFomSubmittable}
                            {...props}
                        />
                        {recaptchaRequired && (
                            <div className="form-group">
                                <div className={cx(props.kcInputWrapperClass)}>
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
                                onClick={redirectToLogin}
                                tabIndex={-1}
                            >
                                {t("go back")}
                            </Button>
                            {(() => {
                                const button = (
                                    <Button
                                        className={classes.buttonSubmit}
                                        disabled={!isFomSubmittable}
                                        type="submit"
                                        //tabIndex={6} <======== TODO
                                    >
                                        {msgStr("doRegister")}
                                    </Button>
                                );

                                return isFomSubmittable ? (
                                    button
                                ) : (
                                    <Tooltip title={t("form not filled properly yet")}>
                                        <span>{button}</span>
                                    </Tooltip>
                                );
                            })()}
                        </div>
                    </form>
                }
            />
        );
    },
);

type UserProfileFormFieldsProps = {
    kcContext: KcContextBase.RegisterUserProfile;
} & KcProps &
    Partial<
        Record<"BeforeField" | "AfterField", ReactComponent<{ attribute: Attribute }>>
    > & {
        onIsFormSubmittableValueChange: (isFormSubmittable: boolean) => void;
    };

const UserProfileFormFields = memo(
    ({
        kcContext,
        onIsFormSubmittableValueChange,
        ...props
    }: UserProfileFormFieldsProps) => {
        const { cx } = useCssAndCx();

        const { advancedMsg } = useKcMessage();

        const { t } = useTranslation("Register");

        const passwordValidators = useMemo(
            () => ({
                "_compareToOther": {
                    "error-message": t("must be different from username"),
                    "ignore.empty.value": true,
                    "name": "username",
                    "shouldBe": "different" as const,
                },
                "length": {
                    "min": "12" as const,
                    "ignore.empty.value": true,
                },
            }),
            [t],
        );

        const {
            formValidationState: { fieldStateByAttributeName, isFormSubmittable },
            formValidationReducer,
            attributesWithPassword: unorderedAttributesWithPassword,
        } = useFormValidationSlice({
            kcContext,
            passwordValidators,
        });

        const attributesWithPassword = useMemo(
            () =>
                unorderedAttributesWithPassword.sort(
                    (a, b) =>
                        getHardCodedFieldWeight(b.name) - getHardCodedFieldWeight(a.name),
                ),
            [unorderedAttributesWithPassword],
        );

        useEffect(() => {
            onIsFormSubmittableValueChange(isFormSubmittable);
        }, [isFormSubmittable]);

        const onChangeFactory = useCallbackFactory(
            (
                [name]: [string],
                [{ value }]: [Param0<TextFieldProps["onValueBeingTypedChange"]>],
            ) =>
                formValidationReducer({
                    "action": "update value",
                    name,
                    "newValue": value,
                }),
        );

        const onBlurFactory = useCallbackFactory(([name]: [string]) =>
            formValidationReducer({
                "action": "focus lost",
                name,
            }),
        );

        useEffect(() => {
            attributesWithPassword
                .filter(
                    ({ name }) =>
                        !["email", "password", "password-confirm"].includes(name),
                )
                .map(({ name }) =>
                    formValidationReducer({
                        "action": "focus lost",
                        name,
                    }),
                );
        }, []);

        const areAllFieldsRequired = useMemo(
            () => attributesWithPassword.every(({ required }) => required),
            [attributesWithPassword],
        );

        {
            const firstName = fieldStateByAttributeName["firstName"]?.value ?? "";
            const lastName = fieldStateByAttributeName["lastName"]?.value ?? "";

            useEffect(() => {
                if (firstName === "") {
                    return;
                }

                formValidationReducer({
                    "action": "update value",
                    "name": "username",
                    "newValue": generateUsername({ firstName, lastName }),
                });
            }, [firstName, lastName]);
        }

        let currentGroup = "";

        return (
            <>
                {attributesWithPassword.map((attribute, i) => {
                    const {
                        group = "",
                        groupDisplayHeader = "",
                        groupDisplayDescription = "",
                    } = attribute;

                    const { value, displayableErrors } =
                        fieldStateByAttributeName[attribute.name];

                    const formGroupClassName = cx(
                        props.kcFormGroupClass,
                        displayableErrors.length !== 0 && props.kcFormGroupErrorClass,
                    );

                    return (
                        <Fragment key={i}>
                            {group !== currentGroup && (currentGroup = group) !== "" && (
                                <div className={formGroupClassName}>
                                    <div className={cx(props.kcContentWrapperClass)}>
                                        <label
                                            id={`header-${group}`}
                                            className={cx(props.kcFormGroupHeader)}
                                        >
                                            {advancedMsg(groupDisplayHeader) ||
                                                currentGroup}
                                        </label>
                                    </div>
                                    {groupDisplayDescription !== "" && (
                                        <div className={cx(props.kcLabelWrapperClass)}>
                                            <label
                                                id={`description-${group}`}
                                                className={`${cx(props.kcLabelClass)}`}
                                            >
                                                {advancedMsg(groupDisplayDescription)}
                                            </label>
                                        </div>
                                    )}
                                </div>
                            )}
                            <TextField
                                type={(() => {
                                    switch (attribute.name) {
                                        case "password-confirm":
                                        case "password":
                                            return "password";
                                        default:
                                            return "text";
                                    }
                                })()}
                                id={attribute.name}
                                name={attribute.name}
                                defaultValue={value}
                                className={cx(props.kcInputClass)}
                                aria-invalid={displayableErrors.length !== 0}
                                disabled={attribute.readOnly}
                                autoComplete={attribute.autocomplete}
                                onBlur={onBlurFactory(attribute.name)}
                                inputProps_aria-label={attribute.name}
                                inputProps_tabIndex={
                                    attribute.name === "username" ? -1 : i + 1
                                }
                                onValueBeingTypedChange={onChangeFactory(attribute.name)}
                                inputProps_autoFocus={i === 0}
                                inputProps_spellCheck={false}
                                transformValueBeingTyped={(() => {
                                    switch (attribute.name) {
                                        case "firstName":
                                        case "lastName":
                                            return capitalize;
                                        default:
                                            return undefined;
                                    }
                                })()}
                                label={
                                    <>
                                        {advancedMsg(attribute.displayName ?? "")}
                                        &nbsp;
                                        {!areAllFieldsRequired &&
                                            attribute.required &&
                                            "*"}
                                    </>
                                }
                                helperText={(() => {
                                    const displayableErrors = fieldStateByAttributeName[
                                        attribute.name
                                    ].displayableErrors.filter(
                                        ({ validatorName }) =>
                                            !(
                                                validatorName === "pattern" &&
                                                attribute.name === "email"
                                            ),
                                    );

                                    if (displayableErrors.length !== 0) {
                                        return displayableErrors.map(
                                            ({ errorMessage }, i) => (
                                                <span key={i}>{errorMessage}</span>
                                            ),
                                        );
                                    }

                                    switch (attribute.name) {
                                        case "email":
                                            return t("allowed email domains");
                                        case "password": {
                                            const { min } =
                                                attribute.validators.length ?? {};
                                            if (min === undefined) {
                                                break;
                                            }

                                            return t("minimum length", {
                                                "n": `${parseInt(min)}`,
                                            });
                                        }
                                    }

                                    {
                                        const { pattern } = attribute.validators;

                                        if (pattern !== undefined) {
                                            return pattern.pattern;
                                        }
                                    }

                                    return undefined;
                                })()}
                                questionMarkHelperText={
                                    attribute.validators.pattern?.pattern
                                }
                                inputProps_aria-invalid={
                                    fieldStateByAttributeName[attribute.name]
                                        .displayableErrors.length !== 0
                                }
                            />
                        </Fragment>
                    );
                })}
            </>
        );
    },
);

const { getHardCodedFieldWeight } = (() => {
    const orderedFields = [
        "firstName",
        "lastName",
        "email",
        "username",
        "password",
        "password-confirm",
    ].map(fieldName => fieldName.toLowerCase());

    function getHardCodedFieldWeight(fieldName: string) {
        console.log(fieldName);

        const weight = (() => {
            for (let i = 0; i < orderedFields.length; i++) {
                if (fieldName.toLowerCase().includes(orderedFields[i])) {
                    return orderedFields.length - i;
                }
            }

            return 0;
        })();

        console.log(weight);

        return weight;
    }

    return { getHardCodedFieldWeight };
})();

const useStyles = makeStyles()(theme => ({
    "root": {
        "& .MuiTextField-root": {
            "width": "100%",
            "marginTop": theme.spacing(6),
        },
    },
    "buttonsWrapper": {
        "marginTop": theme.spacing(8),
        "display": "flex",
        "justifyContent": "flex-end",
    },
    "buttonSubmit": {
        "marginLeft": theme.spacing(2),
    },
}));
