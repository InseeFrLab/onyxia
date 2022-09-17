import { AccountField } from "ui/components/pages/Account/AccountField";
import type { Props } from "ui/components/pages/Account/AccountField";
import { sectionName } from "./sectionName";
import { getStoryFactory, logCallbacks } from "stories/getStory";
import { id } from "tsafe/id";
import { Evt } from "evt";
import { css } from "@emotion/css";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { "AccountField": AccountField as any },
});

export default meta;

const className = css({ "width": 900 });

export const ServicePassword = getStory(
    id<Props.ServicePassword>({
        className,
        "type": "service password",
        "servicePassword":
            "xiLdIdjNdiF39djKxiLdIdjNdiF39djKdxiLdIdjNdiF39djKxiLdIdjNdiF39djKd",
        "isLocked": false,
        ...logCallbacks(["onRequestServicePasswordRenewal", "onRequestCopy"]),
    }),
);

export const S3Scripts = getStory(
    id<Props.S3Scripts<string>>({
        className,
        "type": "s3 scripts",
        "scriptLabels": [
            "R (aws.S3)",
            "R (paws)",
            "Python (s3fs)",
            "Environnement variables",
        ],
        ...logCallbacks(["onRequestDownloadScript", "onRequestCopyScript"]),
    }),
);

export const SwitchLanguage = getStory(
    id<Props.Language>({
        className,
        "type": "language",
    }),
);

export const Toggle = getStory(
    id<Props.Toggle>({
        className,
        "type": "toggle",
        "isOn": true,
        "isLocked": false,
        "title": "Enable foo bar",
        "helperText": "Foo bar is very important for baz",
        ...logCallbacks(["onRequestToggle"]),
    }),
);

export const Text = getStory(
    id<Props.Text>({
        className,
        "type": "text",
        "text": "This is the actual text",
        "title": "Enable foo bar",
        "helperText": "Foo bar is very important for baz",
        ...logCallbacks(["onRequestCopy"]),
    }),
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
        ...logCallbacks(["onRequestCopy", "onRequestEdit", "onStartEdit"]),
    }),
);
