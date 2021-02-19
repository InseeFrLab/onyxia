
import { ExplorerItem, Props } from "app/components/shared/Explorer/ExplorerItem";
import { sectionName } from "./sectionName";
import { getStoryFactory, logCallbacks } from "stories/geStory";
import { pure } from "lib/useCases/secretExplorer";
import { Evt } from "evt";
import type { UnpackEvt } from "evt";
import { id } from "evt/tools/typeSafety/id";
import withEvents from "@storybook/addon-events";
import { EventEmitter } from "events";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { ExplorerItem }
});

const eventEmitter = new EventEmitter();

export default {
    ...meta,
    "decorators": [
        ...(meta.decorators ? meta.decorators : []),
        withEvents({
            "emit": eventEmitter.emit.bind(eventEmitter),
            "events": [
                {
                    "title": "Enter editing state",
                    "name": "default",
                    "payload": id<UnpackEvt<Props["evtAction"]>>("ENTER EDITING STATE"),
                }
            ]
        }),
    ],

};

export const defaultView = getStory({
    "visualRepresentationOfAFile": "secret",
    "kind": "file",
    "basename": "aVeryLongNameThatShouldBreak.txt",
    "isSelected": false,
    "standardizedWidth": "big",
    "isCircularProgressShown": false,
    "getIsValidBasename": pure.getIsValidBasename,
    "evtAction": Evt.from(eventEmitter, "default"),
    ...logCallbacks([
        "onMouseEvent",
        "onEditBasename",
        "onIsInEditingStateValueChange"
    ])
});
