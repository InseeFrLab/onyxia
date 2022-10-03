import { createI18nApi } from "i18nifty";
import type { Language, LocalizedString } from "ui/coreApi";
import { assert } from "tsafe/assert";
import {} from "tsafe";
import type { Equals } from "tsafe";
import { id } from "tsafe/id";
import { statefulObservableToStatefulEvt } from "powerhooks/tools/StatefulObservable/statefulObservableToStatefulEvt";

export type { Language, LocalizedString };

export const fallbackLanguage = "en";

assert<typeof fallbackLanguage extends Language ? true : false>();

export const languages = ["en", "fr", "zh-CN"] as const;

assert<Equals<typeof languages[number], Language>>();

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

const {
    useTranslation,
    resolveLocalizedString,
    useLang,
    $lang,
    useResolveLocalizedString,
} = createI18nApi<
    | typeof import("ui/components/pages/MyFilesMySecrets/Explorer/ExplorerButtonBar").i18n
    | typeof import("ui/components/pages/MyFilesMySecrets/Explorer").i18n
    | typeof import("ui/components/pages/MyFilesMySecrets/Explorer/ExplorerItems").i18n
    | typeof import("ui/components/pages/MyFilesMySecrets/Explorer/ExplorerItems/ExplorerItem").i18n
    | typeof import("ui/components/pages/MyFilesMySecrets/MySecretsEditor").i18n
    | typeof import("ui/components/pages/MyFilesMySecrets/MySecretsEditor/MySecretsEditorRow").i18n
    | typeof import("ui/components/pages/MyFilesMySecrets/Explorer/ExplorerUploadModal/ExplorerUploadModalDropArea").i18n
    | typeof import("ui/components/pages/MyFilesMySecrets/Explorer/ExplorerUploadModal/ExplorerUploadProgress").i18n
    | typeof import("ui/components/pages/MyFilesMySecrets/Explorer/ExplorerUploadModal/ExplorerUploadModal").i18n
    | typeof import("ui/components/shared/Header").i18n
    | typeof import("ui/components/App/App").i18n
    | typeof import("ui/components/pages/FourOhFour").i18n
    | typeof import("ui/components/pages/PortraitModeUnsupported").i18n
    | typeof import("ui/components/pages/Home").i18n
    | typeof import("ui/components/KcApp/RegisterUserProfile").i18n
    | typeof import("ui/components/pages/Account/AccountField").i18n
    | typeof import("ui/components/pages/Account/Account").i18n
    | typeof import("ui/components/pages/Account/tabs/AccountInfoTab").i18n
    | typeof import("ui/components/pages/Account/tabs/AccountIntegrationsTab").i18n
    | typeof import("ui/components/pages/Account/tabs/AccountStorageTab").i18n
    | typeof import("ui/components/pages/Account/tabs/AccountK8sTab").i18n
    | typeof import("ui/components/pages/Account/tabs/AccountUserInterfaceTab").i18n
    | typeof import("ui/components/pages/Catalog/CatalogLauncher/CatalogLauncher").i18n
    | typeof import("ui/components/pages/Catalog/CatalogExplorer/CatalogExplorerCards").i18n
    | typeof import("ui/components/pages/Catalog/CatalogExplorer/CatalogExplorerCards/CatalogExplorerCard").i18n
    | typeof import("ui/components/pages/Catalog").i18n
    | typeof import("ui/components/App/Footer").i18n
    | typeof import("ui/components/pages/Catalog/CatalogLauncher/CatalogLauncherMainCard").i18n
    | typeof import("ui/components/pages/Catalog/CatalogLauncher/CatalogLauncherConfigurationCard").i18n
    | typeof import("ui/components/pages/MyServices").i18n
    | typeof import("ui/components/pages/MyServices/MyServicesButtonBar").i18n
    | typeof import("ui/components/pages/MyServices/MyServicesCards/MyServicesCard").i18n
    | typeof import("ui/components/pages/MyServices/MyServicesCards/MyServicesCard/MyServicesRunningTime").i18n
    | typeof import("ui/components/pages/MyServices/MyServicesSavedConfigs/MyServicesSavedConfig/MyServicesSavedConfigOptions").i18n
    | typeof import("ui/components/pages/MyServices/MyServicesSavedConfigs/MyServicesSavedConfig").i18n
    | typeof import("ui/components/pages/MyServices/MyServicesSavedConfigs").i18n
    | typeof import("ui/components/pages/MyServices/MyServicesCards").i18n
    | typeof import("ui/components/KcApp/Login/LoginDivider").i18n
    | typeof import("ui/components/pages/MyFilesMySecrets/MyFilesMySecrets").i18n
    | typeof import("ui/components/pages/Terms").i18n
    | typeof import("ui/components/KcApp/Login").i18n
>()(
    { languages, fallbackLanguage },
    {
        "en": {
            "Account": {
                "infos": "Account infos",
                "third-party-integration": "external services",
                "storage": "Connect to storage",
                "kubernetes": "Connect to Kubernetes",
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
                "personal token": ({ serviceName }) =>
                    `${serviceName} personal access token`,
                "link for token creation": ({ serviceName }) =>
                    `Create your ${serviceName} token.`,
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
                "valid until": ({ when }) => `Valid until ${when}`,
            },
            "AccountK8sTab": {
                "kubernetes section title": "Connect to Kubernetes",
                "kubernetes section helper":
                    "Connexion for interacting directly with kubernetes cluster",
                "automatic script section helper": "To access to the kubernetes cluster",
                "automatic script section title":
                    "Download or copy the init script of your choice",
                "valid until": ({ when }) => `Valid until ${when}`,
                "k8s server url": "k8s server url",
                "k8s namespace": "k8s namespace",
                "k8s token": "k8s token",
            },
            "AccountUserInterfaceTab": {
                "title": "Interface preferences",
                "enable dark mode": "Enable dark mode",
                "dark mode helper":
                    "Low light interface theme with dark colored background.",
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
                "minimum length": ({ n }) => `Minimum length: ${n}`,
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
                "create what": ({ what }) => `Create ${what}`,
                "new": "New",
            },
            "Explorer": {
                ...common.en,
                "untitled what": ({ what }) => `untitled_${what}`,
                "directory": "folder",
                "deletion dialog title": ({ deleteWhat }) => `Delete a ${deleteWhat} ?`,
                "deletion dialog body": ({
                    deleteWhat,
                }) => `You are about to delete ${deleteWhat}.
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
                "welcome": ({ who }) => `Welcome ${who}!`,
                "title": "Welcome to the Onyxia datalab",
                "new user": "New to the datalab?",
                "login": "Login",
                "subtitle":
                    "Work with Python or R, enjoy all the computing power you need!",
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
                "no result found": ({ forWhat }) => `No result found for ${forWhat}`,
                "check spelling":
                    "Please check your spelling or try widening your search.",
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
                "contribute to the catalog": ({ catalogName }) =>
                    `Contribute to the ${catalogName} catalog`,
                "contribute to the package": ({ packageName }) =>
                    `Find the sources of the ${packageName} package `,
                "here": "here",
            },
            "CatalogLauncher": {
                "no longer bookmarked dialog title": "Your changes wont be saved",
                "no longer bookmarked dialog body":
                    "Click on the bookmark icon again to update your saved configuration",
                "ok": "Ok",
                "should overwrite configuration dialog title":
                    "Would you like to replace it?",
                "should overwrite configuration dialog subtitle": ({ friendlyName }) =>
                    `«${friendlyName}» already exists in your store.`,
                "should overwrite configuration dialog body":
                    "You already have a saved service with this name. If you replace it the previous configuration will be lost",
                "cancel": "Annuler",
                "replace": "Replace it",
                "sensitive configuration dialog title":
                    "Launching this service may be dangerous",
                "proceed to launch": "Proceed to launch",
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
                "configuration": ({ packageName }) => `${packageName} configurations`,
                "dependency": ({ dependencyName }) => `${dependencyName} dependency`,
                "launch of a service": ({ dependencyName }) =>
                    `A ${dependencyName} service will be launched`,
                "mismatching pattern": ({ pattern }) => `Should match ${pattern}`,
                "Invalid YAML Object": "Invalid YAML Object",
                "Invalid YAML Array": "Invalid YAML Array",
            },
            "MyServices": {
                "text1": "My Services",
                "text2": "Access your running services",
                "text3":
                    "Services are supposed to be shut down as soon as you stop using them actively.",
                "running services": "Running services",
                "confirm delete title": "Are you sure?",
                "confirm delete subtitle":
                    "Make sure your service are ready to be deleted",
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
                "which token expire when": ({ which, howMuchTime }) =>
                    `The ${which} token expires ${howMuchTime}.`,
                "which token expired": ({ which }) => `The ${which} token is expired.`,
                "reminder to delete services": "Remember to delete your services.",
                "this is a shared service":
                    "This service is shared among project's member",
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
            "Terms": {
                "no terms":
                    "No terms of service document provided for this instance of Onyxia",
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
                "kubernetes": "Connexion à Kubernetes",
                "user-interface": "Modes d'interface",
                "text1": "Mon compte",
                "text2": "Accédez à vos différentes informations de compte.",
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
                "personal token": ({ serviceName }) =>
                    `Jeton d'accès personnel ${serviceName}`,
                "link for token creation": ({ serviceName }) =>
                    `Créer votre jeton ${serviceName}.`,
                "accessible as env":
                    "Accessible au sein de vos services en tant que la variable d'environnement",
            },
            "AccountStorageTab": {
                "credentials section title": "Connecter vos données à vos services",
                "credentials section helper":
                    "Stockage object MinIO compatible Amazon (AWS S3). Ces informations sont déjà renseignées automatiquement.",
                "accessible as env":
                    "Accessible au sein de vos services en tant que la variable d'environnement",
                "init script section title":
                    "Pour accéder au stockage en dehors des services du datalab",
                "init script section helper": `Téléchargez ou copiez le script d'initialisation dans le langage de programmation de votre choix.`,
                "valid until": ({ when }) => `Valides jusqu'à ${when}`,
            },
            "AccountK8sTab": {
                "kubernetes section title": "Connexion à Kubernetes",
                "kubernetes section helper":
                    "Connexion pour interagir directement avec le cluster kubernetes",
                "automatic script section helper":
                    "Pour vous connecter au cluster kubernetes",
                "automatic script section title":
                    "Téléchargez ou copiez le script d'initialisation de votre choix",
                "valid until": ({ when }) => `Valides jusqu'à ${when}`,
                "k8s server url": "k8s server url",
                "k8s namespace": "k8s namespace",
                "k8s token": "k8s token",
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
                "dev mode helper":
                    "Activer les fonctionnalités en cours de développement",
            },
            "AccountField": {
                "copy tooltip": "Copier dans le presse-papier",
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
                "minimum length": ({ n }) => `Longueur minimum ${n}`,
                "must be different from username":
                    "Ne peut pas être le nom d'utilisateur",
                "password mismatch": "Les deux mots de passe ne correspondent pas",
                "go back": "Retour",
                "form not filled properly yet":
                    "Veuillez vérifier que vous avez bien rempli le formulaire",
                "must respect the pattern": "Doit respecter le format",
            },
            "MyFilesMySecrets": {
                "page title - my files": "Mes fichiers",
                "page title - my secrets": "My Secrets",
                "what this page is used for - my files":
                    "Stockez ici vos fichiers de données.",
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
                "create what": ({ what }) => `Nouveau ${what}`,
                "new": "Nouveau",
            },
            "Explorer": {
                ...common.fr,
                "untitled what": ({ what }) => `${what}_sans_nom`,
                "directory": "dossier",
                "deletion dialog title": ({ deleteWhat }) =>
                    `Supprimer un ${deleteWhat} ?`,
                "deletion dialog body": ({ deleteWhat }) => `
            Vous êtes sur le point de supprimer un ${deleteWhat}. 
            Cette action entraînera la perte potentielle des données liées à ce ${deleteWhat}.
            `,
                "already a directory with this name":
                    "Il y a déjà un dossier avec ce nom",
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
                "portrait mode not supported":
                    "Le mode portrait n'est pas encore supporté",
                "instructions":
                    "Pour utiliser cette application depuis votre mobile, veuillez activer le capteur de rotation et tourner votre téléphone.",
            },
            "Home": {
                "welcome": ({ who }) => `Bienvenue ${who}!`,
                "title": "Bienvenue sur le datalab",
                "login": "Connexion",
                "new user": "Nouvel utilisateur du datalab ?",
                "subtitle":
                    "Travaillez avec Python ou R et disposez de la puissance dont vous avez besoin !",
                "cardTitle1": "Un environnement ergonomique et des services à la demande",
                "cardTitle2": "Une communauté active et enthousiaste à votre écoute",
                "cardTitle3":
                    "Un espace de stockage de données rapide, flexible et en ligne",
                "cardText1":
                    "Analysez les données, faites du calcul distribué et profitez d’un large catalogue de services. Réservez la puissance de calcul dont vous avez besoin.",
                "cardText2":
                    "Profitez et partagez des ressources mises à votre disposition : tutoriels, formations et canaux d’échanges.",
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
                "no result found": ({ forWhat }) =>
                    `Aucun résultat trouvé pour ${forWhat}`,
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
                "contribute to the catalog": ({ catalogName }) =>
                    `Contribuer au catalogue ${catalogName}`,
                "contribute to the package": ({ packageName }) =>
                    `Accéder aux sources du package ${packageName} `,
                "here": "ici",
            },
            "CatalogLauncher": {
                "no longer bookmarked dialog title": "Changements non enregistrés",
                "no longer bookmarked dialog body":
                    "Cliquer une nouvelle fois sur le symbole marque-page pour mettre à jour votre configuration enregistrée.",
                "ok": "Ok",
                "should overwrite configuration dialog title":
                    "Souhaitez-vous le remplacer ?",
                "should overwrite configuration dialog subtitle": ({ friendlyName }) =>
                    `«${friendlyName}» exsiste déjà dans vos enregistrements.`,
                "should overwrite configuration dialog body":
                    "Un service enregistré du même nom existe déjà. Si vous le remplacez, le contenu d'origine sera perdu.",
                "cancel": "Annuler",
                "replace": "Remplacer",
                "sensitive configuration dialog title":
                    "Lancer ce service pourrait être dangereux",
                "proceed to launch": "Lancer en conscience",
            },
            "Footer": {
                "contribute": "Contribuer au projet",
                "terms of service": "Conditions d'utilisation",
                "change language": "Changer la langue",
            },
            "CatalogLauncherMainCard": {
                "card title": "Créer votre propre service",
                "friendly name": "Nom personnalisé",
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
                "configuration": ({ packageName }) => `Configuration ${packageName}`,
                "dependency": ({ dependencyName }) => `Dépendance ${dependencyName}`,
                "launch of a service": ({ dependencyName }) =>
                    `Lancement d'un service ${dependencyName}`,
                "mismatching pattern": ({ pattern }) => `Doit respecter ${pattern}`,
                "Invalid YAML Object": "Objet YAML non valide",
                "Invalid YAML Array": "Tableau YAML non valide",
            },
            "MyServices": {
                "text1": "Mes services",
                "text2":
                    "Lancer, visualiser et gérer rapidement vos différents services en cours d'exécution.",
                "text3":
                    "Il est recommandé de supprimer vos services après chaque session de travail.",
                "running services": "Services en cours",
                "confirm delete title": "Êtes-vous sûr?",
                "confirm delete subtitle":
                    "Assurez-vous que vos services ne contiennent pas de travail non sauvegardé.",
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
                "running since": "En exécution depuis : ",
                "open": "ouvrir",
                "readme": "readme",
                "shared by you": "partagé par vous",
                "which token expire when": ({ which, howMuchTime }) =>
                    `Le token ${which} expire ${howMuchTime}.`,
                "which token expired": ({ which }) => `Le token ${which} a expiré.`,
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
                "need to copy": "Besoin de copier les valeurs non tronquées ?",
                "everything have been printed to the console":
                    "Tout a été loggé dans la console",
                "first copy the password": "Commencez par copier le mot de passe...",
                "open the service": "Ouvrir le service 🚀",
                "return": "Retour",
            },
            "LoginDivider": {
                "or": "ou",
            },
            "Terms": {
                "no terms":
                    "Pas de document de terms et condition fournis pour cette instance d'Onyxia",
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
                "kubernetes": "TO TRANSLATE Connexion to Kubernetes ",
                "user-interface": "变换显示模式",
                "text1": "我的账号",
                "text2": "访问我的账号信息",
                "text3": "设置您的用户名, 电子邮件, 密码和访问令牌",
                "personal tokens tooltip": "服务的访问令牌",
            },
            "AccountInfoTab": {
                "general information": "一般信息",
                "user id": "身分名 (IDEP)",
                "full name": "全名",
                "email": "邮件地址",
                "change account info": "修改帐户信息（例如您的密码）",
                "auth information": "Onyxia的认证信息",
                "auth information helper": `此信息可让您在平台内和平台内的各种服务中认证自己.`,
                "ip address": "IP地址",
            },
            "AccountIntegrationsTab": {
                "git section title": "Git 配置",
                "git section helper": `为了确保您在您的服务中
            作为 Git 贡献者`,
                "gitName": "您Git 账号的用户名",
                "gitEmail": "您Git 账号的注册电子邮件",
                "third party tokens section title":
                    "连接您的 Gitlab、Github 和 Kaggle 帐户",
                "third party tokens section helper":
                    "利用您的个人访问令牌和环境变量，来将您的服务连接到外部帐户.",
                "personal token": ({ serviceName }) => `个人访问令牌 ${serviceName}`,
                "link for token creation": ({ serviceName }) =>
                    `创建您的令牌 ${serviceName}.`,
                "accessible as env": "可在您的服务中作为环境变量被访问",
            },
            "AccountStorageTab": {
                "credentials section title": "将您的数据连接到您的服务",
                "credentials section helper":
                    "与 Amazon (AWS S3) 兼容的对象存储 MinIO. 此信息已自动填写.",
                "accessible as env": "可在您的服务中作为环境变量被访问",
                "init script section title": "访问datalab服务之外的存储器",
                "init script section helper": `下载或复制用您选择的编程语言编写的初始化脚本.`,
                "valid until": ({ when }) => `在 ${when} 前有效`,
            },
            "AccountK8sTab": {
                "kubernetes section title": "TO TRANSLATE",
                "kubernetes section helper": "TO TRANSLATE",
                "automatic script section helper": "TO TRANSLATE",
                "automatic script section title": "TO TRANSLATE",
                "valid until": ({ when }) => `在 ${when} 前有效`,
                "k8s server url": "TO TRANSLATE",
                "k8s namespace": "TO TRANSLATE",
                "k8s token": "TO TRANSLATE",
            },
            "AccountUserInterfaceTab": {
                "title": "配置界面模式",
                "enable dark mode": "开启深色模式",
                "dark mode helper": "适用于低光环境的深色背景主题",
                "enable beta": "启用 Beta 测试模式",
                "beta mode helper": "用于平台高级配置和功能.",
                "enable dev mode": "启用开发者模式",
                "dev mode helper": "启用正在开发的功能",
            },
            "AccountField": {
                "copy tooltip": "复制到剪贴板",
                "language": "更改语言",
                "s3 scripts": "初始化脚本",
                "service password": "您的服务密码",
                "service password helper text": `登录您的所有服务都需要此密码.
            此密码自动生成并定期更新.`,
                "not yet defined": "没有定义",
                "reset helper dialogs": "重置指令窗口",
                "reset": "重置",
                "reset helper dialogs helper text": "重置您要求不再显示的消息窗口",
            },
            "RegisterUserProfile": {
                "allowed email domains": "授权域",
                "minimum length": ({ n }) => `最小长度 ${n}`,
                "must be different from username": "用户名不可用",
                "password mismatch": "两个密码不匹配",
                "go back": "返回",
                "form not filled properly yet": "请检查您是否正确填写了表格.",
                "must respect the pattern": "必须尊守格式",
            },
            "MyFilesMySecrets": {
                "page title - my files": "我的文件",
                "page title - my secrets": "我的密钥",
                "what this page is used for - my files": "在此处存储您的数据.",
                "what this page is used for - my secrets":
                    "在此处存储可作为服务中的环境变量访问的密钥.",
                "learn more - my files": "了解有关使用 S3 存储的更多信息,",
                "to learn more - my secrets": "要了解有关使用密钥的更多信息",
                "read our documentation": "阅读我们的文档",
            },
            "ExplorerItem": {
                "description": "描述",
            },
            "ExplorerButtonBar": {
                ...common.fr,
                "create secret": "新的密钥",
                "upload file": "上传文件",
                "copy path": "在服务中使用",
                "create directory": "新建文件夹",
                "refresh": "刷新",
                "create what": ({ what }) => `新 ${what}`,
                "new": undefined,
            },
            "Explorer": {
                ...common.fr,
                "untitled what": undefined,
                "directory": "目录",
                "deletion dialog title": ({ deleteWhat }) => `删除 ${deleteWhat} ?`,
                "deletion dialog body": ({ deleteWhat }) => `
            您即将删除 ${deleteWhat} 服务.
            此操作将导致与此 ${deleteWhat} 服务相关的数据的潜在丢失
            `,
                "already a directory with this name": "已经有一个同名的文件夹",
                "can't be empty": "不能为空",
                "create": "建立",
                "new directory": "新建文件夹",
            },
            "ExplorerItems": {
                "empty directory": "此目录为空",
            },
            "MySecretsEditor": {
                ...common.fr,
                "add an entry": "添加变量",
                "environnement variable default name": "NEW_VARENV",
                "table of secret": "密钥表",

                "key column name": "变量名",
                "value column name": "变量值",
                "resolved value column name": "求解值",
                "what's a resolved value": `一个环境变量可以引用另一个，例如，如果你有
            定义变量 PRENOM=Louis 你可以定义变量 NAME_COMPLET="$PRENOM"-Dupon
            NAME_COMPLET的解析值将是"Louis-Dupon"
            `,
                "unavailable key": "已被使用",
                "invalid key empty string": "名字是必需的",
                "invalid key _ not valid": "不可以只有 _",
                "invalid key start with digit": "不能以数字开头",
                "invalid key invalid character": "无效字符",
                "invalid value cannot eval": "无效的shell表达式",
                "use this secret": "在服务中使用",

                "use secret dialog title": "在服务中使用",
                "use secret dialog subtitle": "密钥路径已被复制",
                "use secret dialog body": `启动服务（RStudio，Jupyter）时，
                                    如果在"VAULT"选项卡中，将路径粘贴到提供的字段中。
                                    您的键值将被作为环境变量.`,
                "use secret dialog ok": "我知道了",
            },
            "MySecretsEditorRow": {
                "key input desc": "环境变量名称",
                "value input desc": "环境变量值",
            },
            "ExplorerUploadModalDropArea": {
                "browse files": "浏览您的文件",
                "drag and drop or": "拖拽，放置或",
            },
            "ExplorerUploadProgress": {
                "over": "over",
                "importing": "导入",
            },
            "ExplorerUploadModal": {
                "import files": "导入文件",
                "cancel": "取消",
                "minimize": "最小化",
            },
            "Header": {
                "login": "登录",
                "logout": "登出",
                "trainings": "培训",
                "documentation": "文档",
                "project": "项目",
            },
            "App": {
                "reduce": "缩小",
                "home": "我的主页",
                "account": "我的账号",
                "catalog": "服务目录",
                "myServices": "我的服务",
                "mySecrets": "我的密钥",
                "myFiles": "我的文档",
            },
            "FourOhFour": {
                "not found": "网页未找到",
            },
            "PortraitModeUnsupported": {
                "portrait mode not supported": "尚不支持纵向模式",
                "instructions":
                    "要在您的手机中使用此应用程序，请激活旋转传感器并转动您的手机",
            },
            "Home": {
                "welcome": ({ who }) => `你好 ${who}!`,
                "title": "欢迎来到 datalab",
                "login": "登录",
                "new user": "您是datalab的新用户?",
                "subtitle":
                    "我们支持 Python 或 R，并为您提供各种数据服务和您需要的所有计算能力!",
                "cardTitle1": "灵活的工作环境和按需分配的服务",
                "cardTitle2": "一个为您服务的，活跃的和热情的社区",
                "cardTitle3": "快速、灵活、在线的数据存储空间",
                "cardText1":
                    "分析数据、执行分布式计算并提供大量数据服务. 保证您可以预订您需要的超大计算能力",
                "cardText2": "充分利用我们向您提供的资源: 教程, 培训和交流群.",
                "cardText3": "轻松访问您的个人数据以及您的项目提供给您的数据 - S3 API",
                "cardButton1": "查阅目录",
                "cardButton2": "加入社区",
                "cardButton3": "查看数据",
            },
            "CatalogExplorerCard": {
                "launch": "启动",
                "learn more": "了解更多",
            },
            "CatalogExplorerCards": {
                "show more": "显示所有",
                "no service found": "没有找到服务",
                "no result found": ({ forWhat }) => `没有找到关于 ${forWhat} 的结果`,
                "check spelling": "检查服务名称是否拼写正确或尝试扩大您的搜索范围",
                "go back": "返回主要服务",
                "main services": "主要服务",
                "all services": "所有服务",
                "search results": "搜索结果",
                "search": "收索服务",
            },
            "Catalog": {
                "header text1": "服务目录",
                "header text2": "只需单击几下即可探索、启动和配置服务.",
                "contribute to the catalog": ({ catalogName }) =>
                    `为目录 ${catalogName} 做贡献`,
                "contribute to the package": ({ packageName }) =>
                    `访问源包 ${packageName} `,
                "here": "此处",
            },
            "CatalogLauncher": {
                "no longer bookmarked dialog title": "更改未保存",
                "no longer bookmarked dialog body": "再次单击书签符号以更新您保存的配置.",
                "ok": "是",
                "should overwrite configuration dialog title": "您想更换它吗?",
                "should overwrite configuration dialog subtitle": ({ friendlyName }) =>
                    `«${friendlyName}» 已经存在于您的记录中`,
                "should overwrite configuration dialog body":
                    "已存在同名的注册服务. 如果替换它, 原始内容将丢失.",
                "cancel": "取消",
                "replace": "取代",
                "sensitive configuration dialog title": "您想更换它吗?", //TODO
                "proceed to launch": "继续启动", //TODO
            },
            "Footer": {
                "contribute": "为项目做贡献",
                "terms of service": "使用条款",
                "change language": "切换语言",
            },
            "CatalogLauncherMainCard": {
                "card title": "创建自定义服务",
                "friendly name": "自定义名称",
                "launch": "启动",
                "cancel": "取消",
                "copy url helper text": "复制 URL 以恢复此配置",
                "save configuration": "保存当前服务",
                "share the service": "分享服务",
                "share the service - explain": "让其他组员可以访问该服务",
            },
            "CatalogLauncherConfigurationCard": {
                "global config": "全局设置",
                "configuration": ({ packageName }) => `配置 ${packageName}`,
                "dependency": ({ dependencyName }) => `依赖服务 ${dependencyName}`,
                "launch of a service": ({ dependencyName }) =>
                    `启动一个服务 ${dependencyName}`,
                "mismatching pattern": undefined,
                "Invalid YAML Object": undefined,
                "Invalid YAML Array": undefined,
            },
            "MyServices": {
                "text1": "我的服务",
                "text2": "快速启动、查看和管理您正在运行的各种服务。",
                "text3": "建议您在每次工作会话后删除您的服务.",
                "running services": "正在运行的服务",
                "confirm delete title": "您确定?",
                "confirm delete subtitle": "确保您的服务不包括未保存的工作。",
                "confirm delete body":
                    "在继续之前不要忘记将您的代码推送到 GitHub 或 GitLab.",
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
                "which token expire when": ({ which, howMuchTime }) =>
                    `令牌 ${which} 在 ${howMuchTime} 后过期.`,
                "which token expired": ({ which }) => `令牌 ${which} 已经过期.`,
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
                "everything have been printed to the console":
                    "所有的信息都会记录在日志里",
                "first copy the password": "请复制您的密码",
                "open the service": "打开服务 🚀",
                "return": "返回",
            },
            "LoginDivider": {
                "or": "或者",
            },
            "Terms": {
                "no terms": undefined,
            },
            "Login": {
                "doRegister": "创建帐户",
            },
            /* spell-checker: enable */
        },
    },
);

export { useTranslation, resolveLocalizedString, useLang, useResolveLocalizedString };

export const evtLang = statefulObservableToStatefulEvt({
    "statefulObservable": $lang,
});
