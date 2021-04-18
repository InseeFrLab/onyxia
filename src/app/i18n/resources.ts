import { symToStr } from "app/tools/symToStr";
import { Reflect } from "app/tools/Reflect";
import { id } from "evt/tools/typeSafety/id";

import { ExplorerButtonBar } from "app/components/shared/Explorer/ExplorerButtonBar";
import { Explorer } from "app/components/shared/Explorer/Explorer";
import { ExplorerItems } from "app/components/shared/Explorer/ExplorerItems";
import { ExplorerItem } from "app/components/shared/Explorer/ExplorerItem";
import { MySecrets } from "app/components/pages/MySecrets/MySecrets";
import { MySecretsEditor } from "app/components/pages/MySecrets/MySecretsEditor/MySecretsEditor";
import { MySecretsEditorRow } from "app/components/pages/MySecrets/MySecretsEditor/MySecretsEditorRow";
import { Header } from "app/components/shared/Header";
import { LeftBar } from "app/components/App/LeftBar";
import { FourOhFour } from "app/components/App/FourOhFour";
import { Home } from "app/components/pages/Home";
import { Register } from "app/components/KcApp/Register";
import { AccountField } from "app/components/pages/Account/AccountField";
import { Account } from "app/components/pages/Account/Account";
import { AccountInfoTab } from "app/components/pages/Account/tabs/AccountInfoTab";

export type Scheme = {
    [key: string]: undefined | Record<string, string>;
};

type ToTranslations<S extends Scheme> = {
    [key in keyof S]: string;
};

const reflectedI18nSchemes = {
    [symToStr({ MySecrets })]: Reflect<MySecrets.I18nScheme>(),
    [symToStr({ ExplorerButtonBar })]: Reflect<ExplorerButtonBar.I18nScheme>(),
    [symToStr({ Explorer })]: Reflect<Explorer.I18nScheme>(),
    [symToStr({ ExplorerItem })]: Reflect<ExplorerItem.I18nScheme>(),
    [symToStr({ ExplorerItems })]: Reflect<ExplorerItems.I18nScheme>(),
    [symToStr({ MySecretsEditor })]: Reflect<MySecretsEditor.I18nScheme>(),
    [symToStr({ MySecretsEditorRow })]: Reflect<MySecretsEditorRow.I18nScheme>(),
    [symToStr({ Header })]: Reflect<Header.I18nScheme>(),
    [symToStr({ LeftBar })]: Reflect<LeftBar.I18nScheme>(),
    [symToStr({ FourOhFour })]: Reflect<FourOhFour.I18nScheme>(),
    [symToStr({ Home })]: Reflect<Home.I18nScheme>(),
    [symToStr({ Register })]: Reflect<Register.I18nScheme>(),
    [symToStr({ AccountField })]: Reflect<AccountField.I18nScheme>(),
    [symToStr({ Account })]: Reflect<Account.I18nScheme>(),
    [symToStr({ AccountInfoTab })]: Reflect<AccountInfoTab.I18nScheme>(),
};

export type I18nSchemes = typeof reflectedI18nSchemes;

export type Translations = { [K in keyof I18nSchemes]: ToTranslations<I18nSchemes[K]> };

export type SupportedLanguage =  "en" | "fr";

const common = id<Record<SupportedLanguage, Record<"file" | "secret" | "create" | "cancel" | "rename" | "delete" | "ok" | "here", string>>>({
    "en": {
        "file": "file",
        "secret": "secret",
        "create": "create",
        "cancel": "cancel",
        "rename": "rename",
        "delete": "delete",
        "ok": "Ok",
        "here": "here"
    },
    "fr": {
        /* spell-checker: disable */
        "file": "fichier",
        "secret": "secret",
        "create": "crée",
        "cancel": "annuler",
        "rename": "renommer",
        "delete": "supprimer",
        "ok": "Ok",
        "here": "ici"
        /* spell-checker: enable */
    }
})

export const resources = id<Record<SupportedLanguage, Translations>>({
    "en": {
        "Account": {
            "infos": "Account infos",
            "third-party-integration": "external services",
            "storage": "Connect to storage",
            "user-interface": "Interface preferences",
            "text1": "Account",
            "text2": "Access and configure your service information",
            "text3p1": "Your id, e-mails, password and",
            "personal tokens": "personal tokens",
            "text3p2": "can be accessed and configured here",
            "personal tokens tooltip": "Password that are generated for you and that have a given validity period"
        },
        "AccountInfoTab": {
            "general information": "General information",
            "user id": "User id (IDEP)",
            "full name": "Full name",
            "email": "Email address",
            "password": "Account password",
            "auth information": "Onyxia authentication information",
            "auth information helper": `Theses different values let you authenticate yourself 
            against the different services offered on the platform`,
            "ip address": "IP Address"
        },
        "AccountField": {
            "copy tooltip": "Copy in clipboard",
            "language": "Change language",
            "s3 scripts": "Init script",
            "service password": "Password for your services",
            "service password helper text": "This password is used to connect to all services.",
            "OIDC Access token": "OIDC Personal access token",
            "OIDC Access token helper text": `Valid until {{when}}`
        },
        "Register": {
            "required field": "Required field",
            "not a valid": "This is not a valid {{what}}",
            "allowed email domain": "Allowed domain {{list}}",
            "alphanumerical chars only": "Only alphanumerical characters",
            "minimum length": "Minimum length: {{n}}",
            "must be different from username": "Pass can't be the username",
            "password mismatch": "Passwords mismatch",
            "go back": "Go back",
            "form not filled properly yet": "Please make sure the form is properly filled out"
        },
        "MySecrets": {
            ...common.en,
            "page title": "My Secrets",
            "what this page is used for": `
            Here can be defined variables that will be accessible in you services under the form of environnement variable.`,
            "watch the video": "Watch the video demonstration",
        },
        "ExplorerItem": {
            "description": "description"
        },
        "ExplorerButtonBar": {
            ...common.en,
            "copy path": "Use in a service",
            "create directory": "Create directory",
            "create what": "Create {{what}}",
            "refresh": "refresh"
        },
        "Explorer": {
            ...common.en,
            "untitled what": "untitled_{{what}}",
            "folder": "folder"

        },
        "ExplorerItems": {
            "empty directory": "This directory is empty",
        },
        "MySecretsEditor": {
            ...common.en,

            "add an entry": "Add a new variable",
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
            "invalid key invalid character": "Invalid character",
            "invalid value cannot eval": "Invalid shell expression",
            "use this secret": `Use in services`,
            "how to use a secret": `The path of this secret has been copied to you clipboard.
            Now when you launch a service (RStudio, Jupyter, ect) go to the
            secret tab and and paste the path of the secret provided for this 
            purpose.
            The values will be injected as environnement variable.
            `
        },
        "MySecretsEditorRow": {
            "key input desc": "Environnement variable name",
            "value input desc": "Environnement variable value"
        },
        "Header": {
            "login": "Login",
            "logout": "Logout"
        },
        "LeftBar": {
            "toggle isExpanded": "Collapse",
            "home": "Home",
            "account": "Account",
            "catalog": "Catalog",
            "myServices": "My Services",
            "mySecrets": "My Secrets",
            "myBuckets": "My Files",
            "trainings": "Trainings",
            "sharedServices": "Shared services"
            //"tour": "Guided Tour"
        },
        "FourOhFour": {
            "not found": "Page not found"
        },
        "Home": {
            "welcome": `Welcome {{who}}!`,
            "title": "Welcome ont the SSP Cloud's datalab",
            "start tour": "Start tour",
            "logIn": "Login",
            "subtitle": "Work with Python or R, enjoy all the computing power you need!",
            "cardTitle1": "An ergonomic environment and on-demand services",
            "cardTitle2": "An active and enthusiastic community at your service",
            "cardTitle3": "Fast, flexible and online data storage",
            "cardText1": "Analyze data, perform distributed computing and take advantage of a large catalog of services. Reserve the computing power you need.",
            "cardText2": "Use and share the resources available to you: tutorials, training and exchange channels.",
            "cardText3": "To easily access your data and those made available to you from your programs - S3 API implementation",
            "cardButton1": "Consult the catalog",
            "cardButton2": "Join the community",
            "cardButton3": "Consult the data",
            "projectTitle": "The project in a few words",
            "projectText": "With INSEE as coordinator, we want to design a shared platform of statistical and data science tool services. One of the objectives of our project is to share tools, knowledge and resources within the official statistical service (SSP). As part of a public collaboration, the project is also available in open-source.",
            "projectButton": "Contribute to the project",
            "warningTitle": "Precautions for use",
            "warningText": "The datalab is a field of exploration. Service guarantees are therefore limited: do not leave sensitive data there. Educational content must be open data. Also, this instance of Onyxia is intended to be improved based on your feedback.",
        }
    },
    "fr": {
        /* spell-checker: disable */
        "Account": {
            "infos": "Information du compte",
            "third-party-integration": "Services externes",
            "storage": "Connexion au stockage",
            "user-interface": "Modes d'interface",
            "text1": "Mon Compte",
            "text2": "Accèdez à vos différentes informations de compte.",
            "text3p1": "Vos identifiants, e-mails, mots de passe et ",
            "personal tokens": "Jetons d'accès individuel",
            "text3p2": "sont accessibles et configurables ici",
            "personal tokens tooltip": "Ou en anglais \"token\"."
        },
        "AccountInfoTab": {
            "general information": "Informations générales",
            "user id": "Identifiant (IDEP)",
            "full name": "Nom complet",
            "email": "Address mail",
            "password": "Mot de passe du compte",
            "auth information": "Informations d'authentification Onyxia",
            "auth information helper": `Ces information vous premetent de vous 
            identifier sur les différents servces offert par la platforme`,
            "ip address": "Addresse IP"
        },
        "AccountField": {
            "copy tooltip": "Copier dans le press papier",
            "language": "Changer la langue",
            "s3 scripts": "Script d'initialisation",
            "service password": "Mot de passe pour vos services",
            "service password helper text": "Ce mot de passe est utilisé pour se connecter à tous les services.",
            "OIDC Access token": "Jeton d'accès personnel OIDC",
            "OIDC Access token helper text": `Valide jusqu'a {{when}}`
        },
        "Register": {
            "required field": "Champ requis",
            "not a valid": "Pas un {{what}} valide",
            "allowed email domain": "Domaines autorisés: {{list}}",
            "alphanumerical chars only": "Caractère alphanumérique uniquement",
            "minimum length": "Longueur minimum {{n}}",
            "must be different from username": "Ne peut pas être le nom d'utilisateur",
            "password mismatch": "Les deux mots de passe ne correspondent pas",
            "go back": "Retour",
            "form not filled properly yet": "Veuillez vérifier que vous avez bien rempli le formulaire"
        },
        "MySecrets": {
            ...common.fr,
            "page title": "Mes secrets",
            "what this page is used for": `Définissez ici des variables qui seront accessibles sous forme de variable d'environnement dans vos services.`,
            "watch the video": "Visionner la vidéo de démonstration",
        },
        "ExplorerItem": {
            "description": "description"
        },
        "ExplorerButtonBar": {
            ...common.fr,
            "copy path": "Utiliser dans le service",
            "create directory": "Nouveau dossier",
            "create what": "Nouveau {{what}}",
            "refresh": "rafraîchir"
        },
        "Explorer": {
            ...common.fr,
            "untitled what": "{{what}}_sans_nom",
            "folder": "dossier"
        },
        "ExplorerItems": {
            "empty directory": "Ce répertoire est vide",
        },
        "MySecretsEditor": {
            ...common.fr,

            "add an entry": "Ajouter une variable",
            "environnement variable default name": "NOUVELLE_VARENV",
            "table of secret": "table de secret",

            "key column name": "Nom de la variable",
            "value column name": "Valeur",
            "resolved value column name": "Valeur résolue",
            "what's a resolved value": `
            Une variable d'environement peut en référencer une autre, si par example vous avez
            défini la variable PRENOM=Louis vous pouvez définir la variable NOM_COMPLET="$PRENOM"-Dupon
            qui aura comme valeur résolue «Louis-Dupon»
            `,
            "unavailable key": "Déjà utilisé",
            "invalid key empty string": "Un nom est requis",
            "invalid key _ not valid": "Ne peut pas être juste _",
            "invalid key start with digit": "Ne doit pas commencer par un chiffre",
            "invalid key invalid character": "Caractère non valide",
            "invalid value cannot eval": "Expression shell non valide",
            "use this secret": "Utiliser dans un service",
            "how to use a secret": `
            Le chemin du secret a été copié dans le presse papier!
            Au moment de lancer un service (RStudio, Jupyter), rendez-vous
            dans l'onglet 'VAULT' et collez le chemin du secret dans le champ prévu à cet effet.
            Vos clefs valeurs seront disponibles sous forme de variables d'environnement.
            `
        },
        "MySecretsEditorRow": {
            "key input desc": "Nom de la variable d'environnement",
            "value input desc": "Valeur de la variable d'environnement"
        },
        "Header": {
            "login": "Connexion",
            "logout": "Déconnexion"
        },
        "LeftBar": {
            "toggle isExpanded": "Réduire",
            "home": "Accueil",
            "account": "Mon compte",
            "catalog": "Catalogue",
            "myServices": "Mes Services",
            "mySecrets": "Mes Secrets",
            "myBuckets": "Mes Fichiers",
            "trainings": "Formations",
            "sharedServices": "Services partagés"
            //"tour": "Visite Guidée"
        },
        "FourOhFour": {
            "not found": "Page non trouvée"
        },
        "Home": {
            "welcome": `Bienvenue {{who}}!`,
            "title": "Bienvenue sur le datalab du SSP Cloud",
            "logIn": "Connexion",
            "start tour": "Visite guidée",
            "subtitle": "Travaillez avec Python ou R et disposez de la puissance dont vous avez besoin!",
            "cardTitle1": "Un environnement ergonomique et des services à la demande",
            "cardTitle2": "Une communauté active et enthousiaste à votre écoute",
            "cardTitle3": "Un espace de stockage de données rapide, flexible et en ligne",
            "cardText1": "Analysez les données, faites du calcul distribué et profitez d’un large catalogue de services. Réservez la puissance de calcul dont vous avez besoin.",
            "cardText2": "Profitez et partagez des ressources mises à votre disposition: tutoriels, formations et canaux d’échanges.",
            "cardText3": "Pour accéder facilement à vos données et à celles mises à votre disposition depuis vos programmes - Implémentation API S3",
            "cardButton1": "Consulter le catalogue",
            "cardButton2": "Rejoindre la communauté",
            "cardButton3": "Consulter des données",
            "projectTitle": "Le projet en quelques mots",
            "projectText": "Avec l'Insee en tant que coordinateur, nous souhaitons concevoir une plateforme mutualisée de services d’outils de statistique et de datascience. Un des objectifs de notre projet est de partager les outils les connaissances et des ressources au sein du service statistique public (SSP). Dans le cadre d'une collaboration publique, le projet est aussi disponible en open-source.",
            "projectButton": "Contribuer au projet",
            "warningTitle": "Précautions d’usage",
            "warningText": "Le datalab est un terrain d'exploration. Les garanties de service sont par conséquent limites: n'y laissez surtout pas de données sensibles. Le contenu pédagogique doit être de la donnée ouverte. De plus cette instance d'Onyxia a vocation à être améliorée en fonction de vos retours."
        }
        /* spell-checker: enable */
    }

});
