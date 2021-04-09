

import { AccountTabs } from "app/components/pages/Account/AccountTabs";
import type { Props } from "app/components/pages/Account/AccountTabs";
import { sectionName } from "./sectionName";
import { getStoryFactory, logCallbacks } from "stories/geStory";
import { css } from "tss-react";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { "AccountTabs": AccountTabs as any }
});

export default meta;

const props: Props = {
    "size": "big",
    "className": css({ "width": 1278 }),
    "defaultSelectedTabId": "info",
    /* spell-checker: disable */
    "tabs": [
        {
        "id": "info",
        "title": "Information du compte"
    }, {
        "id": "configs",
        "title": "Configuration des comptes"
    }, {
        "id": "storage",
        "title": "Connexion au stockage"
    }, {
        "id": "ui",
        "title": "Mode d'interface"
    }
],
    /* spell-checker: enable */
    "maxTabCount": 5,
    ...logCallbacks(["onActiveTab"])
}


export const Vue1 = getStory(props);
export const Vue2 = getStory({
    ...props,
    "size": "small",
    "tabs": [
        {
            "id": "kub",
            "title": "Kubernetes"
        },
        {
            "id": "r",
            "title": "R"
        },
        {
            "id": "init",
            "title": "Init"
        },
        {
            "id": "security",
            "title": "Security"
        },
        {
            "id": "environnement",
            "title": "Environnement"
        },
        {
            "id": "git",
            "title": "Git"
        }
    ]
});
