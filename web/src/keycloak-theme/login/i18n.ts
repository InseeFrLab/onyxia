import { createUseI18n } from "keycloakify/login";

export const { useI18n } = createUseI18n({
    "en": {
        "alphanumericalCharsOnly": "Only alphanumerical characters",
        "allowed email domains": "Allowed domains",
        "minimum length": "Minimum length: {0}",
        "must be different from username": "Pass can't be the username",
        "password mismatch": "Passwords mismatch",
        "go back": "Go back",
        "form not filled properly yet":
            "Please make sure the form is properly filled out",
        "must respect the pattern": "Must respect the pattern",
        "or": "or",
        "doRegister": "Create an account"
    },
    "fr": {
        /* spell-checker: disable */
        "alphanumericalCharsOnly": "Caractère alphanumérique uniquement",
        "allowed email domains": "Domaines autorisés",
        "minimum length": "Longueur minimum {0}",
        "must be different from username": "Ne peut pas être le nom d'utilisateur",
        "password mismatch": "Les deux mots de passe ne correspondent pas",
        "go back": "Retour",
        "form not filled properly yet":
            "Veuillez vérifier que vous avez bien rempli le formulaire",
        "must respect the pattern": "Doit respecter le format",
        "or": "ou",
        "doRegister": "Créer un compte"
        /* spell-checker: enable */
    }
});

export type I18n = NonNullable<ReturnType<typeof useI18n>>;
