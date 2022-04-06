import { symToStr } from "tsafe/symToStr";
import { Reflect } from "tsafe/Reflect";
import { id } from "tsafe/id";
import { ExplorerButtonBar } from "ui/components/pages/MyFilesMySecrets/Explorer/ExplorerButtonBar";
import { Explorer } from "ui/components/pages/MyFilesMySecrets/Explorer";
import { ExplorerItems } from "ui/components/pages/MyFilesMySecrets/Explorer/ExplorerItems";
import { ExplorerItem } from "ui/components/pages/MyFilesMySecrets/Explorer/ExplorerItems/ExplorerItem";
import { MySecretsEditor } from "ui/components/pages/MyFilesMySecrets/MySecretsEditor";
import { MySecretsEditorRow } from "ui/components/pages/MyFilesMySecrets/MySecretsEditor/MySecretsEditorRow";
import { ExplorerUploadModalDropArea } from "ui/components/pages/MyFilesMySecrets/Explorer/ExplorerUploadModal/ExplorerUploadModalDropArea";
import { ExplorerUploadProgress } from "ui/components/pages/MyFilesMySecrets/Explorer/ExplorerUploadModal/ExplorerUploadProgress";
import { ExplorerUploadModal } from "ui/components/pages/MyFilesMySecrets/Explorer/ExplorerUploadModal/ExplorerUploadModal";
import { Header } from "ui/components/shared/Header";
import { App } from "ui/components/App/App";
import { FourOhFour } from "ui/components/pages/FourOhFour";
import { PortraitModeUnsupported } from "ui/components/pages/PortraitModeUnsupported";
import { Home } from "ui/components/pages/Home";
import { RegisterUserProfile } from "ui/components/KcApp/RegisterUserProfile";
import { AccountField } from "ui/components/pages/Account/AccountField";
import { Account } from "ui/components/pages/Account/Account";
import { AccountInfoTab } from "ui/components/pages/Account/tabs/AccountInfoTab";
import { AccountIntegrationsTab } from "ui/components/pages/Account/tabs/AccountIntegrationsTab";
import { AccountStorageTab } from "ui/components/pages/Account/tabs/AccountStorageTab";
import { AccountUserInterfaceTab } from "ui/components/pages/Account/tabs/AccountUserInterfaceTab";
import { CatalogLauncher } from "ui/components/pages/Catalog/CatalogLauncher/CatalogLauncher";
import { CatalogExplorerCards } from "ui/components/pages/Catalog/CatalogExplorer/CatalogExplorerCards";
import { CatalogExplorerCard } from "ui/components/pages/Catalog/CatalogExplorer/CatalogExplorerCards/CatalogExplorerCard";
import { Catalog } from "ui/components/pages/Catalog";
import { Footer } from "ui/components/App/Footer";
import { CatalogLauncherMainCard } from "ui/components/pages/Catalog/CatalogLauncher/CatalogLauncherMainCard";
import { CatalogLauncherConfigurationCard } from "ui/components/pages/Catalog/CatalogLauncher/CatalogLauncherConfigurationCard";
import { MyServices } from "ui/components/pages/MyServices";
import { MyServicesButtonBar } from "ui/components/pages/MyServices/MyServicesButtonBar";
import { MyServicesCard } from "ui/components/pages/MyServices/MyServicesCards/MyServicesCard";
import { MyServicesRunningTime } from "ui/components/pages/MyServices/MyServicesCards/MyServicesCard/MyServicesRunningTime";
import { MyServicesSavedConfigOptions } from "ui/components/pages/MyServices/MyServicesSavedConfigs/MyServicesSavedConfig/MyServicesSavedConfigOptions";
import { MyServicesSavedConfig } from "ui/components/pages/MyServices/MyServicesSavedConfigs/MyServicesSavedConfig";
import { MyServicesSavedConfigs } from "ui/components/pages/MyServices/MyServicesSavedConfigs";
import { MyServicesCards } from "ui/components/pages/MyServices/MyServicesCards";
import { LoginDivider } from "ui/components/KcApp/Login/LoginDivider";
import { MyFilesMySecrets } from "ui/components/pages/MyFilesMySecrets/MyFilesMySecrets";
import { Login } from "ui/components/KcApp/Login";
import type { Language } from "./useLng";

export type Scheme = {
    [key: string]: undefined | Record<string, string>;
};

type ToTranslations<S extends Scheme> = {
    [key in keyof S]: string;
};

// prettier-ignore
const reflectedI18nSchemes = {
    [symToStr({ ExplorerButtonBar })]: Reflect<ExplorerButtonBar.I18nScheme>(),
    [symToStr({ Explorer })]: Reflect<Explorer.I18nScheme>(),
    [symToStr({ ExplorerItem })]: Reflect<ExplorerItem.I18nScheme>(),
    [symToStr({ ExplorerItems })]: Reflect<ExplorerItems.I18nScheme>(),
    [symToStr({ MySecretsEditor })]: Reflect<MySecretsEditor.I18nScheme>(),
    [symToStr({ MySecretsEditorRow })]: Reflect<MySecretsEditorRow.I18nScheme>(),
    [symToStr({ ExplorerUploadModalDropArea })]: Reflect<ExplorerUploadModalDropArea.I18nScheme>(),
    [symToStr({ ExplorerUploadProgress })]: Reflect<ExplorerUploadProgress.I18nScheme>(),
    [symToStr({ ExplorerUploadModal })]: Reflect<ExplorerUploadModal.I18nScheme>(),
    [symToStr({ MyFilesMySecrets })]: Reflect<MyFilesMySecrets.I18nScheme>(),
    [symToStr({ Header })]: Reflect<Header.I18nScheme>(),
    [symToStr({ App })]: Reflect<App.I18nScheme>(),
    [symToStr({ PortraitModeUnsupported })]: Reflect<PortraitModeUnsupported.I18nScheme>(),
    [symToStr({ FourOhFour })]: Reflect<FourOhFour.I18nScheme>(),
    [symToStr({ Home })]: Reflect<Home.I18nScheme>(),
    [symToStr({ RegisterUserProfile })]: Reflect<RegisterUserProfile.I18nScheme>(),
    [symToStr({ AccountField })]: Reflect<AccountField.I18nScheme>(),
    [symToStr({ Account })]: Reflect<Account.I18nScheme>(),
    [symToStr({ AccountInfoTab })]: Reflect<AccountInfoTab.I18nScheme>(),
    [symToStr({ AccountIntegrationsTab })]: Reflect<AccountIntegrationsTab.I18nScheme>(),
    [symToStr({ AccountStorageTab })]: Reflect<AccountStorageTab.I18nScheme>(),
    [symToStr({ AccountUserInterfaceTab })]: Reflect<AccountUserInterfaceTab.I18nScheme>(),
    [symToStr({ CatalogExplorerCard })]: Reflect<CatalogExplorerCard.I18nScheme>(),
    [symToStr({ CatalogLauncher })]: Reflect<CatalogLauncher.I18nScheme>(),
    [symToStr({ CatalogExplorerCards })]: Reflect<CatalogExplorerCards.I18nScheme>(),
    [symToStr({ Catalog })]: Reflect<Catalog.I18nScheme>(),
    [symToStr({ Footer })]: Reflect<Footer.I18nScheme>(),
    [symToStr({ CatalogLauncherMainCard })]: Reflect<CatalogLauncherMainCard.I18nScheme>(),
    [symToStr({ CatalogLauncherConfigurationCard })]: Reflect<CatalogLauncherConfigurationCard.I18nScheme>(),
    [symToStr({ MyServices })]: Reflect<MyServices.I18nScheme>(),
    [symToStr({ MyServicesButtonBar })]: Reflect<MyServicesButtonBar.I18nScheme>(),
    [symToStr({ MyServicesCard })]: Reflect<MyServicesCard.I18nScheme>(),
    [symToStr({ MyServicesRunningTime })]: Reflect<MyServicesRunningTime.I18nScheme>(),
    [symToStr({ MyServicesSavedConfigOptions })]: Reflect<MyServicesSavedConfigOptions.I18nScheme>(),
    [symToStr({ MyServicesSavedConfig })]: Reflect<MyServicesSavedConfig.I18nScheme>(),
    [symToStr({ MyServicesSavedConfigs })]: Reflect<MyServicesSavedConfigs.I18nScheme>(),
    [symToStr({ MyServicesCards })]: Reflect<MyServicesCards.I18nScheme>(),
    [symToStr({ LoginDivider })]: Reflect<LoginDivider.I18nScheme>(),
    [symToStr({ Login })]: Reflect<Login.I18nScheme>(),
};

export type I18nSchemes = typeof reflectedI18nSchemes;

export type Translations = {
    [K in keyof I18nSchemes]: ToTranslations<I18nSchemes[K]>;
};

const common = id<
    Record<
        Language,
        Record<
            | "file"
            | "secret"
            | "create"
            | "cancel"
            | "rename"
            | "delete"
            | "ok"
            | "here"
            | "do not display again",
            string
        >
    >
>({
    "en": {
        "file": "file",
        "secret": "secret",
        "create": "create",
        "cancel": "cancel",
        "rename": "rename",
        "delete": "delete",
        "ok": "Ok",
        "here": "here",
        "do not display again": "Don't display again",
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
        "here": "ici",
        "do not display again": "Ne plus afficher",
        /* spell-checker: enable */
    },
    "zh-CN": {
        /* spell-checker: disable */
        "file": "文档",
        "secret": "密码",
        "create": "建立",
        "cancel": "取消",
        "rename": "重命名",
        "delete": "删除",
        "ok": "好的",
        "here": "这里",
        "do not display again": "不要再显示",
        /* spell-checker: enable */
    },
});

export const resources = id<Record<Language, Translations>>({
    "en": {
        "Account": {
            "infos": "Account infos",
            "third-party-integration": "external services",
            "storage": "Connect to storage",
            "user-interface": "Interface preferences",
            "text1": "My account",
            "text2": "Access your different account information.",
            "text3":
                "Configure your usernames, emails, passwords and personal access tokens directly connected to your services.",
            "personal tokens tooltip":
                "Password that are generated for you and that have a given validity period",
        },
        "AccountInfoTab": {
            "general information": "General information",
            "user id": "User id (IDEP)",
            "full name": "Full name",
            "email": "Email address",
            "change account info": "Change account information (e.g., password).",
            "auth information": "Onyxia authentication information",
            "auth information helper": `Theses information allows you to identify yourself
            within the platform and the various services.`,
            "ip address": "IP Address",
        },
        "AccountIntegrationsTab": {
            "git section title": "Git configuration",
            "git section helper": `To ensure that you appear from your services 
            as the author of Git contributions`,
            "gitName": "Username for Git",
            "gitEmail": "Email for Git",
            "third party tokens section title":
                "Connect your Gitlab, Github and Kaggle accounts",
            "third party tokens section helper": `
                Connect your services to external accounts using 
                personal access tokens and environment variables
            `,
            "personal token": "{{serviceName}} personal access token",
            "link for token creation": "Create your {{serviceName}} token.",
            "accessible as env":
                "Accessible withing your services as the environnement variable",
        },
        "AccountStorageTab": {
            "credentials section title": "Connect your data to your services",
            "credentials section helper":
                "Amazon-compatible MinIO object storage (AWS S3). This information is already filled in automatically.",
            "accessible as env":
                "Accessible withing your services as the environnement variable:",
            "init script section title":
                "To access your storage outside of datalab services",
            "init script section helper":
                "Download or copy the init script in the programming language of your choice.",
            "valid until": "Valid until {{when}}",
        },
        "AccountUserInterfaceTab": {
            "title": "Interface preferences",
            "enable dark mode": "Enable dark mode",
            "dark mode helper": "Low light interface theme with dark colored background.",
            "enable beta": "Enable beta-test mode",
            "beta mode helper": "For advanced platform configurations and features.",
            "enable dev mode": "Enable developer mode",
            "dev mode helper": "Enable features that are currently being developed",
        },
        "AccountField": {
            "copy tooltip": "Copy in clipboard",
            "language": "Change language",
            "s3 scripts": "Init script",
            "service password": "Password for your services",
            "service password helper text": `This password is required to log in to all of your services. 
            It is generated automatically and renews itself regularly.`,
            "not yet defined": "Not yet defined",
            "reset helper dialogs": "Reset instructions windows",
            "reset": "Reset",
            "reset helper dialogs helper text":
                "Reset message windows that have been requested not to be shown again",
        },
        "RegisterUserProfile": {
            "allowed email domains": "Allowed domains",
            "minimum length": "Minimum length: {{n}}",
            "must be different from username": "Pass can't be the username",
            "password mismatch": "Passwords mismatch",
            "go back": "Go back",
            "form not filled properly yet":
                "Please make sure the form is properly filled out",
            "must respect the pattern": "Must respect the pattern",
        },
        "MyFilesMySecrets": {
            "page title - my files": "My Files",
            "page title - my secrets": "My Secrets",
            "what this page is used for - my files":
                "Here you can browse your S3 Buckets.",
            "what this page is used for - my secrets":
                "Here can be defined variables that will be accessible in you services under the form of environnement variable.",
            "learn more - my files": "To learn more about file management,",
            "to learn more - my secrets": "To learn more about secrets management,",
            "read our documentation": "read our documentation.",
        },
        "ExplorerItem": {
            "description": "description",
        },
        "ExplorerButtonBar": {
            ...common.en,
            "create secret": "Create secret",
            "upload file": "Upload file",
            "copy path": "Use in a service",
            "create directory": "Create directory",
            "refresh": "refresh",
            "create what": "Create {{what}}",
        },
        "Explorer": {
            ...common.en,
            "untitled what": "untitled_{{what}}",
            "directory": "folder",
            "deletion dialog title": "Delete a {{deleteWhat}} ?",
            "deletion dialog body": `You are about to delete {{deleteWhat}}. 
            This action can't be reverted.`,
            "already a directory with this name":
                "There is already a directory with this name",
            "can't be empty": "Can't be empty",
            "create": "create",
            "new directory": "New directory",
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
            "use secret dialog title": "Use in a service",
            "use secret dialog subtitle": "The path of the secret have been copied",
            "use secret dialog body": `
                When you launch a service (RStudio, Jupyter, ect) go to the
                secret tab and and paste the path of the secret provided for this 
                purpose.
                The values will be injected as environnement variable.
            `,
            "use secret dialog ok": "Got it",
        },
        "MySecretsEditorRow": {
            "key input desc": "Environnement variable name",
            "value input desc": "Environnement variable value",
        },
        "ExplorerUploadModalDropArea": {
            "browse files": "browse files",
            "drag and drop or": "Drag and drop or",
        },
        "ExplorerUploadProgress": {
            "over": "over",
            "importing": "Importing",
        },
        "ExplorerUploadModal": {
            "import files": "Import files",
            "cancel": "Cancel",
            "minimize": "Minimize",
        },

        "Header": {
            "login": "Login",
            "logout": "Logout",
            "trainings": "Trainings",
            "documentation": "Documentation",
            "project": "Project",
        },
        "App": {
            "reduce": "Reduce",
            "home": "Home",
            "account": "My account",
            "catalog": "Services catalog",
            "myServices": "My Services",
            "mySecrets": "My Secrets",
            "myFiles": "My Files",
        },
        "FourOhFour": {
            "not found": "Page not found",
        },
        "PortraitModeUnsupported": {
            "portrait mode not supported": "Portrait mode isn't supported yet",
            "instructions":
                "To use this app on your phone please enable the rotation sensor and turn your phone.",
        },
        "Home": {
            "welcome": `Welcome {{who}}!`,
            "title": "Welcome to the Onyxia datalab",
            "new user": "New to the datalab?",
            "login": "Login",
            "subtitle": "Work with Python or R, enjoy all the computing power you need!",
            "cardTitle1": "An ergonomic environment and on-demand services",
            "cardTitle2": "An active and enthusiastic community at your service",
            "cardTitle3": "Fast, flexible and online data storage",
            "cardText1":
                "Analyze data, perform distributed computing and take advantage of a large catalog of services. Reserve the computing power you need.",
            "cardText2":
                "Use and share the resources available to you: tutorials, training and exchange channels.",
            "cardText3":
                "To easily access your data and those made available to you from your programs - S3 API implementation",
            "cardButton1": "Consult the catalog",
            "cardButton2": "Join the community",
            "cardButton3": "Consult the data",
        },
        "CatalogExplorerCard": {
            "launch": "Launch",
            "learn more": "Learn more",
        },
        "CatalogExplorerCards": {
            "show more": "Show more",
            "no service found": "No service found",
            "no result found": "No result found for {{forWhat}}",
            "check spelling": "Please check your spelling or try widening your search.",
            "go back": "Back to main services",
            "main services": "Main services",
            "all services": "All services",
            "search results": "Search result",
            "search": "Search",
        },
        "Catalog": {
            "header text1": "Services catalog",
            "header text2":
                "Explore, launch and configure services with just a few clicks.",
            "contribute to the catalog": "Contribute to the {{catalogName}} catalog",
            "contribute to the package":
                "Find the sources of the {{packageName}} package ",
            "here": "here",
        },
        "CatalogLauncher": {
            "no longer bookmarked dialog title": "Your changes wont be saved",
            "no longer bookmarked dialog body":
                "Click on the bookmark icon again to update your saved configuration",
            "ok": "Ok",
            "should overwrite configuration dialog title":
                "Would you like to replace it?",
            "should overwrite configuration dialog subtitle":
                "«{{friendlyName}}» already exists in your store.",
            "should overwrite configuration dialog body":
                "You already have a saved service with this name. If you replace it the previous configuration will be lost",
            "cancel": "Annuler",
            "replace": "Replace it",
        },
        "Footer": {
            "contribute": "Contribute",
            "terms of service": "Terms of service",
            "change language": "Change language",
        },
        "CatalogLauncherMainCard": {
            "card title": "Create your personal services",
            "friendly name": "Friendly name",
            "launch": "Launch",
            "cancel": "Cancel",
            "copy url helper text": "Copy url to restore this configuration",
            "save configuration": "Save this configuration",
            "share the service": "Share the service",
            "share the service - explain":
                "Make the service accessible to the group members",
        },
        "CatalogLauncherConfigurationCard": {
            "global config": "Global configuration",
            "configuration": "{{packageName}} configurations",
            "dependency": "{{dependencyName}} dependency",
            "launch of a service": "A {{dependencyName}} service will be launched",
            "malformed input": "Malformed input.",
        },
        "MyServices": {
            "text1": "My Services",
            "text2": "Access your running services",
            "text3":
                "Services are supposed to be shut down as soon as you stop using them actively.",
            "running services": "Running services",
            "confirm delete title": "Are you sure?",
            "confirm delete subtitle": "Make sure your service are ready to be deleted",
            "confirm delete body shared services":
                "Be mindful that some of your services are shared with the other project member.",
            "confirm delete body":
                "Don't forget to push your code on GitHub or GitLab before terminating your services",
            "cancel": "cancel",
            "confirm": "Yes, delete",
        },
        "MyServicesButtonBar": {
            "refresh": "Refresh",
            "launch": "New service",
            "password": "Copy the services password",
            "trash": "Delete all",
            "trash my own": "Delete all my services",
        },
        "MyServicesCard": {
            "service": "Service",
            "running since": "Running since: ",
            "open": "open",
            "readme": "readme",
            "shared by you": "Shared by you",
            "which token expire when": "The {{which}} token expires {{howMuchTime}}.",
            "which token expired": "The {{which}} token is expired.",
            "reminder to delete services": "Remember to delete your services.",
            "this is a shared service": "This service is shared among project's member",
        },
        "MyServicesRunningTime": {
            "launching": "Launching...",
        },
        "MyServicesSavedConfigOptions": {
            "edit": "Edit",
            "copy link": "Copy URL link",
            "remove bookmark": "Delete",
        },
        "MyServicesSavedConfig": {
            "edit": "Edit",
            "launch": "Launch",
        },
        "MyServicesSavedConfigs": {
            "saved": "Saved",
            "show all": "Show all",
        },
        "MyServicesCards": {
            "running services": "Running services",
            "no services running": "You don't have any service running",
            "launch one": "Click here to launch one",
            "ok": "ok",
            "need to copy": "Need to copy untruncated values?",
            "everything have been printed to the console":
                "Everything have been printed to the console",
            "first copy the password": "First, copy the service...",
            "open the service": "Open the service 🚀",
            "return": "Return",
        },
        "LoginDivider": {
            "or": "or",
        },
        "Login": {
            "doRegister": "Create an account",
        },
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
            "text3":
                "Configurez vos identifiants, e-mails, mots de passe et jetons d'accès personnels directement connectés à vos services.",
            "personal tokens tooltip": 'Ou en anglais "token".',
        },
        "AccountInfoTab": {
            "general information": "Informations générales",
            "user id": "Identifiant (IDEP)",
            "full name": "Nom complet",
            "email": "Adresse mail",
            "change account info":
                "Modifier les informations du compte (comme, par exemple, votre mot de passe)",
            "auth information": "Informations d'authentification Onyxia",
            "auth information helper": `Ces informations vous permettent de vous identifier 
            au sein de la plateforme et des différents services.`,
            "ip address": "Adresse IP",
        },
        "AccountIntegrationsTab": {
            "git section title": "Configurations Git",
            "git section helper": `Pour vous assurez que vous apparaissiez depuis vos
            services comme l'auteur des contributions Git`,
            "gitName": "Nom d'utilisateur pour Git",
            "gitEmail": "Email pour Git",
            "third party tokens section title":
                "Connecter vos comptes Gitlab, Github et Kaggle",
            "third party tokens section helper": `Connectez vos services à des comptes extérieurs à l'aide
            de jetons d'accès personnel et de variables d'environnement.`,
            "personal token": "Jeton d'accès personnel {{serviceName}}",
            "link for token creation": "Créer votre jeton {{serviceName}}.",
            "accessible as env":
                "Accessible au sein de vos services en tant que la variable d'environnement",
        },
        "AccountStorageTab": {
            "credentials section title": "Connecter vos données à vos services",
            "credentials section helper":
                "Stockage object MinIO compatible Amazon (AWS S3). Ces informations sont déjà renseignés automatiquement.",
            "accessible as env":
                "Accessible au sein de vos services en tant que la variable d'environnement",
            "init script section title":
                "Pour accèder au stockage en dehors des services du datalab",
            "init script section helper": `Téléchargez ou copiez le script d'initialisation dans le langage de programmation de votre choix.`,
            "valid until": "Valides jusqu'a {{when}}",
        },
        "AccountUserInterfaceTab": {
            "title": "Configurer le mode d'interface",
            "enable dark mode": "Activer le mode sombre",
            "dark mode helper":
                "Thème de l'interface à faible luminosité avec un fond de couleur sombre.",
            "enable beta": "Activer le mode béta-testeur",
            "beta mode helper":
                "Pour des configurations et fonctionnalités avancées de la plateforme.",
            "enable dev mode": "Activer le mode développeur",
            "dev mode helper": "Activer les fonctionnalités en cours de développement",
        },
        "AccountField": {
            "copy tooltip": "Copier dans le press papier",
            "language": "Changer la langue",
            "s3 scripts": "Script d'initialisation",
            "service password": "Mot de passe pour vos services",
            "service password helper text": `Ce mot de passe est nécessaire pour vous connecter à tous vos services. 
            Il est généré automatiquement et se renouvelle régulièrement.`,
            "not yet defined": "Non définie",
            "reset helper dialogs": "Réinitialiser les fenêtres d'instructions",
            "reset": "Réinitialiser",
            "reset helper dialogs helper text":
                "Réinitialiser les fenêtres de messages que vous avez demandé de ne plus afficher",
        },
        "RegisterUserProfile": {
            "allowed email domains": "Domaines autorisés",
            "minimum length": "Longueur minimum {{n}}",
            "must be different from username": "Ne peut pas être le nom d'utilisateur",
            "password mismatch": "Les deux mots de passe ne correspondent pas",
            "go back": "Retour",
            "form not filled properly yet":
                "Veuillez vérifier que vous avez bien rempli le formulaire",
            "must respect the pattern": "Dois respecter le format",
        },
        "MyFilesMySecrets": {
            "page title - my files": "Mes fichiers",
            "page title - my secrets": "My Secrets",
            "what this page is used for - my files":
                "Stocker ici vos fichiers de donnée.",
            "what this page is used for - my secrets":
                "Stockez ici des secrets qui seront accessibles sous forme de variables d'environnement dans vos services.",
            "learn more - my files":
                "Pour en savoir plus sur l'utilisation du stockage S3,",
            "to learn more - my secrets":
                "Pour en savoir plus sur l'utilisation de secrets,",
            "read our documentation": "lisez notre documentation.",
        },
        "ExplorerItem": {
            "description": "description",
        },
        "ExplorerButtonBar": {
            ...common.fr,
            "create secret": "Nouveau secret",
            "upload file": "Téléverser un fichier",
            "copy path": "Utiliser dans le service",
            "create directory": "Nouveau dossier",
            "refresh": "rafraîchir",
            "create what": "Nouveau {{what}}",
        },
        "Explorer": {
            ...common.fr,
            "untitled what": "{{what}}_sans_nom",
            "directory": "dossier",
            "deletion dialog title": "Supprimer un {{deleteWhat}} ?",
            "deletion dialog body": `
            Vous êtes sur le point de supprimer un {{deleteWhat}}. 
            Cette action entraînera la perte potentielle des données liées à ce {{deleteWhat}}.
            `,
            "already a directory with this name": "Il y a déjà un dossier avec ce nom",
            "can't be empty": "Ne peut être vide",
            "create": "Crée",
            "new directory": "Nouveau dossier",
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
        },
        "MySecretsEditorRow": {
            "key input desc": "Nom de la variable d'environnement",
            "value input desc": "Valeur de la variable d'environnement",
        },
        "ExplorerUploadModalDropArea": {
            "browse files": "parcourir vos fichiers",
            "drag and drop or": "Glisser et déposer ou",
        },
        "ExplorerUploadProgress": {
            "over": "sur",
            "importing": "importation",
        },
        "ExplorerUploadModal": {
            "import files": "Importer des fichiers",
            "cancel": "Annuler",
            "minimize": "Minimiser",
        },
        "Header": {
            "login": "Connexion",
            "logout": "Déconnexion",
            "trainings": "Formations",
            "documentation": "Documentation",
            "project": "Projet",
        },
        "App": {
            "reduce": "Réduire",
            "home": "Accueil",
            "account": "Mon compte",
            "catalog": "Catalogue de services",
            "myServices": "Mes services",
            "mySecrets": "Mes secrets",
            "myFiles": "Mes fichiers",
        },
        "FourOhFour": {
            "not found": "Page non trouvée",
        },
        "PortraitModeUnsupported": {
            "portrait mode not supported": "Le mode portrait n'est pas encore supporté",
            "instructions":
                "Pour utiliser cette application depuis votre mobile, veuillez activer le capteur de rotation et tourner votre téléphone.",
        },
        "Home": {
            "welcome": `Bienvenue {{who}}!`,
            "title": "Bienvenue sur le datalab",
            "login": "Connexion",
            "new user": "Nouvel utilisateur du datalab?",
            "subtitle":
                "Travaillez avec Python ou R et disposez de la puissance dont vous avez besoin!",
            "cardTitle1": "Un environnement ergonomique et des services à la demande",
            "cardTitle2": "Une communauté active et enthousiaste à votre écoute",
            "cardTitle3": "Un espace de stockage de données rapide, flexible et en ligne",
            "cardText1":
                "Analysez les données, faites du calcul distribué et profitez d’un large catalogue de services. Réservez la puissance de calcul dont vous avez besoin.",
            "cardText2":
                "Profitez et partagez des ressources mises à votre disposition: tutoriels, formations et canaux d’échanges.",
            "cardText3":
                "Pour accéder facilement à vos données et à celles mises à votre disposition depuis vos programmes - Implémentation API S3",
            "cardButton1": "Consulter le catalogue",
            "cardButton2": "Rejoindre la communauté",
            "cardButton3": "Consulter des données",
        },
        "CatalogExplorerCard": {
            "launch": "Lancer",
            "learn more": "En savoir plus",
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
            "search results": "Résultats de la recherche",
            "search": "Rechercher",
        },
        "Catalog": {
            "header text1": "Catalogue de services",
            "header text2":
                "Explorez, lancez et configurez des services en quelques clics seulement.",
            "contribute to the catalog": "Contribuer au catalogue {{catalogName}}",
            "contribute to the package":
                "Accéder aux sources du package {{packageName}} ",
            "here": "ici",
        },
        "CatalogLauncher": {
            "no longer bookmarked dialog title": "Changements non enregistrés",
            "no longer bookmarked dialog body":
                "Cliquer une nouvelle fois sur le symbole marque-page pour mettre à jour votre configuration enregistrée.",
            "ok": "Ok",
            "should overwrite configuration dialog title":
                "Souhaitez-vous le remplacer ?",
            "should overwrite configuration dialog subtitle":
                "«{{friendlyName}}» exsiste déjà dans vos enregistrements.",
            "should overwrite configuration dialog body":
                "Un service enregistré du même nom exsiste déjà. Si vous le remplacez, le contenu d'origine sera perdu.",
            "cancel": "Annuler",
            "replace": "Remplacer",
        },
        "Footer": {
            "contribute": "Contribuer au projet",
            "terms of service": "Conditions d'utilisation",
            "change language": "Changer la langue",
        },
        "CatalogLauncherMainCard": {
            "card title": "Créer votre propre service",
            "friendly name": "Nom personalisé",
            "launch": "Lancer",
            "cancel": "Annuler",
            "copy url helper text":
                "Copier l'URL permettant de restaurer cette configuration",
            "save configuration": "Enregistrer cette configuration",
            "share the service": "Partager le service",
            "share the service - explain":
                "Rendre accessible le service aux collaborateurs du groupe",
        },
        "CatalogLauncherConfigurationCard": {
            "global config": "Configurations globales",
            "configuration": "Configuration {{packageName}}",
            "dependency": "Dépendance {{dependencyName}}",
            "launch of a service": "Lancement d'un service {{dependencyName}}",
            "malformed input": "Text non valide.",
        },
        "MyServices": {
            "text1": "Mes services",
            "text2":
                "Lancer, visualiser et gérer rapidement vos différents services en cours d'exécution.",
            "text3":
                "Il est recommandé de supprimer vos services après chaque session de travail.",
            "running services": "Services en cours",
            "confirm delete title": "Êtes-vous sur?",
            "confirm delete subtitle":
                "Assurez-vous que vos services ne contentent pas de travail non sauvegardé.",
            "confirm delete body":
                "N'oubliez pas de pusher votre code sur GitHub ou GitLab avant de continuer.",
            "confirm delete body shared services":
                "Attention, certains de vos services sont partagés aux autres membres du projet.",
            "cancel": "Annuler",
            "confirm": "Oui, supprimer",
        },
        "MyServicesButtonBar": {
            "refresh": "Rafraîchir",
            "launch": "Nouveau service",
            "password": "Copier le mot de passe",
            "trash": "Supprimer tous",
            "trash my own": "Supprimer tous mes services",
        },
        "MyServicesCard": {
            "service": "Service",
            "running since": "En exécution depuis: ",
            "open": "ouvrir",
            "readme": "readme",
            "shared by you": "partagé par vous",
            "which token expire when": "Le token {{which}} expire {{howMuchTime}}.",
            "which token expired": "Le token {{which}} est expiré.",
            "reminder to delete services":
                "Rappelez-vous de supprimer vos services après utilisation.",
            "this is a shared service": "Ce service est partagé au sein du projet",
        },
        "MyServicesRunningTime": {
            "launching": "En cours...",
        },
        "MyServicesSavedConfigOptions": {
            "edit": "Modifier",
            "copy link": "Copier l'URL",
            "remove bookmark": "Supprimer",
        },
        "MyServicesSavedConfig": {
            "edit": "Modifier",
            "launch": "Lancer",
        },
        "MyServicesSavedConfigs": {
            "saved": "Enregistrés",
            "show all": "Afficher tous",
        },
        "MyServicesCards": {
            "running services": "Services en cours",
            "no services running":
                "Vous n'avez actuellement aucun service en cours d'exécution",
            "launch one": "Cliquez ici pour en lancer un",
            "ok": "ok",
            "need to copy": "Besoin de copier les valeurs non tronquées?",
            "everything have been printed to the console":
                "Tout a été loggé dans la console",
            "first copy the password": "Commencez par copier le mot de passe...",
            "open the service": "Ouvrir le service 🚀",
            "return": "Retour",
        },
        "LoginDivider": {
            "or": "ou",
        },
        "Login": {
            "doRegister": "Créer un compte",
        },
        /* spell-checker: enable */
    },
    "zh-CN": {
        /* spell-checker: disable */
        "Account": {
            "infos": "账号信息",
            "third-party-integration": "外部服务",
            "storage": "链接到储存器",
            "user-interface": "变换显示模式",
            "text1": "我的账号",
            "text2": "访问我的账号信息",
            "text3": "设置您的用户名, 电子邮件, 密码和访问令牌",
            "personal tokens tooltip": "服务的访问令牌",
        },
        "AccountInfoTab": {
            "general information": "一般信息",
            "user id": "Identifiant (IDEP)",
            "full name": "Nom complet",
            "email": "Adresse mail",
            "change account info":
                "Modifier les informations du compte (comme, par exemple, votre mot de passe)",
            "auth information": "Informations d'authentification Onyxia",
            "auth information helper": `Ces informations vous permettent de vous identifier 
            au sein de la plateforme et des différents services.`,
            "ip address": "Adresse IP",
        },
        "AccountIntegrationsTab": {
            "git section title": "Configurations Git",
            "git section helper": `Pour vous assurez que vous apparaissiez depuis vos
            services comme l'auteur des contributions Git`,
            "gitName": "Nom d'utilisateur pour Git",
            "gitEmail": "Email pour Git",
            "third party tokens section title":
                "Connecter vos comptes Gitlab, Github et Kaggle",
            "third party tokens section helper": `Connectez vos services à des comptes extérieurs à l'aide
            de jetons d'accès personnel et de variables d'environnement.`,
            "personal token": "Jeton d'accès personnel {{serviceName}}",
            "link for token creation": "Créer votre jeton {{serviceName}}.",
            "accessible as env":
                "Accessible au sein de vos services en tant que la variable d'environnement",
        },
        "AccountStorageTab": {
            "credentials section title": "Connecter vos données à vos services",
            "credentials section helper":
                "Stockage object MinIO compatible Amazon (AWS S3). Ces informations sont déjà renseignés automatiquement.",
            "accessible as env":
                "Accessible au sein de vos services en tant que la variable d'environnement",
            "init script section title":
                "Pour accèder au stockage en dehors des services du datalab",
            "init script section helper": `Téléchargez ou copiez le script d'initialisation dans le langage de programmation de votre choix.`,
            "valid until": "Valides jusqu'a {{when}}",
        },
        "AccountUserInterfaceTab": {
            "title": "Configurer le mode d'interface",
            "enable dark mode": "Activer le mode sombre",
            "dark mode helper":
                "Thème de l'interface à faible luminosité avec un fond de couleur sombre.",
            "enable beta": "Activer le mode béta-testeur",
            "beta mode helper":
                "Pour des configurations et fonctionnalités avancées de la plateforme.",
            "enable dev mode": "Activer le mode développeur",
            "dev mode helper": "Activer les fonctionnalités en cours de développement",
        },
        "AccountField": {
            "copy tooltip": "Copier dans le press papier",
            "language": "Changer la langue",
            "s3 scripts": "Script d'initialisation",
            "service password": "Mot de passe pour vos services",
            "service password helper text": `Ce mot de passe est nécessaire pour vous connecter à tous vos services. 
            Il est généré automatiquement et se renouvelle régulièrement.`,
            "not yet defined": "Non définie",
            "reset helper dialogs": "Réinitialiser les fenêtres d'instructions",
            "reset": "Réinitialiser",
            "reset helper dialogs helper text":
                "Réinitialiser les fenêtres de messages que vous avez demandé de ne plus afficher",
        },
        "RegisterUserProfile": {
            "allowed email domains": "Domaines autorisés",
            "minimum length": "Longueur minimum {{n}}",
            "must be different from username": "Ne peut pas être le nom d'utilisateur",
            "password mismatch": "Les deux mots de passe ne correspondent pas",
            "go back": "Retour",
            "form not filled properly yet":
                "Veuillez vérifier que vous avez bien rempli le formulaire",
            "must respect the pattern": "Dois respecter le format",
        },
        "MyFilesMySecrets": {
            "page title - my files": "Mes fichiers",
            "page title - my secrets": "My Secrets",
            "what this page is used for - my files":
                "Stocker ici vos fichiers de donnée.",
            "what this page is used for - my secrets":
                "Stockez ici des secrets qui seront accessibles sous forme de variables d'environnement dans vos services.",
            "learn more - my files":
                "Pour en savoir plus sur l'utilisation du stockage S3,",
            "to learn more - my secrets":
                "Pour en savoir plus sur l'utilisation de secrets,",
            "read our documentation": "lisez notre documentation.",
        },
        "ExplorerItem": {
            "description": "description",
        },
        "ExplorerButtonBar": {
            ...common.fr,
            "create secret": "Nouveau secret",
            "upload file": "Téléverser un fichier",
            "copy path": "Utiliser dans le service",
            "create directory": "Nouveau dossier",
            "refresh": "rafraîchir",
            "create what": "Nouveau {{what}}",
        },
        "Explorer": {
            ...common.fr,
            "untitled what": "{{what}}_sans_nom",
            "directory": "dossier",
            "deletion dialog title": "Supprimer un {{deleteWhat}} ?",
            "deletion dialog body": `
            Vous êtes sur le point de supprimer un {{deleteWhat}}. 
            Cette action entraînera la perte potentielle des données liées à ce {{deleteWhat}}.
            `,
            "already a directory with this name": "Il y a déjà un dossier avec ce nom",
            "can't be empty": "Ne peut être vide",
            "create": "Crée",
            "new directory": "Nouveau dossier",
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
        },
        "MySecretsEditorRow": {
            "key input desc": "Nom de la variable d'environnement",
            "value input desc": "Valeur de la variable d'environnement",
        },
        "ExplorerUploadModalDropArea": {
            "browse files": "parcourir vos fichiers",
            "drag and drop or": "Glisser et déposer ou",
        },
        "ExplorerUploadProgress": {
            "over": "sur",
            "importing": "importation",
        },
        "ExplorerUploadModal": {
            "import files": "Importer des fichiers",
            "cancel": "Annuler",
            "minimize": "Minimiser",
        },
        "Header": {
            "login": "Connexion",
            "logout": "Déconnexion",
            "trainings": "Formations",
            "documentation": "Documentation",
            "project": "Projet",
        },
        "App": {
            "reduce": "Réduire",
            "home": "Accueil",
            "account": "Mon compte",
            "catalog": "Catalogue de services",
            "myServices": "Mes services",
            "mySecrets": "Mes secrets",
            "myFiles": "Mes fichiers",
        },
        "FourOhFour": {
            "not found": "Page non trouvée",
        },
        "PortraitModeUnsupported": {
            "portrait mode not supported": "Le mode portrait n'est pas encore supporté",
            "instructions":
                "Pour utiliser cette application depuis votre mobile, veuillez activer le capteur de rotation et tourner votre téléphone.",
        },
        "Home": {
            "welcome": `Bienvenue {{who}}!`,
            "title": "Bienvenue sur le datalab",
            "login": "Connexion",
            "new user": "Nouvel utilisateur du datalab?",
            "subtitle":
                "Travaillez avec Python ou R et disposez de la puissance dont vous avez besoin!",
            "cardTitle1": "Un environnement ergonomique et des services à la demande",
            "cardTitle2": "Une communauté active et enthousiaste à votre écoute",
            "cardTitle3": "Un espace de stockage de données rapide, flexible et en ligne",
            "cardText1":
                "Analysez les données, faites du calcul distribué et profitez d’un large catalogue de services. Réservez la puissance de calcul dont vous avez besoin.",
            "cardText2":
                "Profitez et partagez des ressources mises à votre disposition: tutoriels, formations et canaux d’échanges.",
            "cardText3":
                "Pour accéder facilement à vos données et à celles mises à votre disposition depuis vos programmes - Implémentation API S3",
            "cardButton1": "Consulter le catalogue",
            "cardButton2": "Rejoindre la communauté",
            "cardButton3": "Consulter des données",
        },
        "CatalogExplorerCard": {
            "launch": "Lancer",
            "learn more": "En savoir plus",
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
            "search results": "Résultats de la recherche",
            "search": "Rechercher",
        },
        "Catalog": {
            "header text1": "Catalogue de services",
            "header text2":
                "Explorez, lancez et configurez des services en quelques clics seulement.",
            "contribute to the catalog": "Contribuer au catalogue {{catalogName}}",
            "contribute to the package":
                "Accéder aux sources du package {{packageName}} ",
            "here": "ici",
        },
        "CatalogLauncher": {
            "no longer bookmarked dialog title": "Changements non enregistrés",
            "no longer bookmarked dialog body":
                "Cliquer une nouvelle fois sur le symbole marque-page pour mettre à jour votre configuration enregistrée.",
            "ok": "Ok",
            "should overwrite configuration dialog title":
                "Souhaitez-vous le remplacer ?",
            "should overwrite configuration dialog subtitle":
                "«{{friendlyName}}» exsiste déjà dans vos enregistrements.",
            "should overwrite configuration dialog body":
                "Un service enregistré du même nom exsiste déjà. Si vous le remplacez, le contenu d'origine sera perdu.",
            "cancel": "Annuler",
            "replace": "Remplacer",
        },
        "Footer": {
            "contribute": "Contribuer au projet",
            "terms of service": "Conditions d'utilisation",
            "change language": "Changer la langue",
        },
        "CatalogLauncherMainCard": {
            "card title": "Créer votre propre service",
            "friendly name": "Nom personalisé",
            "launch": "Lancer",
            "cancel": "Annuler",
            "copy url helper text":
                "Copier l'URL permettant de restaurer cette configuration",
            "save configuration": "Enregistrer cette configuration",
            "share the service": "Partager le service",
            "share the service - explain":
                "Rendre accessible le service aux collaborateurs du groupe",
        },
        "CatalogLauncherConfigurationCard": {
            "global config": "全局设置",
            "configuration": "配置 {{packageName}}",
            "dependency": "依赖服务 {{dependencyName}}",
            "launch of a service": "启动一个服务 {{dependencyName}}",
            "malformed input": "无效的输入数据",
        },
        "MyServices": {
            "text1": "我的服务",
            "text2": "快速启动、查看和管理您正在运行的各种服务。",
            "text3": "建议您在每次工作会话后删除您的服务.",
            "running services": "正在运行的服务",
            "confirm delete title": "您确定?",
            "confirm delete subtitle": "确保您的服务不包括未保存的工作。",
            "confirm delete body": "在继续之前不要忘记将您的代码推送到 GitHub 或 GitLab.",
            "confirm delete body shared services":
                "请注意，您的某些服务正在与项目的其他成员共享.",
            "cancel": "取消",
            "confirm": "是的, 删除",
        },
        "MyServicesButtonBar": {
            "refresh": "刷新",
            "launch": "新的服务",
            "password": "复制密码",
            "trash": "删除所有",
            "trash my own": "删除您的所有服务",
        },
        "MyServicesCard": {
            "service": "服务",
            "running since": "运行时间: ",
            "open": "打开",
            "readme": "自述文件",
            "shared by you": "你分享的",
            "which token expire when": "令牌 {{which}} 在 {{howMuchTime}} 后过期.",
            "which token expired": "令牌 {{which}} 已经过期.",
            "reminder to delete services": "请在使用后删除您的服务。",
            "this is a shared service": "该服务在项目内共享",
        },
        "MyServicesRunningTime": {
            "launching": "启动中",
        },
        "MyServicesSavedConfigOptions": {
            "edit": "编辑服务",
            "copy link": "复制链接",
            "remove bookmark": "删除书签",
        },
        "MyServicesSavedConfig": {
            "edit": "编辑服务",
            "launch": "启动服务",
        },
        "MyServicesSavedConfigs": {
            "saved": "已经保存",
            "show all": "显示所有",
        },
        "MyServicesCards": {
            "running services": "正在运行的服务",
            "no services running": "您没有正在运行的服务",
            "launch one": "点击来启动此服务",
            "ok": "是",
            "need to copy": "需要复制未截断的值？",
            "everything have been printed to the console": "所有的信息都会记录在日志里",
            "first copy the password": "请复制您的密码",
            "open the service": "打开服务 🚀",
            "return": "返回",
        },
        "LoginDivider": {
            "or": "或者",
        },
        "Login": {
            "doRegister": "创建帐户",
        },
        /* spell-checker: enable */
    },
});
