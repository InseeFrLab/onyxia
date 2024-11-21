import { i18nBuilder } from "keycloakify/login";
import type { ThemeName } from "../kc.gen";

const { useI18n, ofTypeI18n } = i18nBuilder
    .withThemeName<ThemeName>()
    .withCustomTranslations({
        en: {
            lowerCaseAlphanumericalCharsOnly: "Only lowercase alphanumerical characters",
            "allowed email domains": "Allowed domains",
            "this email domain is not allowed": "This email domain is not allowed",
            "minimum length": "Minimum length: {0}",
            "must be different from username": "Pass can't be the username",
            "password mismatch": "Passwords mismatch",
            "go back": "Go back",
            "form not filled properly yet":
                "Please make sure the form is properly filled out",
            "must respect the pattern": "Must respect the pattern",
            or: "or",
            doRegister: "Create an account",
            tabTitleSuffix: "Sign in"
        },
        /* spell-checker: disable */
        fr: {
            lowerCaseAlphanumericalCharsOnly:
                "Uniquement des caractères alphanumériques en minuscules",
            "allowed email domains": "Domaines autorisés",
            "this email domain is not allowed":
                "Ce domaine de messagerie n'est pas autorisé",
            "minimum length": "Longueur minimum {0}",
            "must be different from username": "Ne peut pas être le nom d'utilisateur",
            "password mismatch": "Les deux mots de passe ne correspondent pas",
            "go back": "Retour",
            "form not filled properly yet":
                "Veuillez vérifier que vous avez bien rempli le formulaire",
            "must respect the pattern": "Doit respecter le format",
            or: "ou",
            doRegister: "Créer un compte",
            tabTitleSuffix: "Connexion"
        },
        de: {
            lowerCaseAlphanumericalCharsOnly: "Nur Kleinbuchstaben und Zahlen",
            "allowed email domains": "Erlaubte Domänen",
            "this email domain is not allowed": "Diese E-Mail-Domäne ist nicht erlaubt",
            "minimum length": "Mindestlänge: {0}",
            "must be different from username":
                "Passwort darf nicht gleich dem Benutzernamen sein",
            "password mismatch": "Passwörter stimmen nicht überein",
            "go back": "Zurückgehen",
            "form not filled properly yet":
                "Bitte stellen Sie sicher, dass das Formular richtig ausgefüllt ist",
            "must respect the pattern": "Muss dem Muster entsprechen",
            or: "oder",
            doRegister: "Konto erstellen",
            tabTitleSuffix: "Anmeldung"
        },
        fi: {
            lowerCaseAlphanumericalCharsOnly: "Vain pienet kirjaimet ja numerot",
            "allowed email domains": "Sallitut sähköpostidomainit",
            "this email domain is not allowed": "Tämä sähköpostidomain ei ole sallittu",
            "minimum length": "Minimipituus: {0}",
            "must be different from username":
                "Salasanan on oltava eri kuin käyttäjänimi",
            "password mismatch": "Salasanat eivät täsmää",
            "go back": "Palaa takaisin",
            "form not filled properly yet": "Varmista, että lomake on täytetty oikein",
            "must respect the pattern": "On noudatettava kaavaa",
            or: "tai",
            doRegister: "Luo tili",
            tabTitleSuffix: "Kirjaudu sisään"
        },
        it: {
            lowerCaseAlphanumericalCharsOnly: "Solo caratteri alfanumerici minuscoli",
            "allowed email domains": "Domini email consentiti",
            "this email domain is not allowed": "Questo dominio email non è consentito",
            "minimum length": "Lunghezza minima: {0}",
            "must be different from username":
                "La password non può essere uguale all'username",
            "password mismatch": "Le password non corrispondono",
            "go back": "Torna indietro",
            "form not filled properly yet":
                "Assicurati che il modulo sia compilato correttamente",
            "must respect the pattern": "Deve rispettare il pattern",
            or: "o",
            doRegister: "Crea un account",
            tabTitleSuffix: "Accedi"
        },
        es: {
            lowerCaseAlphanumericalCharsOnly:
                "Solo caracteres alfanuméricos en minúsculas",
            "allowed email domains": "Dominios permitidos",
            "this email domain is not allowed":
                "Este dominio de correo electrónico no está permitido",
            "minimum length": "Longitud mínima: {0}",
            "must be different from username":
                "La contraseña no puede ser el nombre de usuario",
            "password mismatch": "Las contraseñas no coinciden",
            "go back": "Regresar",
            "form not filled properly yet":
                "Por favor, asegúrese de que el formulario esté correctamente lleno",
            "must respect the pattern": "Debe respetar el patrón",
            or: "o",
            doRegister: "Crear una cuenta",
            tabTitleSuffix: "Iniciar sesión"
        },
        nl: {
            lowerCaseAlphanumericalCharsOnly: "Alleen kleine alfanumerieke tekens",
            "allowed email domains": "Toegestane e-maildomeinen",
            "this email domain is not allowed": "Dit e-maildomein is niet toegestaan",
            "minimum length": "Minimale lengte: {0}",
            "must be different from username":
                "Wachtwoord mag niet hetzelfde zijn als gebruikersnaam",
            "password mismatch": "Wachtwoorden komen niet overeen",
            "go back": "Ga terug",
            "form not filled properly yet":
                "Zorg ervoor dat het formulier correct is ingevuld",
            "must respect the pattern": "Moet het patroon respecteren",
            or: "of",
            doRegister: "Maak een account aan",
            tabTitleSuffix: "Inloggen"
        },
        no: {
            lowerCaseAlphanumericalCharsOnly: "Kun små bokstaver og tall",
            "allowed email domains": "Tillatte e-postdomener",
            "this email domain is not allowed": "Denne e-postdomenet er ikke tillatt",
            "minimum length": "Minimum lengde: {0}",
            "must be different from username":
                "Passordet kan ikke være det samme som brukernavnet",
            "password mismatch": "Passordene samsvarer ikke",
            "go back": "Gå tilbake",
            "form not filled properly yet":
                "Vennligst sørg for at skjemaet er fylt ut riktig",
            "must respect the pattern": "Må respektere mønsteret",
            or: "eller",
            doRegister: "Opprett konto",
            tabTitleSuffix: "Logg inn"
        },
        "zh-CN": {
            lowerCaseAlphanumericalCharsOnly: "仅小写字母和数字",
            "allowed email domains": "允许的电子邮件域",
            "this email domain is not allowed": "不允许此电子邮件域",
            "minimum length": "最小长度：{0}",
            "must be different from username": "密码不能与用户名相同",
            "password mismatch": "密码不匹配",
            "go back": "返回",
            "form not filled properly yet": "请确保表单填写正确",
            "must respect the pattern": "必须遵循模式",
            or: "或",
            doRegister: "创建账户",
            tabTitleSuffix: "登录"
        }
        /* spell-checker: enable */
    })
    .build();

type I18n = typeof ofTypeI18n;

export { useI18n, type I18n };
