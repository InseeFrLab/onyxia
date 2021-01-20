

import { useReducer, useState } from "react";
import { useValueChangeEffect  } from "app/utils/hooks/useValueChangeEffect";
import { Breadcrump } from "app/components/Explorer/Breadcrump";
import type { Props } from "app/components/Explorer/Breadcrump";
import { sectionName } from "./sectionName";
import { getStoryFactory, logCallbacks } from "stories/geStory";
import { symToStr } from "app/utils/symToStr";
import type { UnpackEvt } from "evt";
import { Evt } from "evt";
import { createStyles, makeStyles } from "@material-ui/core/styles";


type StoryProps = {
    width: number;
    /** Toggle to fire a translation event */ 
    tick: boolean;
};

const useStyles = makeStyles(
    () => createStyles<"root", StoryProps>({
        "root": ({ width }) => ({
            "border": "1px solid black",
            width
        })
    })
);

function Component(props: Omit<Props, "evtAction"> & StoryProps) {

    const { tick, minDepth, path, callback, isNavigationDisabled } = props;

    const [index, incrementIndex] = useReducer(
        (index: number) => index + 1,
        0
    );

    useValueChangeEffect(
        () => { incrementIndex(); },
        [tick]
    );

    const [evtAction] = useState(() => Evt.create<UnpackEvt<Props["evtAction"]>>());

    useValueChangeEffect(
        () => {

            evtAction.post({ 
                "action": "DISPLAY COPY FEEDBACK",
                "basename": "foo.svg"
            });

        },
        [evtAction, index]
    );

    const classes = useStyles(props);

    return (
        <Breadcrump
            isNavigationDisabled={isNavigationDisabled}
            className={classes.root}
            evtAction={evtAction}
            minDepth={minDepth}
            path={path}
            callback={callback}
        />
    );

}



const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { [symToStr({ Breadcrump })]: Component }
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
        "tick": {
            "control": {
                "type": "boolean",
            }
        }

    }
};

export const Vue1 = getStory({
    "path": "aaa/bbb/cccc/dddd/",
    "isNavigationDisabled": false,
    "minDepth": 0,
    "width": 800,
    "tick": true,
    ...logCallbacks(["callback"])
});

export const VueRelativeMinDepthNot0 = getStory({
    "path": "aaa/bbb/cccc/dddd/",
    "isNavigationDisabled": false,
    "minDepth": 1,
    "width": 800,
    "tick": true,
    ...logCallbacks(["callback"])
});

export const VueFromRoot = getStory({
    "path": "/aaa/bbb/cccc/dddd/",
    "isNavigationDisabled": false,
    "minDepth": 2,
    "width": 800,
    "tick": true,
    ...logCallbacks(["callback"])
});

