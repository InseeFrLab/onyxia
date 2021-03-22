

import { css } from "tss-react";
import { getStoryFactory } from "stories/geStory";
import { sectionName } from "./sectionName";
import { Account } from "app/components/pages/Account";
import type { Props } from "app/components/pages/MySecrets";
import { symToStr } from "app/tools/symToStr";

type StoryProps = {
    width: number;
    height: number;
};

function Component(props: Omit<Props, "className" | "route" | "splashScreen"> & StoryProps) {

    const { width, height } = props;

    return <Account
        className={css({
            width,
            height
        })}
    />;

}

const { meta, getStory } = getStoryFactory({
    sectionName,
    "doProvideMockStore": true,
    "wrappedComponent": { [symToStr({ Account })]: Component }
});


export default {
    ...meta,
    "argTypes": {
        ...meta.argTypes,
        "width": {
            "control": {
                "type": "range",
                "min": 200,
                "max": 1920
            }
        },
        "height": {
            "control": {
                "type": "range",
                "min": 200,
                "max": 1080
            }
        }

    }
};

export const Vue1 = getStory({
    "width": 1400,
    "height": 1100
});




/*


import { Row } from "app/components/pages/Account/Row";
import { getStoryFactory, logCallbacks } from "stories/geStory";
import { sectionName } from "../sectionName";
import { Evt } from "evt";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { Row }
});

export default meta;

const baseParams: Parameters<typeof getStory>[0] = {
    "isLocked": false,
    "rowKey": "foo",
    "value": "hello world",
    "isEditable": true,
    "isCopyable": true,
    "isDarker": true,
    ...logCallbacks(["onCopy", "onEdit"]),
    "getIsValidValue": value =>
        value === "" ?
            {
                "isValidValue": false,
                "message": "Empty string"
            } : {
                "isValidValue": true
            }
};

export const VueDefault = getStory(baseParams);

export const VueLongValue = getStory({
    ...baseParams,
    "value": [...Array(30)].map(() => Math.random().toString(36)[2]).join('')
});


*/


