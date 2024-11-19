import { useEffect, Fragment, useMemo } from "react";
import { assert } from "tsafe/assert";
import { isAmong } from "tsafe/isAmong";
import {
    useUserProfileForm,
    getButtonToDisplayForMultivaluedAttributeField,
    type FormAction,
    type FormFieldError
} from "keycloakify/login/lib/useUserProfileForm";
import type { KcClsx } from "keycloakify/login/lib/kcClsx";
import type { UserProfileFormFieldsProps } from "keycloakify/login/UserProfileFormFieldsProps";
import type { Attribute } from "keycloakify/login/KcContext";
import type { KcContext } from "./KcContext";
import type { I18n } from "./i18n";
import { TextField } from "onyxia-ui/TextField";
import { capitalize } from "tsafe/capitalize";
import { regExpStrToEmailDomains } from "./emailDomainAcceptListHelper";
import { createResolveLocalizedString } from "i18nifty/LocalizedString";
import { createMarkdown } from "onyxia-ui/Markdown";
import { env } from "env";

export default function UserProfileFormFields(
    props: UserProfileFormFieldsProps<KcContext, I18n>
) {
    const {
        kcContext,
        onIsFormSubmittableValueChange,
        doMakeUserConfirmPassword,
        i18n,
        kcClsx,
        BeforeField,
        AfterField
    } = props;

    const { advancedMsg } = i18n;

    const {
        formState: { formFieldStates, isFormSubmittable },
        dispatchFormAction
    } = useUserProfileForm({
        kcContext,
        i18n,
        doMakeUserConfirmPassword
    });

    useEffect(() => {
        onIsFormSubmittableValueChange(isFormSubmittable);
    }, [isFormSubmittable]);

    const groupNameRef = { current: "" };

    const areAllFieldsRequired = useMemo(
        () => formFieldStates.every(({ attribute }) => attribute.required),
        []
    );

    return (
        <>
            {formFieldStates.map(({ attribute, displayableErrors, valueOrValues }, i) => {
                let isUsingCustomInputTag = false;

                return (
                    <Fragment key={attribute.name}>
                        <GroupLabel
                            attribute={attribute}
                            groupNameRef={groupNameRef}
                            i18n={i18n}
                            kcClsx={kcClsx}
                        />
                        {BeforeField !== undefined && (
                            <BeforeField
                                attribute={attribute}
                                dispatchFormAction={dispatchFormAction}
                                displayableErrors={displayableErrors}
                                valueOrValues={valueOrValues}
                                kcClsx={kcClsx}
                                i18n={i18n}
                            />
                        )}

                        <div
                            className={kcClsx("kcFormGroupClass")}
                            style={{
                                display:
                                    attribute.name === "password-confirm" &&
                                    !doMakeUserConfirmPassword
                                        ? "none"
                                        : undefined
                            }}
                        >
                            {(() => {
                                if (
                                    !isAmong(
                                        [
                                            "textarea",
                                            "select",
                                            "multiselect",
                                            "select-radiobuttons",
                                            "multiselect-checkboxes"
                                        ],
                                        attribute.annotations.inputType
                                    ) &&
                                    !(valueOrValues instanceof Array)
                                ) {
                                    return (
                                        <CustomInputTag
                                            attribute={attribute}
                                            valueOrValues={valueOrValues}
                                            displayableErrors={displayableErrors}
                                            formValidationDispatch={dispatchFormAction}
                                            kcClsx={kcClsx}
                                            i18n={i18n}
                                            isFirstField={i === 0}
                                            areAllFieldsRequired={areAllFieldsRequired}
                                        />
                                    );
                                }

                                return (
                                    <>
                                        <div className={kcClsx("kcLabelWrapperClass")}>
                                            <label
                                                htmlFor={attribute.name}
                                                className={kcClsx("kcLabelClass")}
                                            >
                                                {advancedMsg(attribute.displayName ?? "")}
                                            </label>
                                            {attribute.required && <>*</>}
                                        </div>
                                        <div className={kcClsx("kcInputWrapperClass")}>
                                            {attribute.annotations
                                                .inputHelperTextBefore !== undefined && (
                                                <div
                                                    className={kcClsx(
                                                        "kcInputHelperTextBeforeClass"
                                                    )}
                                                    id={`form-help-text-before-${attribute.name}`}
                                                    aria-live="polite"
                                                >
                                                    {advancedMsg(
                                                        attribute.annotations
                                                            .inputHelperTextBefore
                                                    )}
                                                </div>
                                            )}
                                            <InputFiledByType
                                                attribute={attribute}
                                                valueOrValues={valueOrValues}
                                                displayableErrors={displayableErrors}
                                                formValidationDispatch={
                                                    dispatchFormAction
                                                }
                                                kcClsx={kcClsx}
                                                i18n={i18n}
                                            />
                                            {!isUsingCustomInputTag && (
                                                <FieldErrors
                                                    attribute={attribute}
                                                    kcClsx={kcClsx}
                                                    displayableErrors={displayableErrors}
                                                    fieldIndex={undefined}
                                                />
                                            )}
                                            {attribute.annotations
                                                .inputHelperTextAfter !== undefined && (
                                                <div
                                                    className={kcClsx(
                                                        "kcInputHelperTextAfterClass"
                                                    )}
                                                    id={`form-help-text-after-${attribute.name}`}
                                                    aria-live="polite"
                                                >
                                                    {advancedMsg(
                                                        attribute.annotations
                                                            .inputHelperTextAfter
                                                    )}
                                                </div>
                                            )}

                                            {AfterField !== undefined && (
                                                <AfterField
                                                    attribute={attribute}
                                                    dispatchFormAction={
                                                        dispatchFormAction
                                                    }
                                                    displayableErrors={displayableErrors}
                                                    valueOrValues={valueOrValues}
                                                    kcClsx={kcClsx}
                                                    i18n={i18n}
                                                />
                                            )}
                                            {/* NOTE: Downloading of html5DataAnnotations scripts is done in the useUserProfileForm hook */}
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </Fragment>
                );
            })}
        </>
    );
}

function GroupLabel(props: {
    attribute: Attribute;
    kcClsx: KcClsx;
    i18n: I18n;
    groupNameRef: {
        current: string;
    };
}) {
    const { attribute, kcClsx, i18n, groupNameRef } = props;

    const { advancedMsg } = i18n;

    if (attribute.group?.name !== groupNameRef.current) {
        groupNameRef.current = attribute.group?.name ?? "";

        if (groupNameRef.current !== "") {
            assert(attribute.group !== undefined);

            return (
                <div
                    className={kcClsx("kcFormGroupClass")}
                    {...Object.fromEntries(
                        Object.entries(attribute.group.html5DataAnnotations).map(
                            ([key, value]) => [`data-${key}`, value]
                        )
                    )}
                >
                    {(() => {
                        const groupDisplayHeader = attribute.group.displayHeader ?? "";
                        const groupHeaderText =
                            groupDisplayHeader !== ""
                                ? advancedMsg(groupDisplayHeader)
                                : attribute.group.name;

                        return (
                            <div className={kcClsx("kcContentWrapperClass")}>
                                <label
                                    id={`header-${attribute.group.name}`}
                                    className={kcClsx("kcFormGroupHeader")}
                                >
                                    {groupHeaderText}
                                </label>
                            </div>
                        );
                    })()}
                    {(() => {
                        const groupDisplayDescription =
                            attribute.group.displayDescription ?? "";

                        if (groupDisplayDescription !== "") {
                            const groupDescriptionText = advancedMsg(
                                groupDisplayDescription
                            );

                            return (
                                <div className={kcClsx("kcLabelWrapperClass")}>
                                    <label
                                        id={`description-${attribute.group.name}`}
                                        className={kcClsx("kcLabelClass")}
                                    >
                                        {groupDescriptionText}
                                    </label>
                                </div>
                            );
                        }

                        return null;
                    })()}
                </div>
            );
        }
    }

    return null;
}

function FieldErrors(props: {
    attribute: Attribute;
    kcClsx: KcClsx;
    displayableErrors: FormFieldError[];
    fieldIndex: number | undefined;
}) {
    const { attribute, kcClsx, fieldIndex } = props;

    const displayableErrors = props.displayableErrors.filter(
        error => error.fieldIndex === fieldIndex
    );

    if (displayableErrors.length === 0) {
        return null;
    }

    return (
        <span
            id={`input-error-${attribute.name}${fieldIndex === undefined ? "" : `-${fieldIndex}`}`}
            className={kcClsx("kcInputErrorMessageClass")}
            aria-live="polite"
        >
            {displayableErrors
                .filter(error => error.fieldIndex === fieldIndex)
                .map(({ errorMessage }, i, arr) => (
                    <Fragment key={i}>
                        <span key={i}>{errorMessage}</span>
                        {arr.length - 1 !== i && <br />}
                    </Fragment>
                ))}
        </span>
    );
}

type InputFiledByTypeProps = {
    attribute: Attribute;
    valueOrValues: string | string[];
    displayableErrors: FormFieldError[];
    formValidationDispatch: React.Dispatch<FormAction>;
    kcClsx: KcClsx;
    i18n: I18n;
};

function InputFiledByType(props: InputFiledByTypeProps) {
    const { attribute, valueOrValues } = props;

    switch (attribute.annotations.inputType) {
        case "textarea":
            return <TextareaTag {...props} />;
        case "select":
        case "multiselect":
            return <SelectTag {...props} />;
        case "select-radiobuttons":
        case "multiselect-checkboxes":
            return <InputTagSelects {...props} />;
        default: {
            if (valueOrValues instanceof Array) {
                return (
                    <>
                        {valueOrValues.map((...[, i]) => (
                            <InputTag key={i} {...props} fieldIndex={i} />
                        ))}
                    </>
                );
            }

            return <InputTag {...props} fieldIndex={undefined} />;
        }
    }
}

function CustomInputTag(
    props: InputFiledByTypeProps & {
        isFirstField: boolean;
        areAllFieldsRequired: boolean;
    }
) {
    const {
        attribute,
        kcClsx,
        formValidationDispatch,
        valueOrValues,
        i18n,
        displayableErrors: displayableErrors_props,
        isFirstField,
        areAllFieldsRequired
    } = props;

    const { advancedMsg, msg } = i18n;

    assert(typeof valueOrValues === "string");

    const value = valueOrValues;

    return (
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
            inputProps_className={kcClsx("kcInputClass")}
            aria-invalid={displayableErrors_props.length !== 0}
            disabled={attribute.readOnly}
            autoComplete={attribute.autocomplete}
            onBlur={() =>
                formValidationDispatch({
                    action: "focus lost",
                    name: attribute.name,
                    fieldIndex: undefined
                })
            }
            inputProps_aria-label={attribute.name}
            onValueBeingTypedChange={({ value }) =>
                formValidationDispatch({
                    action: "update",
                    name: attribute.name,
                    valueOrValues: value
                })
            }
            inputProps_autoFocus={isFirstField}
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
                    {!areAllFieldsRequired && attribute.required && "*"}
                </>
            }
            helperText={(() => {
                allowed_email_domains: {
                    if (attribute.name !== "email") {
                        break allowed_email_domains;
                    }

                    if (attribute.validators.pattern === undefined) {
                        break allowed_email_domains;
                    }

                    const isErrored = displayableErrors_props.length !== 0;
                    const hasPatternError = displayableErrors_props.some(
                        ({ source }) =>
                            source.type === "validator" && source.name === "pattern"
                    );
                    const hasCustomPatternErrorMessage =
                        attribute.validators.pattern["error-message"] !== undefined;

                    if (isErrored && (!hasPatternError || hasCustomPatternErrorMessage)) {
                        break allowed_email_domains;
                    }

                    if (!env.LIST_ALLOWED_EMAIL_DOMAINS) {
                        return isErrored
                            ? msg("this email domain is not allowed")
                            : undefined;
                    }

                    return msg("allowed email domains");
                }

                username_pattern_message: {
                    if (attribute.name !== "username") {
                        break username_pattern_message;
                    }

                    const isErrored = displayableErrors_props.length !== 0;

                    if (isErrored) {
                        break username_pattern_message;
                    }

                    if (attribute.validators.pattern === undefined) {
                        break username_pattern_message;
                    }

                    const patternErrorMessage =
                        attribute.validators.pattern["error-message"];

                    if (patternErrorMessage === undefined) {
                        break username_pattern_message;
                    }

                    return advancedMsg(patternErrorMessage);
                }

                error_messages_default_behavior: {
                    const isErrored = displayableErrors_props.length !== 0;

                    if (!isErrored) {
                        break error_messages_default_behavior;
                    }

                    return (
                        <>
                            {displayableErrors_props.map(({ errorMessage }, i, arr) => (
                                <Fragment key={i}>
                                    <span key={i}>{errorMessage}</span>
                                    {arr.length - 1 !== i && <br />}
                                </Fragment>
                            ))}
                        </>
                    );
                }

                return undefined;
            })()}
            // prettier-ignore
            questionMarkHelperText={(() => {
                const { pattern } = attribute.validators.pattern ?? {};

                if (pattern === undefined) {
                    return undefined;
                }

                if (attribute.name === "email") {

                    const emailDomainListOrPattern = (() => {
                        try {
                            return regExpStrToEmailDomains(pattern).join(", ");
                        } catch {
                            return pattern;
                        }
                    })();

                    const isErrored = displayableErrors_props.length !== 0;

                    if( !env.LIST_ALLOWED_EMAIL_DOMAINS && !isErrored ){
                        return undefined;
                    }

                    if( env.CONTACT_FOR_ADDING_EMAIL_DOMAIN === undefined && !env.LIST_ALLOWED_EMAIL_DOMAINS ){
                        return undefined;
                    }

                    return (
                        <>
                            {env.CONTACT_FOR_ADDING_EMAIL_DOMAIN !== undefined && (
                                <>
                                    {(() => {

                                        const { resolveLocalizedStringDetailed } = createResolveLocalizedString({
                                            "currentLanguage": i18n.currentLanguage.languageTag,
                                            "fallbackLanguage": "en",
                                            "labelWhenMismatchingLanguage": true
                                        });

                                        const { Markdown } = createMarkdown({
                                            "getLinkProps": ({ href }) => ({
                                                href,
                                                "target": "_blank"
                                            })
                                        });

                                        const { str, langAttrValue } = resolveLocalizedStringDetailed(env.CONTACT_FOR_ADDING_EMAIL_DOMAIN);

                                        return (
                                            <Markdown lang={langAttrValue}>
                                                {str}
                                            </Markdown>
                                        );

                                    })()}
                                </>
                            )}
                            {env.LIST_ALLOWED_EMAIL_DOMAINS && emailDomainListOrPattern}
                        </>
                    );

                }

                return displayableErrors_props.length === 0 ?
                    pattern :
                    undefined;

            })()}
            doOnlyShowErrorAfterFirstFocusLost={false}
            // prettier-ignore
            isErrored={displayableErrors_props.length !== 0}
        />
    );
}

function InputTag(props: InputFiledByTypeProps & { fieldIndex: number | undefined }) {
    const {
        attribute,
        fieldIndex,
        kcClsx,
        formValidationDispatch,
        valueOrValues,
        i18n,
        displayableErrors
    } = props;

    return (
        <>
            <input
                type={(() => {
                    const { inputType } = attribute.annotations;

                    if (inputType?.startsWith("html5-")) {
                        return inputType.slice(6);
                    }

                    return inputType ?? "text";
                })()}
                id={attribute.name}
                name={attribute.name}
                value={(() => {
                    if (fieldIndex !== undefined) {
                        assert(valueOrValues instanceof Array);
                        return valueOrValues[fieldIndex];
                    }

                    assert(typeof valueOrValues === "string");

                    return valueOrValues;
                })()}
                className={kcClsx("kcInputClass")}
                aria-invalid={
                    displayableErrors.find(error => error.fieldIndex === fieldIndex) !==
                    undefined
                }
                disabled={attribute.readOnly}
                autoComplete={attribute.autocomplete}
                placeholder={attribute.annotations.inputTypePlaceholder}
                pattern={attribute.annotations.inputTypePattern}
                size={
                    attribute.annotations.inputTypeSize === undefined
                        ? undefined
                        : parseInt(`${attribute.annotations.inputTypeSize}`)
                }
                maxLength={
                    attribute.annotations.inputTypeMaxlength === undefined
                        ? undefined
                        : parseInt(`${attribute.annotations.inputTypeMaxlength}`)
                }
                minLength={
                    attribute.annotations.inputTypeMinlength === undefined
                        ? undefined
                        : parseInt(`${attribute.annotations.inputTypeMinlength}`)
                }
                max={attribute.annotations.inputTypeMax}
                min={attribute.annotations.inputTypeMin}
                step={attribute.annotations.inputTypeStep}
                {...Object.fromEntries(
                    Object.entries(attribute.html5DataAnnotations ?? {}).map(
                        ([key, value]) => [`data-${key}`, value]
                    )
                )}
                onChange={event =>
                    formValidationDispatch({
                        action: "update",
                        name: attribute.name,
                        valueOrValues: (() => {
                            if (fieldIndex !== undefined) {
                                assert(valueOrValues instanceof Array);

                                return valueOrValues.map((value, i) => {
                                    if (i === fieldIndex) {
                                        return event.target.value;
                                    }

                                    return value;
                                });
                            }

                            return event.target.value;
                        })()
                    })
                }
                onBlur={() =>
                    formValidationDispatch({
                        action: "focus lost",
                        name: attribute.name,
                        fieldIndex: fieldIndex
                    })
                }
            />
            {(() => {
                if (fieldIndex === undefined) {
                    return null;
                }

                assert(valueOrValues instanceof Array);

                const values = valueOrValues;

                return (
                    <>
                        <FieldErrors
                            attribute={attribute}
                            kcClsx={kcClsx}
                            displayableErrors={displayableErrors}
                            fieldIndex={fieldIndex}
                        />
                        <AddRemoveButtonsMultiValuedAttribute
                            attribute={attribute}
                            values={values}
                            fieldIndex={fieldIndex}
                            dispatchFormAction={formValidationDispatch}
                            i18n={i18n}
                        />
                    </>
                );
            })()}
        </>
    );
}

function AddRemoveButtonsMultiValuedAttribute(props: {
    attribute: Attribute;
    values: string[];
    fieldIndex: number;
    dispatchFormAction: React.Dispatch<Extract<FormAction, { action: "update" }>>;
    i18n: I18n;
}) {
    const { attribute, values, fieldIndex, dispatchFormAction, i18n } = props;

    const { msg } = i18n;

    const { hasAdd, hasRemove } = getButtonToDisplayForMultivaluedAttributeField({
        attribute,
        values,
        fieldIndex
    });

    const idPostfix = `-${attribute.name}-${fieldIndex + 1}`;

    return (
        <>
            {hasRemove && (
                <>
                    <button
                        id={`kc-remove${idPostfix}`}
                        type="button"
                        className="pf-c-button pf-m-inline pf-m-link"
                        onClick={() =>
                            dispatchFormAction({
                                action: "update",
                                name: attribute.name,
                                valueOrValues: values.filter((_, i) => i !== fieldIndex)
                            })
                        }
                    >
                        {msg("remove")}
                    </button>
                    {hasAdd ? <>&nbsp;|&nbsp;</> : null}
                </>
            )}
            {hasAdd && (
                <button
                    id={`kc-add${idPostfix}`}
                    type="button"
                    className="pf-c-button pf-m-inline pf-m-link"
                    onClick={() =>
                        dispatchFormAction({
                            action: "update",
                            name: attribute.name,
                            valueOrValues: [...values, ""]
                        })
                    }
                >
                    {msg("addValue")}
                </button>
            )}
        </>
    );
}

function InputTagSelects(props: InputFiledByTypeProps) {
    const { attribute, formValidationDispatch, kcClsx, valueOrValues } = props;

    const { advancedMsg } = props.i18n;

    const { classDiv, classInput, classLabel, inputType } = (() => {
        const { inputType } = attribute.annotations;

        assert(
            inputType === "select-radiobuttons" || inputType === "multiselect-checkboxes"
        );

        switch (inputType) {
            case "select-radiobuttons":
                return {
                    inputType: "radio",
                    classDiv: kcClsx("kcInputClassRadio"),
                    classInput: kcClsx("kcInputClassRadioInput"),
                    classLabel: kcClsx("kcInputClassRadioLabel")
                };
            case "multiselect-checkboxes":
                return {
                    inputType: "checkbox",
                    classDiv: kcClsx("kcInputClassCheckbox"),
                    classInput: kcClsx("kcInputClassCheckboxInput"),
                    classLabel: kcClsx("kcInputClassCheckboxLabel")
                };
        }
    })();

    const options = (() => {
        walk: {
            const { inputOptionsFromValidation } = attribute.annotations;

            if (inputOptionsFromValidation === undefined) {
                break walk;
            }

            const validator = (
                attribute.validators as Record<string, { options?: string[] }>
            )[inputOptionsFromValidation];

            if (validator === undefined) {
                break walk;
            }

            if (validator.options === undefined) {
                break walk;
            }

            return validator.options;
        }

        return attribute.validators.options?.options ?? [];
    })();

    return (
        <>
            {options.map(option => (
                <div key={option} className={classDiv}>
                    <input
                        type={inputType}
                        id={`${attribute.name}-${option}`}
                        name={attribute.name}
                        value={option}
                        className={classInput}
                        aria-invalid={props.displayableErrors.length !== 0}
                        disabled={attribute.readOnly}
                        checked={
                            valueOrValues instanceof Array
                                ? valueOrValues.includes(option)
                                : valueOrValues === option
                        }
                        onChange={event =>
                            formValidationDispatch({
                                action: "update",
                                name: attribute.name,
                                valueOrValues: (() => {
                                    const isChecked = event.target.checked;

                                    if (valueOrValues instanceof Array) {
                                        const newValues = [...valueOrValues];

                                        if (isChecked) {
                                            newValues.push(option);
                                        } else {
                                            newValues.splice(
                                                newValues.indexOf(option),
                                                1
                                            );
                                        }

                                        return newValues;
                                    }

                                    return event.target.checked ? option : "";
                                })()
                            })
                        }
                        onBlur={() =>
                            formValidationDispatch({
                                action: "focus lost",
                                name: attribute.name,
                                fieldIndex: undefined
                            })
                        }
                    />
                    <label
                        htmlFor={`${attribute.name}-${option}`}
                        className={`${classLabel}${attribute.readOnly ? ` ${kcClsx("kcInputClassRadioCheckboxLabelDisabled")}` : ""}`}
                    >
                        {advancedMsg(option)}
                    </label>
                </div>
            ))}
        </>
    );
}

function TextareaTag(props: InputFiledByTypeProps) {
    const {
        attribute,
        formValidationDispatch,
        kcClsx,
        displayableErrors,
        valueOrValues
    } = props;

    assert(typeof valueOrValues === "string");

    const value = valueOrValues;

    return (
        <textarea
            id={attribute.name}
            name={attribute.name}
            className={kcClsx("kcInputClass")}
            aria-invalid={displayableErrors.length !== 0}
            disabled={attribute.readOnly}
            cols={
                attribute.annotations.inputTypeCols === undefined
                    ? undefined
                    : parseInt(`${attribute.annotations.inputTypeCols}`)
            }
            rows={
                attribute.annotations.inputTypeRows === undefined
                    ? undefined
                    : parseInt(`${attribute.annotations.inputTypeRows}`)
            }
            maxLength={
                attribute.annotations.inputTypeMaxlength === undefined
                    ? undefined
                    : parseInt(`${attribute.annotations.inputTypeMaxlength}`)
            }
            value={value}
            onChange={event =>
                formValidationDispatch({
                    action: "update",
                    name: attribute.name,
                    valueOrValues: event.target.value
                })
            }
            onBlur={() =>
                formValidationDispatch({
                    action: "focus lost",
                    name: attribute.name,
                    fieldIndex: undefined
                })
            }
        />
    );
}

function SelectTag(props: InputFiledByTypeProps) {
    const {
        attribute,
        formValidationDispatch,
        kcClsx,
        displayableErrors,
        i18n,
        valueOrValues
    } = props;

    const { advancedMsg } = i18n;

    const isMultiple = attribute.annotations.inputType === "multiselect";

    return (
        <select
            id={attribute.name}
            name={attribute.name}
            className={kcClsx("kcInputClass")}
            aria-invalid={displayableErrors.length !== 0}
            disabled={attribute.readOnly}
            multiple={isMultiple}
            size={
                attribute.annotations.inputTypeSize === undefined
                    ? undefined
                    : parseInt(`${attribute.annotations.inputTypeSize}`)
            }
            value={valueOrValues}
            onChange={event =>
                formValidationDispatch({
                    action: "update",
                    name: attribute.name,
                    valueOrValues: (() => {
                        if (isMultiple) {
                            return Array.from(event.target.selectedOptions).map(
                                option => option.value
                            );
                        }

                        return event.target.value;
                    })()
                })
            }
            onBlur={() =>
                formValidationDispatch({
                    action: "focus lost",
                    name: attribute.name,
                    fieldIndex: undefined
                })
            }
        >
            {!isMultiple && <option value=""></option>}
            {(() => {
                const options = (() => {
                    walk: {
                        const { inputOptionsFromValidation } = attribute.annotations;

                        if (inputOptionsFromValidation === undefined) {
                            break walk;
                        }

                        assert(typeof inputOptionsFromValidation === "string");

                        const validator = (
                            attribute.validators as Record<string, { options?: string[] }>
                        )[inputOptionsFromValidation];

                        if (validator === undefined) {
                            break walk;
                        }

                        if (validator.options === undefined) {
                            break walk;
                        }

                        return validator.options;
                    }

                    return attribute.validators.options?.options ?? [];
                })();

                return options.map(option => (
                    <option key={option} value={option}>
                        {(() => {
                            if (attribute.annotations.inputOptionLabels !== undefined) {
                                const { inputOptionLabels } = attribute.annotations;

                                return advancedMsg(inputOptionLabels[option] ?? option);
                            }

                            if (
                                attribute.annotations.inputOptionLabelsI18nPrefix !==
                                undefined
                            ) {
                                return advancedMsg(
                                    `${attribute.annotations.inputOptionLabelsI18nPrefix}.${option}`
                                );
                            }

                            return option;
                        })()}
                    </option>
                ));
            })()}
        </select>
    );
}
