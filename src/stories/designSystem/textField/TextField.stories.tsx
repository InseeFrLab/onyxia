
import { TextField, defaultProps } from "app/components/designSystem/textField/TextField";
import { sectionName } from "./sectionName";
import { getStoryFactory, logCallbacks } from "stories/geStory";
import { Evt } from "evt";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { TextField }
});

export default meta;


export const Vue1 = getStory({
    ...defaultProps,
    "defaultValue": "",
    "inputProps": { "aria-label": "the aria label" },
    "label": "This is the label",
    "evtAction": new Evt(),
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
