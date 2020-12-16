import { symToStr } from "app/utils/symToStr";
import { Reflect } from "app/utils/Reflect";
import { id } from "evt/tools/typeSafety/id";

import { ExplorerItemCreationDialog } from "app/components/Explorer/ExplorerItemCreationDialog";
import { MySecretsHeader } from "app/pages/MySecrets/MySecretsHeader";
import { ExplorerItem } from "app/components/Explorer/ExplorerItem";
import { ExplorerButtonBar } from "app/components/Explorer/ExplorerButtonBar";

export type Scheme = {
    [key: string]: undefined | Record<string, string>;
};

type ToTranslations<S extends Scheme> = {
    [key in keyof S]: string;
};

const reflectedI18nSchemes = {
    [symToStr({ ExplorerItemCreationDialog })]: Reflect<ExplorerItemCreationDialog.I18nScheme>(),
    [symToStr({ MySecretsHeader })]: Reflect<MySecretsHeader.I18nScheme>(),
    [symToStr({ ExplorerItem })]: Reflect<ExplorerItem.I18nScheme>(),
    [symToStr({ ExplorerButtonBar })]: Reflect<ExplorerButtonBar.I18nScheme>()
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
        "ExplorerItemCreationDialog": {
            ...common.en,
            "directory": "directory",
            "create new": "Create new {{what}}",
            "sort out your": `Create directories to sort out your {{what}}`,
            "name of the": `Name of the {{what}}`,

        },
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
        }
    },
    "fr": {
        /* spell-checker: disable */
        "ExplorerItemCreationDialog": {
            ...common.fr,
            "directory": "dossier",
            "create new": "Crée nouveau {{what}}",
            "sort out your": "Cree des répértoires pour hierarchiser vos {{what}}",
            "name of the": `Nom du {{what}}`,
        },
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
        }
        /* spell-checker: enable */
    }

});
