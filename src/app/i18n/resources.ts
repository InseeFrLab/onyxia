import { symToStr } from "app/tools/symToStr";
import { Reflect } from "app/tools/Reflect";
import { id } from "tsafe/id";

import { ExplorerButtonBar } from "app/components/shared/Explorer/ExplorerButtonBar";
import { Explorer } from "app/components/shared/Explorer";
import { ExplorerItems } from "app/components/shared/Explorer/ExplorerItems";
import { ExplorerItem } from "app/components/shared/Explorer/ExplorerItem";
import { MySecrets } from "app/components/pages/MySecrets";
import { MySecretsEditor } from "app/components/pages/MySecrets/MySecretsEditor";
import { MySecretsEditorRow } from "app/components/pages/MySecrets/MySecretsEditor/MySecretsEditorRow";
import { Header } from "app/components/shared/Header";
import { LeftBar } from "app/components/App/LeftBar";
import { FourOhFour } from "app/components/pages/FourOhFour";
import { PortraitModeUnsupported } from "app/components/pages/PortraitModeUnsupported";
import { Home } from "app/components/pages/Home";
import { Register } from "app/components/KcApp/Register";
import { AccountField } from "app/components/pages/Account/AccountField";
import { Account } from "app/components/pages/Account/Account";
import { AccountInfoTab } from "app/components/pages/Account/tabs/AccountInfoTab";
import { AccountIntegrationsTab } from "app/components/pages/Account/tabs/AccountIntegrationsTab";
import { AccountStorageTab } from "app/components/pages/Account/tabs/AccountStorageTab";
import { AccountUserInterfaceTab } from "app/components/pages/Account/tabs/AccountUserInterfaceTab";
import { CatalogExplorerSearchBar } from "app/components/pages/Catalog/CatalogExplorer/CatalogExplorerSearchBar";
import { CatalogExplorerCards } from "app/components/pages/Catalog/CatalogExplorer/CatalogExplorerCards";
import { CatalogExplorerCard } from "app/components/pages/Catalog/CatalogExplorer/CatalogExplorerCards/CatalogExplorerCard";
import { Catalog } from "app/components/pages/Catalog";
import { Footer } from "app/components/App/Footer";
import { CatalogLauncherMainCard } from "app/components/pages/Catalog/CatalogLauncher/CatalogLauncherMainCard";
import { CatalogLauncherConfigurationCard } from "app/components/pages/Catalog/CatalogLauncher/CatalogLauncherConfigurationCard";
import { MyServices } from "app/components/pages/MyServices";
import { MyServicesButtonBar } from "app/components/pages/MyServices/MyServicesButtonBar";
import { MyServicesCard } from "app/components/pages/MyServices/MyServicesCards/MyServicesCard";
import { MyServicesRunningTime } from "app/components/pages/MyServices/MyServicesCards/MyServicesCard/MyServicesRunningTime";
import { ChangeLanguage } from "app/components/shared/ChangeLanguage";
import { MyServicesSavedConfigOptions } from "app/components/pages/MyServices/MyServicesSavedConfigs/MyServicesSavedConfig/MyServicesSavedConfigOptions";
import { MyServicesSavedConfig } from "app/components/pages/MyServices/MyServicesSavedConfigs/MyServicesSavedConfig";
import { MyServicesSavedConfigs } from "app/components/pages/MyServices/MyServicesSavedConfigs";
import { MyServicesCards } from "app/components/pages/MyServices/MyServicesCards";

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
    [symToStr({ PortraitModeUnsupported })]: Reflect<PortraitModeUnsupported.I18nScheme>(),
    [symToStr({ FourOhFour })]: Reflect<FourOhFour.I18nScheme>(),
    [symToStr({ Home })]: Reflect<Home.I18nScheme>(),
    [symToStr({ Register })]: Reflect<Register.I18nScheme>(),
    [symToStr({ AccountField })]: Reflect<AccountField.I18nScheme>(),
    [symToStr({ Account })]: Reflect<Account.I18nScheme>(),
    [symToStr({ AccountInfoTab })]: Reflect<AccountInfoTab.I18nScheme>(),
    [symToStr({ AccountIntegrationsTab })]: Reflect<AccountIntegrationsTab.I18nScheme>(),
    [symToStr({ AccountStorageTab })]: Reflect<AccountStorageTab.I18nScheme>(),
    [symToStr({ AccountUserInterfaceTab })]: Reflect<AccountUserInterfaceTab.I18nScheme>(),
    [symToStr({ CatalogExplorerSearchBar })]: Reflect<CatalogExplorerSearchBar.I18nScheme>(),
    [symToStr({ CatalogExplorerCard })]: Reflect<CatalogExplorerCard.I18nScheme>(),
    [symToStr({ CatalogExplorerCards })]: Reflect<CatalogExplorerCards.I18nScheme>(),
    [symToStr({ Catalog })]: Reflect<Catalog.I18nScheme>(),
    [symToStr({ Footer })]: Reflect<Footer.I18nScheme>(),
    [symToStr({ CatalogLauncherMainCard })]: Reflect<CatalogLauncherMainCard.I18nScheme>(),
    [symToStr({ CatalogLauncherConfigurationCard })]: Reflect<CatalogLauncherConfigurationCard.I18nScheme>(),
    [symToStr({ MyServices })]: Reflect<MyServices.I18nScheme>(),
    [symToStr({ MyServicesButtonBar })]: Reflect<MyServicesButtonBar.I18nScheme>(),
    [symToStr({ MyServicesCard })]: Reflect<MyServicesCard.I18nScheme>(),
    [symToStr({ MyServicesRunningTime })]: Reflect<MyServicesRunningTime.I18nScheme>(),
    [symToStr({ ChangeLanguage })]: Reflect<ChangeLanguage.I18nScheme>(),
    [symToStr({ MyServicesSavedConfigOptions })]: Reflect<MyServicesSavedConfigOptions.I18nScheme>(),
    [symToStr({ MyServicesSavedConfig })]: Reflect<MyServicesSavedConfig.I18nScheme>(),
    [symToStr({ MyServicesSavedConfigs })]: Reflect<MyServicesSavedConfigs.I18nScheme>(),
    [symToStr({ MyServicesCards })]: Reflect<MyServicesCards.I18nScheme>(),
};

export type I18nSchemes = typeof reflectedI18nSchemes;

export type Translations = { [K in keyof I18nSchemes]: ToTranslations<I18nSchemes[K]> };

export type SupportedLanguage = "en" | "fr";

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
            "text1": "My account",
            "text2": "Access your different account information.",
            "text3p1": "Configure your usernames, emails, passwords and personal access tokens directly connected to your services.",
            "personal tokens": "personal tokens",
            "text3p2": "can be accessed and configured here.",
            "personal tokens tooltip": "Password that are generated for you and that have a given validity period"
        },
        "AccountInfoTab": {
            "general information": "General information",
            "user id": "User id (IDEP)",
            "full name": "Full name",
            "email": "Email address",
            "password": "Change account password",
            "auth information": "Onyxia authentication information",
            "auth information helper": `Theses information allows you to identify yourself
            within the platform and the various services.`,
            "ip address": "IP Address"
        },
        "AccountIntegrationsTab": {
            "git section title": "Git configuration",
            "git section helper": `To ensure that you appear from your services 
            as the author of Git contributions`,
            "gitName": "Username for Git",
            "gitEmail": "Email for Git",
            "third party tokens section title": "Connect your Gitlab, Github and Kaggle accounts",
            "third party tokens section helper": `
                Connect your services to external accounts using 
                personal access tokens and environment variables
            `,
            "personal token": "{{serviceName}} personal access token",
            "link for token creation": "Create your {{serviceName}} token.",
            "accessible as env": "Accessible withing your services as the environnement variable"
        },
        "AccountStorageTab": {
            "credentials section title": "Connect your data to your services",
            "credentials section helper": "Amazon-compatible MinIO object storage (AWS S3). This information is already filled in automatically.",
            "accessible as env": "Accessible withing your services as the environnement variable:",
            "init script section title": "To access your storage outside of datalab services",
            "init script section helper": "Download or copy the init script in the programming language of your choice.",
            "valid until": "Valid until {{when}}"
        },
        "AccountUserInterfaceTab": {
            "title": "Interface preferences",
            "enable dark mode": "Enable dark mode",
            "dark mode helper": "Low light interface theme with dark colored background.",
            "enable beta": "Enable beta-test mode",
            "beta mode helper": "For advanced platform configurations and features.",
        },
        "AccountField": {
            "copy tooltip": "Copy in clipboard",
            "language": "Change language",
            "s3 scripts": "Init script",
            "service password": "Password for your services",
            "service password helper text": `This password is required to log in to all of your services. 
            It is generated automatically and renews itself regularly.`,
            "OIDC Access token": "OIDC Personal access token",
            "OIDC Access token helper text": `Valid until {{when}}`,
            "not yet defined": "Not yet defined",
            "reset helper dialogs": "Reset instructions windows",
            "reset": "Reset",
            "reset helper dialogs helper text": "Reset message windows that have been requested not to be shown again"
        },
        "Register": {
            "required field": "Required field",
            "not a valid": "This is not a valid {{what}}",
            "allowed email domains": "Allowed domains",
            "alphanumerical chars only": "Only alphanumerical characters",
            "username question mark helper text": "No spaces or special characters (#,*,é,...)",
            "minimum length": "Minimum length: {{n}}",
            "must be different from username": "Pass can't be the username",
            "password mismatch": "Passwords mismatch",
            "go back": "Go back",
            "form not filled properly yet": "Please make sure the form is properly filled out"
        },
        "MySecrets": {
            ...common.en,
            "page title": "My Secrets",
            "what this page is used for":
                `Here can be defined variables that will be accessible in you services under the form of environnement variable.`,
            "to learn more": "To learn more about secrets management,",
            "read our documentation": "read our documentation."
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
            "use secret dialog title": "Use in a service",
            "use secret dialog subtitle": "The path of the secret have been copied",
            "use secret dialog body": `
                When you launch a service (RStudio, Jupyter, ect) go to the
                secret tab and and paste the path of the secret provided for this 
                purpose.
                The values will be injected as environnement variable.
            `,
            "use secret dialog ok": "Got it",
            "do not display again": "Don't display again"
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
            "toggle isExpanded": "Reduce",
            "home": "Home",
            "account": "My account",
            "catalogExplorer": "Services catalog",
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
        "PortraitModeUnsupported": {
            "portrait mode not supported": "Portrait mode isn't supported yet",
            "instructions": "To use this app on your phone please enable the rotation sensor and turn your phone."
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
        },
        "CatalogExplorerSearchBar": {
            "search": "Search"
        },
        "CatalogExplorerCard": {
            "launch": "Launch",
            "learn more": "Learn more"
        },
        "CatalogExplorerCards": {
            "show more": "Show more",
            "no service found": "No service found",
            "no result found": "No result found for {{forWhat}}",
            "check spelling": "Please check your spelling or try widening your search.",
            "go back": "Back to main services",
            "main services": "Main services",
            "all services": "All services",
            "search results": "Search result"
        },
        "Catalog": {
            "header text1": "Services catalog",
            "header text2": "Explore, launch and configure services with just a few clicks.",
            "all services are open sources": "All services are open source, ",
            "contribute to the catalog": "contribute to the {{catalogId}} catalog",
            "contribute to the package": "Find the sources of the {{packageName}} package ",
            "here": "here"
        },
        "Footer": {
            "contribute": "Contribute",
            "terms of service": "Terms of service"
        },
        "CatalogLauncherMainCard": {
            "card title": "Create your personal services",
            "friendly name": "Friendly name",
            "launch": "Launch",
            "cancel": "Cancel",
            "copy url helper text": "Copy url to restore this configuration",
            "save configuration": "Save this configuration"
        },
        "CatalogLauncherConfigurationCard": {
            "global config": "Global configuration",
            "configuration": "{{packageName}} configurations",
            "dependency": "{{dependencyName}} dependency",
            "launch of a service": "A {{dependencyName}} service will be launched",
        },
        "MyServices": {
            "text1": "My Services",
            "text2": "Access your running services",
            "text3": "Copy your service's password by clicking on the key",
            "running services": "Running services"
        },
        "MyServicesButtonBar": {
            "refresh": "Refresh",
            "launch": "New service",
            "password": "Copy the services password",
            "trash": "Delete all"
        },
        "MyServicesCard": {
            "service": "Service",
            "running since": "Running since: ",
            "open": "open"
        },
        "MyServicesRunningTime": {
            "launching": "Launching..."
        },
        "ChangeLanguage": {
            "change language": "Change language"
        },
        "MyServicesSavedConfigOptions": {
            "copy link": "Copy URL link",
            "remove bookmark": "Delete"
        },
        "MyServicesSavedConfig": {
            "launch": "Launch"
        },
        "MyServicesSavedConfigs": {
            "saved": "Saved",
            "show all": "Show all ({{n}})"
        },
        "MyServicesCards": {
            "running services": "Running services",
            "no services running": "You don't have any service running",
            "launch one": "Click here to launch one"
        }
    },
    "fr": {
        /* spell-checker: disable */
        "Account": {
            "infos": "Information du compte",
            "third-party-integration": "Services externes",
            "storage": "Connexion au stockage",
            "user-interface": "Modes d'interface",
            "text1": "Mon compte",
            "text2": "Accèdez à vos différentes informations de compte.",
            "text3p1": "Configurez vos identifiants, e-mails, mots de passe et jetons d'accès personnels directement connectés à vos services.",
            "personal tokens": "Jetons d'accès individuel",
            "text3p2": "sont accessibles et configurables ici.",
            "personal tokens tooltip": "Ou en anglais \"token\"."
        },
        "AccountInfoTab": {
            "general information": "Informations générales",
            "user id": "Identifiant (IDEP)",
            "full name": "Nom complet",
            "email": "Adresse mail",
            "password": "Mot de passe du compte",
            "auth information": "Informations d'authentification Onyxia",
            "auth information helper": `Ces informations vous permettent de vous identifier 
            au sein de la plateforme et des différents services.`,
            "ip address": "Adresse IP"
        },
        "AccountIntegrationsTab": {
            "git section title": "Configurations Git",
            "git section helper": `Pour vous assurez que vous apparaissiez depuis vos
            services comme l'auteur des contributions Git`,
            "gitName": "Nom d'utilisateur pour Git",
            "gitEmail": "Email pour Git",
            "third party tokens section title": "Connecter vos comptes Gitlab, Github et Kaggle",
            "third party tokens section helper": `Connectez vos services à des comptes extérieurs à l'aide
            de jetons d'accès personnel et de variables d'environnement.`,
            "personal token": "Jeton d'accès personnel {{serviceName}}",
            "link for token creation": "Créer votre jeton {{serviceName}}.",
            "accessible as env": "Accessible au sein de vos services en tant que la variable d'environnement"
        },
        "AccountStorageTab": {
            "credentials section title": "Connecter vos données à vos services",
            "credentials section helper": "Stockage object MinIO compatible Amazon (AWS S3). Ces informations sont déjà renseignés automatiquement.",
            "accessible as env": "Accessible au sein de vos services en tant que la variable d'environnement",
            "init script section title": "Pour accèder au stockage en dehors des services du datalab",
            "init script section helper": `Téléchargez ou copiez le script d'initialisation dans le langage de programmation de votre choix.`,
            "valid until": "Valides jusqu'a {{when}}"
        },
        "AccountUserInterfaceTab": {
            "title": "Configurer le mode d'interface",
            "enable dark mode": "Activer le mode sombre",
            "dark mode helper": "Thème de l’interface à faible luminosité avec un fond de couleur sombre.",
            "enable beta": "Activer le mode béta-testeur",
            "beta mode helper": "Pour des configurations et fonctionnalités avancées de la plateforme.",
        },
        "AccountField": {
            "copy tooltip": "Copier dans le press papier",
            "language": "Changer la langue",
            "s3 scripts": "Script d'initialisation",
            "service password": "Mot de passe pour vos services",
            "service password helper text": `Ce mot de passe est nécessaire pour vous connecter à tous vos services. 
            Il est généré automatiquement et se renouvelle régulièrement.`,
            "OIDC Access token": "Jeton d'accès personnel OIDC",
            "OIDC Access token helper text": `Valide jusqu'a {{when}}`,
            "not yet defined": "Non définie",
            "reset helper dialogs": "Réinitialiser les fenêtres d'instructions",
            "reset": "Réinitialiser",
            "reset helper dialogs helper text": "Réinitialiser les fenêtres de messages que vous avez demandé de ne plus afficher"
        },
        "Register": {
            "required field": "Champ requis",
            "not a valid": "Pas un {{what}} valide",
            "allowed email domains": "Domaines autorisés",
            "alphanumerical chars only": "Caractère alphanumérique uniquement",
            "username question mark helper text": "Pas d'espace ni de caractères spéciaux (#,*,é, ect)",
            "minimum length": "Longueur minimum {{n}}",
            "must be different from username": "Ne peut pas être le nom d'utilisateur",
            "password mismatch": "Les deux mots de passe ne correspondent pas",
            "go back": "Retour",
            "form not filled properly yet": "Veuillez vérifier que vous avez bien rempli le formulaire"
        },
        "MySecrets": {
            ...common.fr,
            "page title": "Mes secrets",
            "what this page is used for": `Stockez ici des secrets qui seront accessibles sous forme de variables d'environnement dans vos services.`,
            "to learn more": "Pour en savoir plus sur l’utilisation de secrets,",
            "read our documentation": "lisez notre documentation."
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

            "use secret dialog title": "Utiliser dans un service",
            "use secret dialog subtitle": "Le chemin du secret a été copié.",
            "use secret dialog body": `
                Au moment de lancer un service (RStudio, Jupyter), rendez-vous
                dans l'onglet 'VAULT' et collez le chemin du secret dans le champ prévu à cet effet.
                Vos clefs valeurs seront disponibles sous forme de variables d'environnement.
            `,
            "use secret dialog ok": "J'ai compris",
            "do not display again": "Ne plus afficher"
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
            "catalogExplorer": "Catalogue de services",
            "myServices": "Mes Services",
            "mySecrets": "Mes Secrets",
            "myBuckets": "Mes Fichiers",
            "trainings": "Formations",
            "sharedServices": "Services partagés"
        },
        "FourOhFour": {
            "not found": "Page non trouvée"
        },
        "PortraitModeUnsupported": {
            "portrait mode not supported": "Le mode portrait n'est pas encore supporter",
            "instructions": "Pour utiliser cette application depuis votre mobile, veuillez activer le capteur de rotation et tourner votre téléphone."
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
        },
        "CatalogExplorerSearchBar": {
            "search": "Rechercher"
        },
        "CatalogExplorerCard": {
            "launch": "Lancer",
            "learn more": "En savoir plus"
        },
        "CatalogExplorerCards": {
            "show more": "Afficher tous",
            "no service found": "Service non trouvé",
            "no result found": "Aucun résultat trouvé pour {{forWhat}}",
            "check spelling": `Vérifiez que le nom du service est correctement 
            orthographié ou essayez d'élargir votre recherche.`,
            "go back": "Retourner aux principaux services",
            "main services": "Principaux services",
            "all services": "Tous les services",
            "search results": "Résultats de la recherche"
        },
        "Catalog": {
            "header text1": "Catalogue de services",
            "header text2": "Explorez, lancez et configurez des services en quelques clics seulement.",
            "all services are open sources": "Tous les services proposés sont open source, ",
            "contribute to the catalog": "contribuer au catalogue {{catalogId}}",
            "contribute to the package": "Accéder aux sources du package {{packageName}} ",
            "here": "ici"
        },
        "Footer": {
            "contribute": "Contribuer au projet",
            "terms of service": "Conditions d'utilisation"
        },
        "CatalogLauncherMainCard": {
            "card title": "Crée votre propre service",
            "friendly name": "Nom personalisé",
            "launch": "Lancer",
            "cancel": "Annuler",
            "copy url helper text": "Copier l'URL permettant de restaurer cette configuration",
            "save configuration": "Enregistrer cette configuration"
        },
        "CatalogLauncherConfigurationCard": {
            "global config": "Configurations globales",
            "configuration": "Configuration {{packageName}}",
            "dependency": "Dépendance {{dependencyName}}",
            "launch of a service": "Lancement d'un service {{dependencyName}}",
        },
        "MyServices": {
            "text1": "Mes services",
            "text2": "Lancez, visualisr et gérer rapidement vos différents services en cours.",
            "text3": "Récupérer le mot de passe pour vos services en copiant la clef.",
            "running services": "Services en cours"
        },
        "MyServicesButtonBar": {
            "refresh": "Rafraîchir",
            "launch": "Nouveau service",
            "password": "Copier le mot de passe",
            "trash": "Tout supprimer"
        },
        "MyServicesCard": {
            "service": "Service",
            "running since": "En exécution depuis: ",
            "open": "ouvrir"
        },
        "MyServicesRunningTime": {
            "launching": "En cours de lancement..."
        },
        "ChangeLanguage": {
            "change language": "Changer la langue"
        },
        "MyServicesSavedConfigOptions": {
            "copy link": "Copier l'URL",
            "remove bookmark": "Supprimer"
        },
        "MyServicesSavedConfig": {
            "launch": "Lancer"
        },
        "MyServicesSavedConfigs": {
            "saved": "Enregistrés",
            "show all": "Afficher tous ({{n}})"
        },
        "MyServicesCards": {
            "running services": "Services en cours",
            "no services running": "Vous n'avez actuellement aucun service en cours d'exécution",
            "launch one": "Cliquez ici pour en lancer un"
        }
        /* spell-checker: enable */
    }

});
