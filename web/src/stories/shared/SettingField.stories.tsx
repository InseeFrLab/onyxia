import { SettingField, type Props } from "ui/shared/SettingField";
import { sectionName } from "./sectionName";
import { getStoryFactory, logCallbacks } from "stories/getStory";
import { id } from "tsafe/id";
import { Evt } from "evt";
import { css } from "@emotion/css";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { SettingField }
});

export default meta;

const className = css({ "width": 900 });

export const ServicePassword = getStory(
    id<Props.ServicePassword>({
        className,
        "groupProjectName": "projet-sspcloud-admin",
        "type": "service password",
        "servicePassword":
            "xiLdIdjNdiF39djKxiLdIdjNdiF39djKdxiLdIdjNdiF39djKxiLdIdjNdiF39djKd",
        ...logCallbacks(["onRequestServicePasswordRenewal", "onRequestCopy"])
    })
);

export const SwitchLanguage = getStory(
    id<Props.Language>({
        className,
        "type": "language"
    })
);

export const Toggle = getStory(
    id<Props.Toggle>({
        className,
        "type": "toggle",
        "isOn": true,
        "isLocked": false,
        "title": "Enable foo bar",
        "helperText": "Foo bar is very important for baz",
        ...logCallbacks(["onRequestToggle"])
    })
);

export const Text = getStory(
    id<Props.Text>({
        className,
        "type": "text",
        "text": "This is the actual text",
        "title": "Enable foo bar",
        "helperText": "Foo bar is very important for baz",
        ...logCallbacks(["onRequestCopy"])
    })
);

export const EditableText = getStory(
    id<Props.EditableText>({
        className,
        "type": "editable text",
        "text": "This is the actual text",
        "title": "Enable foo bar",
        "helperText": "Foo bar is very important for baz",
        "evtAction": new Evt(),
        "isLocked": false,
        ...logCallbacks(["onRequestCopy", "onRequestEdit", "onStartEdit"])
    })
);
