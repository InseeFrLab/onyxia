import {
    SecretsExplorerItem,
    SecretsExplorerItemProps,
} from "ui/components/pages/MySecrets/SecretsExplorer/SecretsExplorerItems/SecretsExplorerItem";
import { sectionName } from "./sectionName";
import { getStoryFactory, logCallbacks } from "stories/getStory";
import { Evt } from "evt";
import type { UnpackEvt } from "evt";
import { id } from "tsafe/id";
import withEvents from "@storybook/addon-events";
import { EventEmitter } from "events";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { ExplorerItem: SecretsExplorerItem },
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
                    "payload":
                        id<UnpackEvt<SecretsExplorerItemProps["evtAction"]>>(
                            "ENTER EDITING STATE",
                        ),
                },
            ],
        }),
    ],
};

export const defaultView = getStory({
    "kind": "file",
    "basename": "aVeryLongNameThatShouldBreak.txt",
    "isSelected": false,
    "isCircularProgressShown": false,
    "getIsValidBasename": () => true,
    "evtAction": Evt.from(eventEmitter, "default"),
    ...logCallbacks(["onMouseEvent", "onEditBasename", "onIsInEditingStateValueChange"]),
});
