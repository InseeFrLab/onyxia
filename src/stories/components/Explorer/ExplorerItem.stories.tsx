
import React, { useEffect, useState } from "react";
import { ExplorerItem, Props } from "app/components/Explorer/ExplorerItem";
import { sectionName } from "./sectionName";
import { getStoryFactory } from "stories/geStory";
import { pure } from "lib/useCases/secretExplorer";
import { Evt } from "evt";
import type { UnpackEvt } from "evt";
import { symToStr } from "app/utils/symToStr";
import { id } from "evt/tools/typeSafety/id";

function Component(props: Omit<Props, "evtAction"> & { isBeingEdited: boolean; }) {

    const { isBeingEdited } = props;

    const [evtAction] = useState(() => Evt.create<UnpackEvt<Props["evtAction"]>>());

    useEffect(() => {

        evtAction.post(
            isBeingEdited ?
                { "action": "enter editing state" } :
                { "action": "leave editing state", "isCancel": true }
        );

    }, [isBeingEdited, evtAction]);

    return <ExplorerItem evtAction={evtAction} {...props} />;

}

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { [symToStr({ ExplorerItem })]: Component }
});

/* eslint-disable import/no-anonymous-default-export */
export default {
    ...meta,
    "argTypes": {
        ...meta.argTypes,
        "standardizedWidth": {
            "control": {
                "type": "inline-radio",
                "options": id<Props["standardizedWidth"][]>(["big", "normal"]),
            }
        },
        "kind": {
            "control": {
                "type": "inline-radio",
                "options": id<Props["kind"][]>(["file", "directory"]),
            }
        },
        "visualRepresentationOfAFile": {
            "control": {
                "type": "inline-radio",
                "options": id<Props["visualRepresentationOfAFile"][]>(["file", "secret"]),
            }
        }
    }
};

export const Vue1 = getStory({
    "visualRepresentationOfAFile": "secret",
    "kind": "file",
    "basename": "my-project-envs",
    "isSelected": false,
    "standardizedWidth": "big",
    "isCircularProgressShown": false,
    "onMouseEvent": console.log.bind(null, "onMouseEvent"),
    "onEditedBasename": console.log.bind(null, "onEditedBasename"),
    "getIsValidBasename": pure.getIsValidBasename,
    "isBeingEdited": false,
});


