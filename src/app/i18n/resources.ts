import { symToStr } from "app/utils/symToStr";
import { Reflect } from "app/utils/Reflect";
import { id } from "evt/tools/typeSafety/id";

import { MySecretsHeader } from "app/pages/MySecrets/MySecretsHeader";
import { ExplorerItem } from "app/components/Explorer/ExplorerItem";
import { ExplorerButtonBar } from "app/components/Explorer/ExplorerButtonBar";
import { Explorer } from "app/components/Explorer/Explorer";
import { MySecretsEditor } from "app/pages/MySecrets/MySecretsEditor/MySecretsEditor";
import { MySecretsEditorRow } from "app/pages/MySecrets/MySecretsEditor/MySecretsEditorRow";

export type Scheme = {
    [key: string]: undefined | Record<string, string>;
};

type ToTranslations<S extends Scheme> = {
    [key in keyof S]: string;
};

const reflectedI18nSchemes = {
    [symToStr({ MySecretsHeader })]: Reflect<MySecretsHeader.I18nScheme>(),
    [symToStr({ ExplorerItem })]: Reflect<ExplorerItem.I18nScheme>(),
    [symToStr({ ExplorerButtonBar })]: Reflect<ExplorerButtonBar.I18nScheme>(),
    [symToStr({ Explorer })]: Reflect<Explorer.I18nScheme>(),
    [symToStr({ MySecretsEditor })]: Reflect<MySecretsEditor.I18nScheme>(),
    [symToStr({ MySecretsEditorRow })]: Reflect<MySecretsEditorRow.I18nScheme>()
};

export type I18nSchemes = typeof reflectedI18nSchemes;

export type Translations = { [K in keyof I18nSchemes]: ToTranslations<I18nSchemes[K]> };

export type SupportedLanguages = "en" | "fr";

const common = id<Record<SupportedLanguages, Record<"file" | "secret" | "create" | "cancel" | "rename" | "delete", string>>>({
    "en": {
        "file": "file",
        "secret": "secret",
        "create": "create",
        "cancel": "cancel",
        "rename": "rename",
        "delete": "delete"
    },
    "fr": {
        /* spell-checker: disable */
        "file": "fichier",
        "secret": "secret",
        "create": "crée",
        "cancel": "annuler",
        "rename": "renommer",
        "delete": "supprimer"
        /* spell-checker: enable */
    }
})

export const resources = id<Record<SupportedLanguages, Translations>>({
    "en": {
        "MySecretsHeader": {
            "page title": "My Secrets",
            "what this page is used for": `
            Store here the passwords, tokens and other secrets that should note appear in your source code.
            You will be able to access your secrets within your services as environnement variable.`,
            "to learn more read": "To learn more about how to use secrets refer to {{what}}",
            "tfm": "the documentation"
        },
        "ExplorerItem": {
            "description": "description"
        },
        "ExplorerButtonBar": {
            ...common.en,
            "copy path": "Copy path",
            "create directory": "Create directory",
            "create what": "Create {{what}}",
        },
        "Explorer": {
            ...common.en,
            "untitled what": "untitled_{{what}}",
            "empty directory": "This directory is empty",
            "folder": "folder"

        },
        "MySecretsEditor": {
            "add an entry": "New ENV",
            "environnement variable default name": "NEW_VAR",
            "table of secret": "table of secret",

            "key column name": "Variable name",
            "value column name": "Value",
            "resolved value column name": "Resolved Value",
            "what's a resolved value": `
            An environnement variable can reference another one. If for example you have defined 
            FIRST_NAME=John you can set FULL_NAME="$FIRST_NAME"-Doe, the resolved value of 
            FILL_NAME will be «John-Doe»
            `,
            "unavailable key": "Already used",
            "invalid key empty string": "Name required",
            "invalid key _ not valid": "Can't be just _",
            "invalid key start with digit": "Can't start with a digit",
            "invalid key invalid character": "Only letter digits or _",
            "invalid value cannot eval": "Not a valid shell expression"
        },
        "MySecretsEditorRow": {
            "key input desc": "Environnement variable name",
            "value input desc": "Environnement variable value"
        }
    },
    "fr": {
        /* spell-checker: disable */
        "MySecretsHeader": {
            "page title": "Mes secrets",
            "what this page is used for": "Stoker ici les mots de passes, tokens et autres secrets qui ne doivent pas apparaitre dans votre code source. Ses secrets seront accessibles depuis vos services sous forme de variable d'environnement.",
            "to learn more read": "Pour en apprendre plus vous pouvez consulter {{what}}",
            "tfm": "la documentation"
        },
        "ExplorerItem": {
            "description": "déscription"
        },
        "ExplorerButtonBar": {
            ...common.fr,
            "copy path": "Copier le chemin",
            "create directory": "Nouveau dossier",
            "create what": "Nouveau {{what}}"
        },
        "Explorer": {
            ...common.fr,
            "empty directory": "Ce répertoire est vide",
            "untitled what": "{{what}}_sans_nom",
            "folder": "dossier"
        },
        "MySecretsEditor": {

            "add an entry": "Nouvelle ENV",
            "environnement variable default name": "NOUVELLE_VARENV",
            "table of secret": "table de secret",

            "key column name": "Nom de l'ENV",
            "value column name": "Valeur",
            "resolved value column name": "Valeur résolue",
            "what's a resolved value": `
            Une variable d'environement peut en référencer une autre, si par example vous avez
            definit la varialbe PRENOM=Louis vous pouvez définir la variable NOM_COMPLET="$PRENOM"-Dupon
            qui aura comme valeur résolue «Louis-Dupon»
            `,
            "unavailable key": "Déjà utilisé",
            "invalid key empty string": "Un nom est requis",
            "invalid key _ not valid": "Ne peut pas être juste _",
            "invalid key start with digit": "Ne doit pas commencer par un chifre",
            "invalid key invalid character": "Caractère non valid",
            "invalid value cannot eval": "Pas une expression shell valid"

        },
        "MySecretsEditorRow": {
            "key input desc": "Nom de la variable d'environnement",
            "value input desc": "Valeur de la variable d'environnement"
        }
        /* spell-checker: enable */
    }

});
