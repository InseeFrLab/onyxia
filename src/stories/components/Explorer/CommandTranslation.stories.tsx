
import { useState, useEffect, useReducer } from "react";
import { getStoryFactory } from "stories/geStory";
import { sectionName } from "./sectionName";
import { CmdTranslation } from "app/components/Explorer/CmdTranslation";
import type { Props } from "app/components/Explorer/CmdTranslation";
import { createStyles, makeStyles } from "@material-ui/core/styles";
import { symToStr } from "app/utils/symToStr";
import { Evt } from "evt";
import type { UnpackEvt } from "evt";

type StoryProps = {
    width: number;
    height: number;
    /** Toggle to fire a translation event */ 
    tick: boolean;
};

const useStyles = makeStyles(
    () => createStyles<"root", StoryProps>({
        "root": ({ width, height }) => ({
            "border": "1px solid black",
            width,
            height
        })
    })
);

const translations: UnpackEvt<Props["evtTranslation"][]> = [
    {
        "cmdId": 0,
        "type": "cmd",
        "translation": "cmd 0"
    },
    {
        "cmdId": 0,
        "type": "result",
        "translation": "result of cmd 0"
    },
    {
        "cmdId": 1,
        "type": "cmd",
        "translation": "cmd 1"
    },
    {
        "cmdId": 2,
        "type": "cmd",
        "translation": "cmd 2"
    },
    {
        "cmdId": 1,
        "type": "result",
        "translation": "result of cmd 1"
    },
    {
        "cmdId": 2,
        "type": "result",
        "translation": "result of cmd 2"
    },
    {
        "cmdId": 3,
        "type": "cmd",
        "translation": "cmd 3"
    },
    {
        "cmdId": 3,
        "type": "result",
        "translation": "result of cmd 3"
    },
    {
        "cmdId": 4,
        "type": "cmd",
        "translation": "cmd 4"
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

function Component(props: Omit<Props, "className" | "evtTranslation"> & StoryProps) {

    const { tick } = props;

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

    const classes = useStyles(props);

    const [evtTranslation] = useState(() => Evt.create<typeof translations[number]>());

    useEffect(
        () => {
            evtTranslation.postAsyncOnceHandled(translations[index]);
        },
        [evtTranslation, index]
    );

    return (
        <CmdTranslation
            className={classes.root}
            evtTranslation={evtTranslation}
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
        "height": {
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
    "height": 350,
    "tick": true
});





