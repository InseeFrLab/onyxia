
import { MySecretsEditorRow } from "app/pages/MySecrets/MySecretsEditor/MySecretsEditorRow";
import { getStoryFactory, logCallbacks } from "stories/geStory";
import { sectionName } from "./sectionName";
import { getIsValidStrValue, getIsValidKey } from "app/pages/MySecrets/MySecretsEditor";
import { Evt } from "evt";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { MySecretsEditorRow }
});

export default meta;

const baseParams: Parameters<typeof getStory>[0] = {
    getIsValidStrValue,
    "isLocked": false,
    "keyOfSecret": "FOO_BAR",
    "strValue": "hello world",
    "getResolvedValue": ({ strValue }) => {
        const resolvedValue = strValue.replace(/"/g, "");
        return ({
            "isError": false,
            "resolvedValue": resolvedValue === strValue ? "" : resolvedValue
        });
    },
    "getIsValidAndAvailableKey": getIsValidKey,
    "evtAction": new Evt(),
    ...logCallbacks([
        "onEdit",
        "onDelete"
    ])
};

export const VueDefault = getStory(baseParams);

export const { VueEditing } = (() => {

    const evtAction: (typeof baseParams)["evtAction"] = new Evt();

    const VueEditing = getStory({
        ...baseParams,
        evtAction
    });

    Evt.asPostable(evtAction).post("ENTER EDITING STATE");

    return { VueEditing };

})();

export const VueLongValue = getStory({
    ...baseParams,
    "strValue": [...Array(30)].map(() => Math.random().toString(36)[2]).join('')
});

export const VueLongKey = getStory({
    ...baseParams,
    "keyOfSecret": "thisIsAVeryLongKeyToSeeHowItShouldBeDisplayed"
});
