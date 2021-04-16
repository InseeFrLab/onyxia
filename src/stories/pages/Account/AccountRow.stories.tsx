
import { AccountRow } from "app/components/pages/Account/AccountRow";
import type { Props } from "app/components/pages/Account/AccountRow";
import { sectionName } from "./sectionName";
import { getStoryFactory, logCallbacks } from "stories/geStory";
import { css } from "tss-react";
import { id } from "evt/tools/typeSafety/id";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { "AccountRow": AccountRow as any }
});

export default meta;

const className = css({ "width": 900 });

export const ServicePassword = getStory(id<Props.ServicePassword>({
    className,
    "type": "service password",
    "servicePassword": "xiLdIdjNdiF39djKxiLdIdjNdiF39djKdxiLdIdjNdiF39djKxiLdIdjNdiF39djKd",
    "isLocked": false,
    ...logCallbacks([
        "onRequestServicePasswordRenewal",
        "onRequestCopy"
    ])
}));

export const S3Scripts = getStory(id<Props.S3Scripts<string>>({
    className,
    "type": "s3 scripts",
    "scriptList": [ 
        "R (aws.S3)", 
        "R (paws)", "Python (s3fs)", 
        "Environnement variables"
    ],
    ...logCallbacks([
        "onRequestDownloadScript",
        "onRequestCopyScript"
    ])
}));

export const SwitchLanguage = getStory(id<Props.Language<string>>({
    className,
    "type": "language"
}));
