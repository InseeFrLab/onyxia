import { AccountSectionHeader } from "ui/components/pages/Account/AccountSectionHeader";
import { sectionName } from "./sectionName";
import { getStoryFactory } from "stories/getStory";
import { css } from "@emotion/css";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { AccountSectionHeader },
});

export default meta;

const className = css({ "width": 900 });

export const Vue1 = getStory({
    className,
    //* spell-checker: disable */
    "title": "Utilisation des APIs Gitlab, GitHub et Kaggle",
    "helperText":
        "Connectez vos services à des comptes extérieurs sans devoir renseigner vos identifiants et mots de passe.",
    //* spell-checker: enable */
    "tooltipText": "Foo bar this is the text of the tooltip",
});

export const Vue2 = getStory({
    className,
    //* spell-checker: disable */
    "title": "Utilisation des APIs Gitlab, GitHub et Kaggle",
    "helperText":
        "Connectez vos services à des comptes extérieurs sans devoir renseigner vos identifiants et mots de passe.",
    //* spell-checker: enable */
});

export const Vue3 = getStory({
    className,
    //* spell-checker: disable */
    "title": "Utilisation des APIs Gitlab, GitHub et Kaggle",
    //* spell-checker: enable */
});
