

import { ExplorerItemCreationDialog, Props } from "app/components/Explorer/ExplorerItemCreationDialog";
import { sectionName } from "./sectionName";
import { getStoryFactory } from "stories/geStory";
import { pure } from "lib/useCases/secretExplorer";
import { Evt } from "evt";
import type { UnpackEvt } from "evt";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { ExplorerItemCreationDialog }
});

export default meta;

const evtAction = Evt.create<UnpackEvt<Props["evtAction"]>>();

export const defaultView = getStory({
    "wordForFile": "secret",
    "getIsValidBasename": pure.getIsValidBasename,
    "successCallback": console.log.bind(console, "successCallback"),
    evtAction
});

setTimeout(() => {

    evtAction.post({
        "action": "OPEN",
        "kind": "file"
    });

}, 2000);

