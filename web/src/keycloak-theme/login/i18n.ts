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
        "doRegister": "Create an account",
        "tabTitleSuffix": "Sign in"
    },
    /* spell-checker: disable */
    "fr": {
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
        "doRegister": "Créer un compte",
        "tabTitleSuffix": "Connexion"
    },
    "de": {
        "alphanumericalCharsOnly": "Nur alphanumerische Zeichen",
        "allowed email domains": "Erlaubte Domänen",
        "minimum length": "Mindestlänge: {0}",
        "must be different from username":
            "Passwort darf nicht gleich dem Benutzernamen sein",
        "password mismatch": "Passwörter stimmen nicht überein",
        "go back": "Zurückgehen",
        "form not filled properly yet":
            "Bitte stellen Sie sicher, dass das Formular richtig ausgefüllt ist",
        "must respect the pattern": "Muss dem Muster entsprechen",
        "or": "oder",
        "doRegister": "Konto erstellen",
        "tabTitleSuffix": "Anmeldung"
    },
    "fi": {
        "alphanumericalCharsOnly": "Vain alfanumeeriset merkit",
        "allowed email domains": "Sallitut sähköpostidomainit",
        "minimum length": "Minimipituus: {0}",
        "must be different from username": "Salasanan on oltava eri kuin käyttäjänimi",
        "password mismatch": "Salasanat eivät täsmää",
        "go back": "Palaa takaisin",
        "form not filled properly yet": "Varmista, että lomake on täytetty oikein",
        "must respect the pattern": "On noudatettava kaavaa",
        "or": "tai",
        "doRegister": "Luo tili",
        "tabTitleSuffix": "Kirjaudu sisään"
    },
    "it": {
        "alphanumericalCharsOnly": "Solo caratteri alfanumerici",
        "allowed email domains": "Domini email consentiti",
        "minimum length": "Lunghezza minima: {0}",
        "must be different from username":
            "La password non può essere uguale all'username",
        "password mismatch": "Le password non corrispondono",
        "go back": "Torna indietro",
        "form not filled properly yet":
            "Assicurati che il modulo sia compilato correttamente",
        "must respect the pattern": "Deve rispettare il pattern",
        "or": "o",
        "doRegister": "Crea un account",
        "tabTitleSuffix": "Accedi"
    },
    "nl": {
        "alphanumericalCharsOnly": "Alleen alfanumerieke karakters",
        "allowed email domains": "Toegestane e-maildomeinen",
        "minimum length": "Minimale lengte: {0}",
        "must be different from username":
            "Wachtwoord mag niet hetzelfde zijn als gebruikersnaam",
        "password mismatch": "Wachtwoorden komen niet overeen",
        "go back": "Ga terug",
        "form not filled properly yet":
            "Zorg ervoor dat het formulier correct is ingevuld",
        "must respect the pattern": "Moet het patroon respecteren",
        "or": "of",
        "doRegister": "Maak een account aan",
        "tabTitleSuffix": "Inloggen"
    },
    "no": {
        "alphanumericalCharsOnly": "Bare alfanumeriske tegn",
        "allowed email domains": "Tillatte e-postdomener",
        "minimum length": "Minimum lengde: {0}",
        "must be different from username":
            "Passordet kan ikke være det samme som brukernavnet",
        "password mismatch": "Passordene samsvarer ikke",
        "go back": "Gå tilbake",
        "form not filled properly yet":
            "Vennligst sørg for at skjemaet er fylt ut riktig",
        "must respect the pattern": "Må respektere mønsteret",
        "or": "eller",
        "doRegister": "Opprett konto",
        "tabTitleSuffix": "Logg inn"
    },
    "zh-CN": {
        "alphanumericalCharsOnly": "仅限字母数字字符",
        "allowed email domains": "允许的电子邮件域",
        "minimum length": "最小长度：{0}",
        "must be different from username": "密码不能与用户名相同",
        "password mismatch": "密码不匹配",
        "go back": "返回",
        "form not filled properly yet": "请确保表单填写正确",
        "must respect the pattern": "必须遵循模式",
        "or": "或",
        "doRegister": "创建账户",
        "tabTitleSuffix": "登录"
    }
    /* spell-checker: enable */
});

export type I18n = NonNullable<ReturnType<typeof useI18n>>;
