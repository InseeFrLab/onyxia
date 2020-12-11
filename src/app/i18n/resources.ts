import { symToStr } from "app/utils/symToStr";
import { CreateFileOrDirectoryModal } from "app/molecules/CreateFileOrDirectoryModal";
import { Reflect } from "app/utils/Reflect";
import { id } from "evt/tools/typeSafety/id";

export type Scheme = {
    [key: string]: undefined | Record<string, string>;
};

type ToTranslations<S extends Scheme> = {
    [key in keyof S]: string;
};

const reflectedI18nSchemes = {
    [symToStr({ CreateFileOrDirectoryModal })]: Reflect<CreateFileOrDirectoryModal.I18nScheme>()
};

export type I18nSchemes = typeof reflectedI18nSchemes;

export type Translations = { [K in keyof I18nSchemes]: ToTranslations<I18nSchemes[K]> };

export type SupportedLanguages = "en" | "fr";

const common = id<Record<SupportedLanguages, Record<"file" | "secret", string>>>({
    "en": {
        "file": "file",
        "secret": "secret",
    },
    "fr": {
        /* spell-checker: disable */
        "file": "fichier",
        "secret": "secret",
        /* spell-checker: enable */
    }

})

export const resources = id<Record<SupportedLanguages, Translations>>({
    "en": {
        "CreateFileOrDirectoryModal": {
            ...common.en,
            "directory": "directory",
            "create new": "Create new {{what}}",
            "sort out your": `Create directories to sort out your {{what}}`,
            "name of": `Name of the {{what}}`
        }
    },
    "fr": {
        /* spell-checker: disable */
        "CreateFileOrDirectoryModal": {
            ...common.fr,
            "directory": "dossier",
            "create new": "Crée nouveau {{what}}",
            "sort out your": "Cree des répértoires pour hierarchiser vos {{what}}",
            "name of": `Nom du {{what}}`
        }
        /* spell-checker: enable */
    }

});
