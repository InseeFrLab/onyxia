
import { TextField, defaultProps } from "app/components/designSystem/TextField";
import { sectionName } from "./sectionName";
import { getStoryFactory, logCallbacks } from "stories/geStory";
import { css } from "tss-react";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { TextField }
});

export default meta;


export const Vue1 = getStory({
    ...defaultProps,
    "defaultValue": "",
    "inputProps_aria-label": "the aria label",
    "label": "This is the label",
    "getIsValidValue": value => {
        console.log("getIsValidValue invoked: ", value);

        if (value.includes(" ") ) {
            return { "isValidValue": false, "message": "Can't include spaces" };
        }

        return { "isValidValue": true };

    },
    "transformValueBeingTyped": value => {
        console.log("transformValueBeingTyped invoked: ", value);
        return value;
    },
    ...logCallbacks([
        "onEscapeKeyDown", "onEnterKeyDown", "onBlur",
        "onSubmit", "onValueBeingTypedChange"
    ])
});

export const VuePassword = getStory({
    ...defaultProps,
    "className": css({ "width": 500 }),
    "defaultValue": "",
    "inputProps_aria-label": "password",
    "label": "Password",
    "type": "password",
    "getIsValidValue": value => {
        console.log("getIsValidValue invoked: ", value);

        if (value.includes(" ") ) {
            return { "isValidValue": false, "message": "Can't include spaces" };
        }

        return { "isValidValue": true };

    },
    "transformValueBeingTyped": value => {
        console.log("transformValueBeingTyped invoked: ", value);
        return value;
    },
    ...logCallbacks([
        "onEscapeKeyDown", "onEnterKeyDown", "onBlur",
        "onSubmit", "onValueBeingTypedChange"
    ])
});

export const VueWithHint = getStory({
    ...defaultProps,
    "helperText": "This is an helper text",
    "className": css({ "width": 500 }),
    "defaultValue": "",
    "inputProps_aria-label": "input with hint",
    "label": "Foo bar",
    "type": "text",
    "getIsValidValue": value => {
        console.log("getIsValidValue invoked: ", value);

        if (value.includes(" ") ) {
            return { "isValidValue": false, "message": "Can't include spaces" };
        }

        return { "isValidValue": true };

    },
    "transformValueBeingTyped": value => {
        console.log("transformValueBeingTyped invoked: ", value);
        return value;
    },
    ...logCallbacks([
        "onEscapeKeyDown", "onEnterKeyDown", "onBlur",
        "onSubmit", "onValueBeingTypedChange"
    ])
});


/*
    "getIsValidValue": value=> {
        console.log("getIsValidValue invoked: ", value);

        if( value === ""){
            return { "isValidValue": false, "message": "Can't be empty" } as const;
        }

        return { "isValidValue": true } as const;

    },
    */
