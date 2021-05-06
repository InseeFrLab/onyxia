

import { Dialog } from "app/components/designSystem/Dialog";
import { Button } from "app/components/designSystem/Button";
import type { Props } from "app/components/designSystem/Dialog";
import { sectionName } from "./sectionName";
import { getStoryFactory, logCallbacks } from "stories/geStory";

const { meta, getStory } = getStoryFactory({
    sectionName,
    "wrappedComponent": { Dialog }
});

export default meta;

const props: Props = {
    /* spell-checker: disable */
    "title": "Utiliser dans un service",
    "subtitle": "Le chemin du secret a été copié. ",
    "body": `
    Au moment de lancer un service, convertissez vos secrets en variables 
    d'environnement. Pour cela, allez dans configuration avancée, puis dans 
    l’onglet Vault et collez le chemin du dossier dans le champ prévu à cet effet. 
    Vos clefs valeurs seront disponibles sous forme de variables d'environnement.`,
    /* spell-checker: enable */
    "buttons":
        <>
            <Button color="secondary">Cancel</Button>
            <Button color="primary">Ok</Button>
        </>,
    "isOpen": true,
    ...logCallbacks([
        "onClose",
        "onDoNotDisplayAgainValueChange"
    ])
};

export const VueFull = getStory(props);


