import MuiLink from "@mui/material/Link";
import type { Translations } from "../types";

export const translations: Translations<"en"> = {
    "Account": {
        "infos": "Account infos",
        "third-party-integration": "external services",
        "storage": "Connect to storage",
        "k8sCredentials": "Kubernetes",
        "user-interface": "Interface preferences",
        "text1": "My account",
        "text2": "Access your different account information.",
        "text3":
            "Configure your usernames, emails, passwords and personal access tokens directly connected to your services.",
        "personal tokens tooltip":
            "Password that are generated for you and that have a given validity period",
        "vault": "Vault"
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
        "ip address": "IP Address"
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
        "personal token": ({ serviceName }) => `${serviceName} personal access token`,
        "link for token creation": ({ serviceName }) =>
            `Create your ${serviceName} token.`,
        "accessible as env":
            "Accessible withing your services as the environnement variable"
    },
    "AccountStorageTab": {
        "credentials section title": "Connect your data to your services",
        "credentials section helper":
            "Amazon-compatible MinIO object storage (AWS S3). This information is already filled in automatically.",
        "accessible as env":
            "Accessible withing your services as the environnement variable:",
        "init script section title": "To access your storage outside of datalab services",
        "init script section helper":
            "Download or copy the init script in the programming language of your choice.",
        "expires in": ({ howMuchTime }) => `Expires in ${howMuchTime}`
    },
    "AccountKubernetesTab": {
        "credentials section title": "Connect to the Kubernetes cluster",
        "credentials section helper": "Credentials to manage the Kubernetes cluster",
        "init script section title":
            "To connect to the Kubernetes cluster via your local kubectl",
        "init script section helper": "Download or copy the script",
        "expires in": ({ howMuchTime }) => `The token expires in ${howMuchTime}`
    },
    "AccountVaultTab": {
        "credentials section title": "Vault credentials",
        "credentials section helper": ({ vaultDocHref, mySecretLink }) => (
            <>
                <MuiLink href={vaultDocHref} target="_blank">
                    Vault
                </MuiLink>{" "}
                is the system where &nbsp;
                <MuiLink {...mySecretLink}>your secrets</MuiLink> are stored.
            </>
        ),
        "init script section title": "Use vault from your terminal",
        "init script section helper": ({ vaultCliDocLink }) => (
            <>
                Download or copy the <code>ENV</code> variables that configures your local{" "}
                <MuiLink href={vaultCliDocLink} target="_blank">
                    Vault CLI
                </MuiLink>
            </>
        ),
        "expires in": ({ howMuchTime }) => `The token expires in ${howMuchTime}`
    },
    "AccountUserInterfaceTab": {
        "title": "Interface preferences",
        "enable dark mode": "Enable dark mode",
        "dark mode helper": "Low light interface theme with dark colored background.",
        "enable beta": "Enable beta-test mode",
        "beta mode helper": "For advanced platform configurations and features.",
        "enable dev mode": "Enable developer mode",
        "dev mode helper": "Enable features that are currently being developed"
    },
    "AccountField": {
        "copy tooltip": "Copy in clipboard",
        "language": "Change language",
        "service password": "Password for your services",
        "service password helper text": `This password is required to log in to all of your services. 
            It is generated automatically and renews itself regularly.`,
        "not yet defined": "Not yet defined",
        "reset helper dialogs": "Reset instructions windows",
        "reset": "Reset",
        "reset helper dialogs helper text":
            "Reset message windows that have been requested not to be shown again"
    },
    "MyFiles": {
        "page title - my files": "My Files",
        "page title - my secrets": "My Secrets",
        "what this page is used for - my files": "Here you can browse your S3 Buckets.",
        "what this page is used for - my secrets":
            "Here can be defined variables that will be accessible in you services under the form of environnement variable.",
        "help content": ({ accountTabLink, docHref }) => (
            <>
                Read{" "}
                <MuiLink href={docHref} target="_blank">
                    our documentation
                </MuiLink>
                . &nbsp;
                <MuiLink {...accountTabLink}>Configure the minio clients</MuiLink>.
            </>
        )
    },
    "MySecrets": {
        "page title - my files": "My Files",
        "page title - my secrets": "My Secrets",
        "what this page is used for - my files": "Here you can browse your S3 Buckets.",
        "what this page is used for - my secrets":
            "Here can be defined variables that will be accessible in you services under the form of environnement variable.",
        "learn more - my files": "To learn more about file management,",
        "help content": ({ accountTabLink, docHref }) => (
            <>
                Read{" "}
                <MuiLink href={docHref} target="_blank">
                    our documentation
                </MuiLink>
                . &nbsp;
                <MuiLink {...accountTabLink}>Configure your local Vault CLI</MuiLink>.
            </>
        )
    },
    "SecretsExplorerItem": {
        "description": "description"
    },
    "ExplorerItem": {
        "description": "description"
    },
    "SecretsExplorerButtonBar": {
        "file": "file",
        "secret": "secret",
        "rename": "rename",
        "delete": "delete",
        "create secret": "Create secret",
        "upload file": "Upload file",
        "copy path": "Use in a service",
        "create directory": "Create directory",
        "refresh": "refresh",
        "create what": ({ what }) => `Create ${what}`,
        "new": "New"
    },
    "ExplorerButtonBar": {
        "file": "file",
        "secret": "secret",
        "delete": "delete",
        "create secret": "Create secret",
        "upload file": "Upload file",
        "copy path": "Copy S3 object name",
        "create directory": "Create directory",
        "refresh": "refresh",
        "create what": ({ what }) => `Create ${what}`,
        "new": "New"
    },
    "ExplorerItems": {
        "empty directory": "This directory is empty"
    },
    "SecretsExplorerItems": {
        "empty directory": "This directory is empty"
    },
    "SecretsExplorer": {
        "file": "file",
        "secret": "secret",
        "create": "create",
        "cancel": "cancel",
        "delete": "delete",
        "do not display again": "Don't display again",

        "untitled what": ({ what }) => `untitled_${what}`,
        "directory": "folder",
        "deletion dialog title": ({ deleteWhat }) => `Delete a ${deleteWhat} ?`,
        "deletion dialog body": ({
            deleteWhat
        }) => `You are about to delete ${deleteWhat}.
            This action can't be reverted.`,
        "already a directory with this name":
            "There is already a directory with this name",
        "can't be empty": "Can't be empty",
        "new directory": "New directory"
    },
    "Explorer": {
        "file": "file",
        "secret": "secret",
        "create": "create",
        "cancel": "cancel",
        "delete": "delete",
        "do not display again": "Don't display again",

        "untitled what": ({ what }) => `untitled_${what}`,
        "directory": "folder",
        "deletion dialog title": ({ deleteWhat }) => `Delete a ${deleteWhat} ?`,
        "deletion dialog body": ({
            deleteWhat
        }) => `You are about to delete ${deleteWhat}.
            This action can't be reverted.`,
        "already a directory with this name":
            "There is already a directory with this name",
        "can't be empty": "Can't be empty",
        "new directory": "New directory"
    },
    "MySecretsEditor": {
        "do not display again": "Don't display again",
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
        "use secret dialog ok": "Got it"
    },
    "MySecretsEditorRow": {
        "key input desc": "Environnement variable name",
        "value input desc": "Environnement variable value"
    },
    "ExplorerUploadModalDropArea": {
        "browse files": "browse files",
        "drag and drop or": "Drag and drop or"
    },
    "ExplorerUploadProgress": {
        "over": "over",
        "importing": "Importing"
    },
    "ExplorerUploadModal": {
        "import files": "Import files",
        "cancel": "Cancel",
        "minimize": "Minimize"
    },

    "Header": {
        "login": "Login",
        "logout": "Logout",
        "project": "Project",
        "region": "Region"
    },
    "App": {
        "reduce": "Reduce",
        "home": "Home",
        "account": "My account",
        "catalog": "Services catalog",
        "myServices": "My Services",
        "mySecrets": "My Secrets",
        "myFiles": "My Files",
        "divider: services features": "Services features",
        "divider: external services features": "External services features",
        "divider: onyxia instance specific features": "Onyxia instance specific features"
    },
    "Page404": {
        "not found": "Page not found"
    },
    "PortraitModeUnsupported": {
        "portrait mode not supported": "Portrait mode isn't supported yet",
        "instructions":
            "To use this app on your phone please enable the rotation sensor and turn your phone."
    },
    "Home": {
        "welcome": ({ who }) => `Welcome ${who}!`,
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
        "cardButton3": "Consult the data"
    },
    "CatalogExplorerCard": {
        "launch": "Launch",
        "learn more": "Learn more"
    },
    "CatalogExplorerCards": {
        "show more": "Show more",
        "no service found": "No service found",
        "no result found": ({ forWhat }) => `No result found for ${forWhat}`,
        "check spelling": "Please check your spelling or try widening your search.",
        "go back": "Back to main services",
        "main services": "Main services",
        "all services": "All services",
        "search results": "Search result",
        "search": "Search"
    },
    "Catalog": {
        "header text1": "Services catalog",
        "header text2": "Explore, launch and configure services with just a few clicks.",
        "contribute to the catalog": ({ catalogName }) => (
            <>Contribute to the {catalogName} catalog</>
        ),
        "contribute to the package": ({ packageName }) =>
            `Find the sources of the ${packageName} package `,
        "here": "here"
    },
    "CatalogLauncher": {
        "no longer bookmarked dialog title": "Your changes wont be saved",
        "no longer bookmarked dialog body":
            "Click on the bookmark icon again to update your saved configuration",
        "ok": "Ok",
        "should overwrite configuration dialog title": "Would you like to replace it?",
        "should overwrite configuration dialog subtitle": ({ friendlyName }) =>
            `«${friendlyName}» already exists in your store.`,
        "should overwrite configuration dialog body":
            "You already have a saved service with this name. If you replace it the previous configuration will be lost",
        "cancel": "Annuler",
        "replace": "Replace it",
        "sensitive configuration dialog title": "Launching this service may be dangerous",
        "proceed to launch": "Proceed to launch"
    },
    "Footer": {
        "contribute": "Contribute",
        "terms of service": "Terms of service",
        "change language": "Change language",
        "dark mode switch": "Dark mode switch"
    },
    "CatalogLauncherMainCard": {
        "card title": "Create your personal services",
        "friendly name": "Friendly name",
        "launch": "Launch",
        "cancel": "Cancel",
        "copy url helper text": "Copy url to restore this configuration",
        "save configuration": "Save this configuration",
        "share the service": "Share the service",
        "share the service - explain": "Make the service accessible to the group members",
        "restore all default": "Restore default configurations"
    },
    "CatalogLauncherConfigurationCard": {
        "global config": "Global configuration",
        "configuration": ({ packageName }) => `${packageName} configurations`,
        "dependency": ({ dependencyName }) => `${dependencyName} dependency`,
        "launch of a service": ({ dependencyName }) =>
            `A ${dependencyName} service will be launched`,
        "mismatching pattern": ({ pattern }) => `Should match ${pattern}`,
        "Invalid YAML Object": "Invalid YAML Object",
        "Invalid YAML Array": "Invalid YAML Array"
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
        "confirm": "Yes, delete"
    },
    "MyServicesButtonBar": {
        "refresh": "Refresh",
        "launch": "New service",
        "password": "Copy the services password",
        "trash": "Delete all",
        "trash my own": "Delete all my services"
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
        "this is a shared service": "This service is shared among project's member"
    },
    "MyServicesRunningTime": {
        "launching": "Launching..."
    },
    "MyServicesSavedConfigOptions": {
        "edit": "Edit",
        "copy link": "Copy URL link",
        "remove bookmark": "Delete"
    },
    "MyServicesSavedConfig": {
        "edit": "Edit",
        "launch": "Launch"
    },
    "MyServicesSavedConfigs": {
        "saved": "Saved",
        "show all": "Show all"
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
        "return": "Return"
    }
};
