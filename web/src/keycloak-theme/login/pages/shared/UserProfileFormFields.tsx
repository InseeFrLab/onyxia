import { useMemo, useEffect, Fragment } from "react";
import type { ClassKey } from "keycloakify/login/TemplateProps";
import { useFormValidation } from "keycloakify/login/lib/useFormValidation";
import type { Attribute } from "keycloakify/login/kcContext/KcContext";
import type { I18n } from "../../i18n";
import { useStyles } from "tss";
import { TextField } from "onyxia-ui/TextField";
import { capitalize } from "tsafe/capitalize";
import { regExpStrToEmailDomains } from "../../emailDomainAcceptListHelper";

export type UserProfileFormFieldsProps = {
    kcContext: Parameters<typeof useFormValidation>[0]["kcContext"];
    i18n: I18n;
    getClassName: (classKey: ClassKey) => string;
    onIsFormSubmittableValueChange: (isFormSubmittable: boolean) => void;
    BeforeField?: (props: { attribute: Attribute }) => JSX.Element | null;
    AfterField?: (props: { attribute: Attribute }) => JSX.Element | null;
    getIncrementedTabIndex: () => number;
};

export function UserProfileFormFields(props: UserProfileFormFieldsProps) {
    const {
        kcContext,
        onIsFormSubmittableValueChange,
        i18n,
        getClassName,
        getIncrementedTabIndex
    } = props;

    const { advancedMsg } = i18n;

    const {
        formValidationState: { fieldStateByAttributeName, isFormSubmittable },
        formValidationDispatch,
        attributesWithPassword
    } = useFormValidation({
        kcContext,
        i18n
    });

    const { msg } = i18n;

    const { cx } = useStyles();

    useEffect(() => {
        onIsFormSubmittableValueChange(isFormSubmittable);
    }, [isFormSubmittable]);

    let currentGroup = "";

    const areAllFieldsRequired = useMemo(
        () => attributesWithPassword.every(({ required }) => required),
        [attributesWithPassword]
    );

    return (
        <>
            {attributesWithPassword.map((attribute, i) => {
                const {
                    group = "",
                    groupDisplayHeader = "",
                    groupDisplayDescription = ""
                } = attribute;

                const { value, displayableErrors } =
                    fieldStateByAttributeName[attribute.name];

                const formGroupClassName = cx(
                    getClassName("kcFormGroupClass"),
                    displayableErrors.length !== 0 &&
                        getClassName("kcFormGroupErrorClass")
                );

                return (
                    <Fragment key={i}>
                        {group !== currentGroup && (currentGroup = group) !== "" && (
                            <div className={formGroupClassName}>
                                <div className={getClassName("kcContentWrapperClass")}>
                                    <label
                                        id={`header-${group}`}
                                        className={getClassName("kcFormGroupHeader")}
                                    >
                                        {advancedMsg(groupDisplayHeader) || currentGroup}
                                    </label>
                                </div>
                                {groupDisplayDescription !== "" && (
                                    <div className={getClassName("kcLabelWrapperClass")}>
                                        <label
                                            id={`description-${group}`}
                                            className={getClassName("kcLabelClass")}
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
                            className={getClassName("kcInputClass")}
                            aria-invalid={displayableErrors.length !== 0}
                            disabled={attribute.readOnly}
                            autoComplete={attribute.autocomplete}
                            onBlur={() =>
                                formValidationDispatch({
                                    "action": "focus lost",
                                    "name": attribute.name
                                })
                            }
                            inputProps_aria-label={attribute.name}
                            inputProps_tabIndex={
                                attribute.name === "username"
                                    ? -1
                                    : getIncrementedTabIndex()
                            }
                            onValueBeingTypedChange={({ value }) =>
                                formValidationDispatch({
                                    "action": "update value",
                                    "name": attribute.name,
                                    "newValue": value
                                })
                            }
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
                                    {!areAllFieldsRequired && attribute.required && "*"}
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
                                        )
                                );

                                if (displayableErrors.length !== 0) {
                                    return displayableErrors.map(
                                        ({ errorMessage }, i) => (
                                            <span key={i}>{errorMessage}&nbsp;</span>
                                        )
                                    );
                                }

                                switch (attribute.name) {
                                    case "email":
                                        return msg("allowed email domains");
                                    case "password": {
                                        // prettier-ignore
                                        const { min } = attribute.validators.length ?? {};
                                        if (min === undefined) {
                                            break;
                                        }

                                        // prettier-ignore
                                        return msg("minimum length", `${parseInt(min)}`);
                                    }
                                }

                                {
                                    // prettier-ignore
                                    const { pattern } = attribute.validators;

                                    if (pattern !== undefined) {
                                        const { "error-message": errorMessageKey } =
                                            pattern;

                                        // prettier-ignore
                                        return errorMessageKey !== undefined ? 
                                            advancedMsg(errorMessageKey) : 
                                            msg("must respect the pattern");
                                    }
                                }

                                return undefined;
                            })()}
                            // prettier-ignore
                            questionMarkHelperText={(() => {
                                const { pattern } = attribute.validators.pattern ?? {};

                                // prettier-ignore
                                return pattern === undefined ?
                                    undefined :
                                    attribute.name === "email" ?
                                        (() => {

                                            try {
                                                return regExpStrToEmailDomains(pattern).join(", ");
                                            } catch {
                                                return pattern;
                                            }

                                        })() :
                                        fieldStateByAttributeName[attribute.name].displayableErrors.length === 0 ?
                                            pattern :
                                            undefined;
                            })()}
                            // prettier-ignore
                            inputProps_aria-invalid={fieldStateByAttributeName[attribute.name].displayableErrors.length !== 0}
                        />
                    </Fragment>
                );
            })}
        </>
    );
}
