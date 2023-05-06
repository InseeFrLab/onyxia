import { MySecretsEditorRow } from "ui/pages/mySecrets/MySecretsEditor/MySecretsEditorRow";
import { getStoryFactory, logCallbacks } from "stories/getStory";
import { sectionName } from "./sectionName";
import { getIsValidKey } from "ui/pages/mySecrets/MySecretsEditor";
import { Evt } from "evt";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { MySecretsEditorRow }
});

export default meta;

const baseParams: Parameters<typeof getStory>[0] = {
    "isLocked": false,
    "keyOfSecret": "FOO_BAR",
    "strValue": "hello world",
    "getResolvedValue": ({ strValue }) => ({
        "isResolvedSuccessfully": true,
        "resolvedValue": `$(${strValue})`
    }),
    "getIsValidAndAvailableKey": ({ key }) => {
        const r = getIsValidKey({ key });

        return r.isValidKey
            ? { "isValidAndAvailableKey": true }
            : { "isValidAndAvailableKey": false, "message": r.message };
    },
    "evtAction": new Evt(),
    ...logCallbacks(["onEdit", "onDelete", "onStartEdit"]),
    "isDarker": true
};

export const ViewDefault = getStory(baseParams);

export const { ViewEditing } = (() => {
    const evtAction: (typeof baseParams)["evtAction"] = new Evt();

    const ViewEditing = getStory({
        ...baseParams,
        evtAction
    });

    Evt.asPostable(evtAction).post("ENTER EDITING STATE");

    return { ViewEditing };
})();

export const ViewLongValue = getStory({
    ...baseParams,
    "strValue": [...Array(30)].map(() => Math.random().toString(36)[2]).join("")
});

export const ViewLongKey = getStory({
    ...baseParams,
    "keyOfSecret": "thisIsAVeryLongKeyToSeeHowItShouldBeDisplayed"
});
