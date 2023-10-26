import MuiLink from "@mui/material/Link";
import { Markdown } from "onyxia-ui/Markdown";
import type { Translations } from "../types";
import { elementsToSentence } from "ui/tools/elementsToSentence";

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
        "credentials section helper":
            "Credentials to interact directly with the Kubernetes API server.",
        "init script section title": "Shell script",
        "init script section helper": ({ installKubectlUrl }) => (
            <>
                This script enables to use kubectl or helm on your local machine. <br />
                To use it simply{" "}
                <MuiLink href={installKubectlUrl} target="_blank">
                    install kubectl on your machine
                </MuiLink>{" "}
                and run the script by copy pasting it in your terminal.
                <br />
                After doing so you you can confirm that it works by running the
                command&nbsp;
                <code>kubectl get pods</code> or <code>helm list</code>
            </>
        ),
        "expires in": ({ howMuchTime }) =>
            `Theses credentials are valid for the next ${howMuchTime}`
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
        "dev mode helper": "Enable features that are currently being developed",
        "Enable command bar": "Command bar",
        "Enable command bar helper": ({ imgUrl }) => (
            <>
                The{" "}
                <MuiLink href={imgUrl} target="_blank">
                    the command bar
                </MuiLink>{" "}
                gives you insight on the commands ran on your behalf when you interact
                with the UI.
            </>
        )
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
            "Here can be defined variables that will be accessible in your services under the form of environnement variables.",
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
            "Here can be defined variables that will be accessible in your services under the form of environnement variables.",
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
        "catalog": "Service catalog",
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
    "Catalog": {
        "header text1": "Service catalog",
        "header text2": "Explore, launch and configure services with just a few clicks.",
        "header help": ({ catalogName, catalogDescription, repositoryUrl }) => (
            <>
                You are exploring Helm Chart Repository{" "}
                <MuiLink href={repositoryUrl} target="_blank">
                    {catalogName}: {catalogDescription}
                </MuiLink>
            </>
        ),
        "here": "here",
        "show more": "Show more",
        "no service found": "No service found",
        "no result found": ({ forWhat }) => `No result found for ${forWhat}`,
        "check spelling": "Please check your spelling or try widening your search.",
        "go back": "Back to main services",
        "search results": "Search result",
        "search": "Search"
    },
    "CatalogChartCard": {
        "launch": "Launch",
        "learn more": "Learn more"
    },
    "CatalogNoSearchMatches": {
        "no service found": "No service found",
        "no result found": ({ forWhat }) => `No result found for ${forWhat}`,
        "check spelling": "Please check your spelling or try widening your search.",
        "go back": "Back to main services"
    },
    "Launcher": {
        "header text1": "Services catalog",
        "header text2": "Explore, launch and configure services with just a few clicks.",
        "chart sources": ({ chartName, urls }) =>
            urls.length === 0 ? (
                <></>
            ) : (
                <>
                    Access the source{urls.length === 1 ? "" : "s"} of the chart{" "}
                    {chartName}:&nbsp;
                    {elementsToSentence({
                        "elements": urls.map(source => (
                            <MuiLink href={source} target="_blank" underline="hover">
                                here
                            </MuiLink>
                        )),
                        "language": "en"
                    })}
                </>
            ),
        "download as script": "Download as script",
        "api logs help body": ({
            k8CredentialsHref,
            myServicesHref,
            interfacePreferenceHref
        }) => (
            <Markdown
                getDoesLinkShouldOpenNewTab={href => {
                    switch (href) {
                        case k8CredentialsHref:
                            return true;
                        case myServicesHref:
                            return true;
                        case interfacePreferenceHref:
                            return false;
                        default:
                            return false;
                    }
                }}
            >{`We've designed the command bar to empower you to take control over your Kubernetes deployments. 
Here's what you need to know:

#### What are those Helm Commands?  

Theses commands are the exact Helm command that Onyxia API will execute on your behalf in your Kubernetes namespace.  
This enables you to know what's happening behind the scenes when you interact with the UI.  

#### Real-time Updates  

As you interact with the UI, the Helm commands will automatically update to reflect what you are doing.  

#### Why Should I Care?  

- **Transparency:** We believe you have the right to know what actions are being performed in your environment.  
- **Learning:** Understanding these commands can provide insight into Kubernetes and Helm, deepening your knowledge.  
- **Manual Execution:** You can copy and paste those commands into a terminal with write-access to Kubernetes, allowing you to launch the service manually.  

#### How Can I Run Those Commands Manually?  

${k8CredentialsHref === undefined ? "" : "There are two ways to run theses commands:  "}  

${
    k8CredentialsHref === undefined
        ? ""
        : `
- **Local Terminal:** Go to [\`My Account -> Kubernetes tab\`](${k8CredentialsHref}).  
  Here, you will find the credentials that allow you to run commands in your Kubernetes namespace from your local terminal.  
`
}

- If this instance of onyxia features services VSCode or Jupyter you can open a terminal within theses services and run command there.  
  For constructive or destructive commands you will need to launch your service with Kubernetes role \`admin\` or \`edit\`.  

By executing the command manually, you will still be able to see the service in the [\`MyServices\`](${myServicesHref}) page as if it was launched via the UI.  

You can disable the command bar in the [\`My Account -> Interface preference tab\`](${interfacePreferenceHref}).

Feel free to explore and take charge of your Kubernetes deployments!  
        `}</Markdown>
        )
    },
    "AcknowledgeSharingOfConfigConfirmDialog": {
        "acknowledge sharing of config confirm dialog title":
            "Be aware, configurations are shared",
        "acknowledge sharing of config confirm dialog subtitle": ({
            groupProjectName
        }) => `If you save
        this configuration every member of the project ${groupProjectName} will be able to launch it.`,
        "acknowledge sharing of config confirm dialog body": `Although no personal information have been automatically injected 
        by Onyxia, be aware not to share any sensitive information shared restorable configuration.`,
        "cancel": "Cancel",
        "i understand, proceed": "I understand, proceed"
    },
    "AutoLaunchDisabledDialog": {
        "auto launch disabled dialog title":
            "Auto launch feature disabled on this Onyxia instance",
        "auto launch disabled dialog body": (
            <>
                <b>WARNING</b>: Someone might be trying to trick you into launching a
                service that might compromise your namespace integrity.
                <br />
                Please carefully review the service configuration before launching it.
                <br />
                If you have any doubt, please contact your administrator.
            </>
        ),
        "ok": "Ok"
    },
    "NoLongerBookmarkedDialog": {
        "no longer bookmarked dialog title": "Your changes wont be saved",
        "no longer bookmarked dialog body":
            "Click on the bookmark icon again to update your saved configuration",
        "ok": "Ok"
    },
    "SensitiveConfigurationDialog": {
        "sensitive configuration dialog title": "Launching this service may be dangerous",
        "cancel": "Annuler",
        "proceed to launch": "Proceed to launch"
    },
    "LauncherMainCard": {
        "card title": "Create your personal services",
        "friendly name": "Friendly name",
        "launch": "Launch",
        "cancel": "Cancel",
        "copy url helper text": "Copy url to restore this configuration",
        "share the service": "Share the service",
        "share the service - explain": "Make the service accessible to the group members",
        "restore all default": "Restore default configurations",
        "bookmark button": ({ isBookmarked }) =>
            `${isBookmarked ? "Delete" : "Save"} configuration`,
        "bookmark button tooltip": ({ myServicesSavedConfigsExtendedLink }) => (
            <>
                Saved configurations can be quickly relaunched from the&nbsp;
                <MuiLink {...myServicesSavedConfigsExtendedLink} target="_blank">
                    My Services
                </MuiLink>{" "}
                page
            </>
        ),
        "version select label": "Version",
        "version select helper text": ({
            chartName,
            catalogRepositoryUrl,
            catalogName
        }) => (
            <>
                Version of the {chartName} Chart in the&nbsp;
                <MuiLink href={catalogRepositoryUrl}>
                    {catalogName} Helm Repository{" "}
                </MuiLink>
            </>
        ),
        "save changes": "Save changes"
    },
    "LauncherConfigurationCard": {
        "global config": "Global configuration",
        "configuration": ({ packageName }) => `${packageName} configurations`,
        "dependency": ({ dependencyName }) => `${dependencyName} dependency`,
        "launch of a service": ({ dependencyName }) =>
            `A ${dependencyName} service will be launched`,
        "mismatching pattern": ({ pattern }) => `Should match ${pattern}`,
        "Invalid YAML Object": "Invalid YAML Object",
        "Invalid YAML Array": "Invalid YAML Array"
    },
    "Footer": {
        "contribute": "Contribute",
        "terms of service": "Terms of service",
        "change language": "Change language",
        "dark mode switch": "Dark mode switch"
    },
    "MyServices": {
        "text1": "My Services",
        "text2": "Access your running services",
        "text3":
            "Services are supposed to be shut down as soon as you stop using them actively.",
        "running services": "Running services"
    },
    "MyServicesConfirmDeleteDialog": {
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
        "trash": "Delete all",
        "trash my own": "Delete all my services"
    },
    "MyServicesCard": {
        "service": "Service",
        "running since": "Running since: ",
        "open": "Open",
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
    "MyServicesRestorableConfigOptions": {
        "edit": "Edit",
        "copy link": "Copy URL link",
        "remove bookmark": "Delete"
    },
    "MyServicesRestorableConfig": {
        "edit": "Edit",
        "launch": "Launch"
    },
    "MyServicesRestorableConfigs": {
        "saved": "Saved",
        "show all": "Show all"
    },
    "ReadmeAndEnvDialog": {
        "ok": "ok",
        "return": "Return"
    },
    "CopyOpenButton": {
        "first copy the password": "Click to copy the password...",
        "open the service": "Open the service 🚀"
    },
    "MyServicesCards": {
        "running services": "Running services"
    },
    "NoRunningService": {
        "launch one": "Click here to launch one",
        "no services running": "You don't have any service running"
    },
    "CommandBar": {
        "ok": "Ok"
    },
    "moment": {
        "date format": ({ isSameYear }) =>
            `dddd, MMMM Do${isSameYear ? "" : " YYYY"}, h:mm a`,
        "past1": ({ divisorKey }) => {
            switch (divisorKey) {
                case "now":
                    return "just now";
                case "second":
                    return "a second ago";
                case "minute":
                    return "a minute ago";
                case "hour":
                    return "an hour ago";
                case "day":
                    return "yesterday";
                case "week":
                    return "last week";
                case "month":
                    return "last month";
                case "year":
                    return "last year";
            }
        },
        "pastN": ({ divisorKey }) => {
            switch (divisorKey) {
                case "now":
                    return "just now";
                case "second":
                    return "# seconds ago";
                case "minute":
                    return "# minutes ago";
                case "hour":
                    return "# hours ago";
                case "day":
                    return "# days ago";
                case "week":
                    return "# weeks ago";
                case "month":
                    return "# months ago";
                case "year":
                    return "# years ago";
            }
        },
        "future1": ({ divisorKey }) => {
            switch (divisorKey) {
                case "now":
                    return "just now";
                case "second":
                    return "in a second";
                case "minute":
                    return "in a minute";
                case "hour":
                    return "in an hour";
                case "day":
                    return "in a day";
                case "week":
                    return "in a week";
                case "month":
                    return "in a month";
                case "year":
                    return "in a year";
            }
        },
        "futureN": ({ divisorKey }) => {
            switch (divisorKey) {
                case "now":
                    return "just now";
                case "second":
                    return "in # seconds";
                case "minute":
                    return "in # minutes";
                case "hour":
                    return "in # hours";
                case "day":
                    return "in # days";
                case "week":
                    return "in # weeks";
                case "month":
                    return "in # months";
                case "year":
                    return "in # years";
            }
        }
    }
};
