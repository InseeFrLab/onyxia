
import { css } from "app/theme/useClassNames";
import { useState, useEffect, useReducer } from "react";
import { getStoryFactory } from "stories/geStory";
import { sectionName } from "./sectionName";
import { CmdTranslation } from "app/components/Explorer/CmdTranslation";
import type { Props } from "app/components/Explorer/CmdTranslation";
import { symToStr } from "app/utils/symToStr";
import { Evt } from "evt";
import type { UnpackEvt } from "evt";


const translations: UnpackEvt<Props["evtTranslation"][]> = [
    {
        "cmdId": 0,
        "type": "cmd",
        "translation": "vault write auth/jwt/login role=onyxia-user jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJlbWFpbCI6ImpvaG4uZG9lQGluc2VlLmZyIiwicHJlZmVycmVkX3VzZXJuYW1lIjoiZG9laiIsImdpdGxhYl9ncm91cCI6bnVsbCwibmFtZSI6IiJ9.eAs8RQ_lfvjh_qYZtRYO9qp7VI6TLwWrRLd3Xr3Yt8g"
    },
    {
        "cmdId": 0,
        "type": "result",
        "translation": `Success! You are now authenticated!`
    },
    {
        "cmdId": 1,
        "type": "cmd",
        "translation": "vault kv list onyxia-kv/doej"
    },
    {
        "cmdId": 1,
        "type": "result",
        "translation": [
            "Keys",
            "----",
            ".onyxia/",
            "dossier_test/",
            "secret_sans_nom",
            "untitled_secret"
        ].join("\n")
    },
    {
        "cmdId": 2,
        "type": "cmd",
        "translation": "vault kv get onyxia-kv/doej/.onyxia/userServicePassword"
    },
    {
        "cmdId": 2,
        "type": "result",
        "translation": [
            "==== Data ====",
            "Key    Value",
            "---    -----",
            "value  01xlcu1hg4wxzib08xe4",
        ].join("\n")
    },
    {
        "cmdId": 3,
        "type": "cmd",
        "translation": "cmd 3"
    },
    {
        "cmdId": 4,
        "type": "cmd",
        "translation": "cmd 4"
    },
    {
        "cmdId": 3,
        "type": "result",
        "translation": "result of cmd 3"
    },
    {
        "cmdId": 4,
        "type": "result",
        "translation": "result of cmd 4"
    },
    {
        "cmdId": 5,
        "type": "cmd",
        "translation": "cmd 5"
    },
    {
        "cmdId": 5,
        "type": "result",
        "translation": "result of cmd 5"
    },
    {
        "cmdId": 6,
        "type": "cmd",
        "translation": "cmd 6"
    },
    {
        "cmdId": 6,
        "type": "result",
        "translation": "result of cmd 6"
    },
];

function Component(props: Omit<Props, "className" | "evtTranslation"> & {
    width: number;
    maxHeight: number;
    /** Toggle to fire a translation event */
    tick: boolean;
}) {

    const { tick, maxHeight, width } = props;

    const [index, incrementIndex] = useReducer(
        (index: number) =>
            (index === translations.length - 1) ?
                index :
                index + 1,
        0
    );

    useEffect(
        () => { incrementIndex(); },
        [tick]
    );


    const [evtTranslation] = useState(() => Evt.create<typeof translations[number]>());

    useEffect(
        () => {
            evtTranslation.postAsyncOnceHandled(translations[index]);
        },
        [evtTranslation, index]
    );


    return (
        <CmdTranslation
            className={css({
                "border": "1px solid black",
                width
            })}
            evtTranslation={evtTranslation}
            maxHeight={maxHeight}
        />
    );

}

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { [symToStr({ CmdTranslation })]: Component }
});


export default {
    ...meta,
    "argTypes": {
        ...meta.argTypes,
        "width": {
            "control": {
                "type": "range",
                "min": 200,
                "max": 1920,
                "step": 10
            }
        },
        "maxHeight": {
            "control": {
                "type": "range",
                "min": 100,
                "max": 1080,
                "step": 10
            }
        },
        "tick": {
            "control": {
                "type": "boolean",
            }
        }

    }
};

export const Vue1 = getStory({
    "width": 800,
    "maxHeight": 350,
    "tick": true
});

