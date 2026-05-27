import MuiLink from "@mui/material/Link";
import { Markdown } from "ui/shared/Markdown";
import type { Translations } from "../types";
import { Icon } from "onyxia-ui/Icon";
import { getIconUrlByName } from "lazy-icons";
import { capitalize } from "tsafe/capitalize";
import { MaybeLink } from "ui/shared/MaybeLink";

export const translations: Translations<"en"> = {
    Account: {
        profile: "Profile",
        git: "Git",
        k8sCodeSnippets: "Kubernetes",
        "user-interface": "Interface preferences",
        text1: "My account",
        text2: "Access your different account information.",
        text3: "Configure your usernames, emails, passwords and personal access tokens directly connected to your services.",
        "personal tokens tooltip":
            "Password that are generated for you and that have a given validity period",
        vault: "Vault"
    },
    AccountProfileTab: {
        "account id": "Account identifier",
        "account id helper":
            "Your intangible identifiers linked to the identity you use to log in to the platform",
        "user id": "User ID",
        email: "Email",
        "account management": "Account management"
    },
    UserProfileForm: {
        "customizable profile": "Customizable profile",
        "customizable profile helper":
            "Useful information for the automatic configuration of your services",
        save: "Save",
        restore: "Restore"
    },
    ConfirmNavigationDialog: {
        "you have unsaved changes": "You have unsaved changes!",
        cancel: "Cancel",
        "continue without saving": "Continue without saving"
    },
    AccountGitTab: {
        gitName: "Username for Git",
        "gitName helper text": ({ gitName, focusClassName }) => (
            <>
                This command will set your global Git username, executed at service
                startup:&nbsp;
                <code className={focusClassName}>
                    git config --global user.name "{gitName || "<your_username>"}"
                </code>
            </>
        ),
        gitEmail: "Email for Git",
        "gitEmail helper text": ({ gitEmail, focusClassName }) => (
            <>
                This command will set your global Git email, executed at service
                startup:&nbsp;
                <code className={focusClassName}>
                    git config --global user.email "
                    {gitEmail || "<your_email@domain.com>"}"
                </code>
            </>
        ),
        githubPersonalAccessToken: "Git Forge Personal Access Token",
        "githubPersonalAccessToken helper text": ({ focusClassName }) => (
            <>
                By providing this token, you can clone and push to your private GitHub or
                GitLab repositories without re-entering your forge's credentials each
                time.
                <br />
                This token will also be available as an environment variable:&nbsp;
                <span className={focusClassName}>$GIT_PERSONAL_ACCESS_TOKEN</span>
            </>
        )
    },
    AccountKubernetesTab: {
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
            `These credentials are valid for the next ${howMuchTime}`
    },
    AccountVaultTab: {
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
        "expires in": ({ howMuchTime }) => `The token expires ${howMuchTime}`
    },
    AccountUserInterfaceTab: {
        title: "Interface preferences",
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
                    command bar
                </MuiLink>{" "}
                gives you insight on the commands ran on your behalf when you interact
                with the UI.
            </>
        )
    },
    SettingField: {
        "copy tooltip": "Copy in clipboard",
        language: "Change language",
        "service password": "Default service password",
        "service password helper text": ({ groupProjectName }) => (
            <>
                This is the default password used to protect your running services. <br />
                When you launch a service, the security tab's password field is pre-filled
                with this password. <br />
                Clicking on the{" "}
                <Icon size="extra small" icon={getIconUrlByName("Refresh")} /> icon will
                generate a new random password. However, be aware that it will not update
                the password for services that are currently running. <br />
                The service password is what Onyxia makes you to copy to your clipboard
                before accessing a running service. <br />
                {groupProjectName !== undefined && (
                    <>
                        Please note that this password is shared among all members of the
                        project ({groupProjectName}).
                    </>
                )}
            </>
        ),
        "not yet defined": "Not yet defined",
        "reset helper dialogs": "Reset instructions windows",
        reset: "Reset",
        "reset helper dialogs helper text":
            "Reset message windows that have been requested not to be shown again"
    },
    ConfirmBucketCreationAttemptDialog: {
        "bucket does not exist title": ({ bucket }) =>
            `The ${bucket} bucket does not exist`,
        "bucket does not exist body": "Do you want to attempt creating it now?",
        no: "No",
        yes: "Yes",
        "success title": "Success",
        "failed title": "Failed",
        "success body": ({ bucket }) => `Bucket ${bucket} successfully created.`,
        "failed body": ({ bucket }) => `Failed to create ${bucket}.`,
        ok: "Ok"
    },
    ConfirmOverwriteDialog: {
        "dialog title": "File already exists",
        "dialog body": "Do you want to overwrite the existing file?",
        cancel: "Cancel",
        overwrite: "Overwrite"
    },
    ConfirmCustomS3ConfigDeletionDialog: {
        "dialog title": "Confirm deletion of custom S3 config?",
        cancel: "Cancel",
        yes: "Yes"
    },
    DisplayErrorDialog: {
        error: "Error",
        ok: "Ok"
    },
    CreateOrRenameBookmarkDialog: {
        "dialog title": "Bookmark Name",
        "add dialog title": "Add this location to bookmarks",
        "rename dialog title": "Rename bookmark",
        "dialog subtitle": "Save this S3 location so you can access it faster later.",
        "bookmarkName textField label": "Name",
        "bookmarkName textField empty error": "Bookmark name can't be empty",
        "copy s3 path aria label": "Copy S3 path",
        cancel: "Cancel",
        ok: "Ok",
        "add to bookmarks": "Add to bookmarks",
        "rename bookmark": "Rename bookmark"
    },
    DirectoryCreationDialog: {
        "dialog title": "Create directory",
        "dialog subtitle":
            "Directories are created relative to the prefix currently being listed.",
        "create prefix dialog title": "Create prefix",
        "create prefix dialog subtitle":
            "Create a new prefix inside the current S3 location.",
        "directoryName textField label": "Directory name",
        "prefixName textField label": "Prefix name",
        "directoryName textField empty error": "Directory name can't be empty",
        "directoryName textField duplicate error": "Directory name already exists",
        cancel: "Cancel",
        create: "Create",
        "create prefix": "Create prefix"
    },
    MakePrefixPublicDialog: {
        "dialog title": "Make prefix public",
        "make public dialog title": "Make this prefix public?",
        "make private dialog title": "Make this prefix private?",
        "make public dialog body main":
            "All files in this prefix will be accessible to anyone with a link, including current and future content.",
        "make public dialog body alternative":
            "To share specific files or limit access over time, create a sharing link instead.",
        "make private dialog body main":
            "All files in this prefix are accessible to anyone with a link, including current and future content. Making this prefix private removes public access.",
        "make private dialog body alternative":
            "To share specific files or limit access over time, create a sharing link instead.",
        "dialog body": ({ s3Uri, s3UriClassName }) => (
            <>
                You&apos;re about to make <span className={s3UriClassName}>{s3Uri}</span>{" "}
                public. Anyone will be able to list and download all current and future
                objects in this prefix.
                <br />
                <br />
                Download links you share for objects in this prefix will never expire.
            </>
        ),
        cancel: "Cancel",
        "make public": "Make public",
        "make private": "Make private"
    },
    S3ExplorerMainView: {
        "create prefix dialog title": "Create prefix",
        "create prefix dialog subtitle":
            "Create a new prefix inside the current S3 location.",
        "prefix name field label": "Prefix name",
        "prefix name empty error": "Prefix name cannot be empty.",
        cancel: "Cancel",
        "create prefix": "Create prefix",
        "delete selection dialog title": "Delete selection",
        "delete selection dialog subtitle":
            "This action permanently deletes the selected items.",
        "delete selection dialog body": ({ count }) =>
            `You are about to delete ${count} selected item${count > 1 ? "s" : ""}. Deleting a prefix also deletes everything inside it.`,
        delete: "Delete",
        uploaded: "Uploaded",
        share: "Share",
        download: "Download",
        "copy s3 path": "Copy S3 path",
        "add to bookmarks": "Add to bookmarks",
        "delete from bookmarks": "Delete from bookmarks",
        "make public": "Make public",
        "make private": "Make private",
        folder: "Folder",
        object: "Object",
        "folder is public": "Folder is public",
        "folder is private": "Folder is private",
        today: "Today",
        yesterday: "Yesterday",
        "access denied": "Access denied",
        "bucket not found": "Bucket not found",
        "access denied description":
            "You do not have permission to list this S3 location.",
        "bucket not found description":
            "The requested bucket does not exist or is not reachable with the current profile.",
        "select item": ({ itemName }) => `Select ${itemName}`,
        "select all items": "Select all items",
        public: "Public",
        deleting: "Deleting...",
        uploading: "Uploading",
        "drag and drop to import files": "Drag and drop to import files",
        "this prefix is empty": "This prefix is empty",
        "empty prefix description":
            "Upload files or create a folder to start populating this location.",
        "upload files": "Upload files",
        "new folder": "New folder",
        name: "Name",
        "last modified": "Last modified",
        size: "Size"
    },
    S3ShareObjectDialog: {
        "generating public URL": "Generating public URL...",
        "copy public URL aria label": "Copy public URL",
        "signed link with time limit": "Signed link with time limit",
        "signed link validity aria label": "Signed link validity duration",
        "generating signed URL": "Generating signed URL...",
        "copy signed URL aria label": "Copy signed URL",
        "public description":
            "Anyone with the URL can access this object. The link never expires because the object is inside a public prefix.",
        "signed description":
            "Create a signed URL with a limited validity period. To share a URL that does not expire, make one of this object's parent prefixes public.",
        "validity duration one hour": "1 hour",
        "validity duration one day": "1 day",
        "validity duration one week": "1 week",
        "selected duration": "the selected duration"
    },
    S3Explorer: {
        "page header title": "File Explorer",
        "create profile": "Create Profile",
        back: "Back",
        upload: "Upload",
        "create new prefix": "Create new Prefix"
    },
    S3ShareObjectDialogContainer: {
        "dialog title": "Share object"
    },
    S3BookmarksBar: {
        "s3 bookmarks aria label": "S3 bookmarks",
        "show more bookmarks": "Show more bookmarks"
    },
    S3BookmarkItem: {
        "open bookmark": "Open bookmark",
        "open bucket": "Open bucket",
        "bookmark actions": "Bookmark actions",
        rename: "Rename",
        delete: "Delete",
        "rename bookmark": "Rename bookmark",
        "delete bookmark": "Delete bookmark"
    },
    S3BookmarksEntryPointList: {
        "s3 bookmark entry points aria label": "S3 bookmark entry points",
        bookmarks: "Bookmarks",
        "no bookmarks yet": "No bookmarks yet.",
        "storage locations": "Storage locations"
    },
    S3DialogCopyField: {
        "generating url": "Generating URL...",
        copy: "Copy",
        copied: "Copied"
    },
    S3DialogItemSummary: {
        public: "Public"
    },
    S3ProfileSelect: {
        "select s3 profile aria label": "Select S3 profile",
        "profile settings aria label": "Profile settings",
        "s3 profiles aria label": "S3 profiles",
        "new s3 profile": "New S3 Profile"
    },
    S3SelectionActionBar: {
        download: "Download",
        delete: "Delete",
        "copy s3 path": "Copy S3 path",
        copied: "Copied",
        "copy s3 uri tooltip": ({ s3Uri }) => <>Copy {s3Uri}</>,
        "add to bookmarks": "Add to bookmarks",
        "delete from bookmarks": "Delete from bookmarks",
        share: "Share",
        "make public": "Make public",
        "make private": "Make private",
        "one selected": "1 selected",
        "many selected": ({ count }) => `${count} selected`,
        "clear selection": "Clear selection"
    },
    ConfirmAbortUploadDialog: {
        "dialog title": "Cancel Upload?",
        "dialog body":
            "Your upload is not complete. Would you like to cancel the upload?",
        "continue upload": "Continue Upload",
        "cancel upload": "Cancel Upload"
    },
    S3Uploads: {
        "uploading count": ({ count }) =>
            `Uploading ${count} item${count === 1 ? "" : "s"}...`,
        "upload count": ({ count }) => `${count} upload${count === 1 ? "" : "s"}`,
        "expand uploads": "Expand uploads",
        "collapse uploads": "Collapse uploads",
        "close uploads": "Close uploads",
        "uploading status": "Uploading...",
        completed: "Completed",
        cancelled: "Cancelled",
        error: "Error",
        "uploaded size of total size": ({ uploadedSize, totalSize }) =>
            `${uploadedSize} of ${totalSize}`,
        of: "of",
        "open uploaded directory": "Open uploaded directory",
        "cancel upload": "Cancel upload",
        "retry upload": "Retry upload"
    },
    S3ProfileDialog: {
        "detail title": "S3 Profile Detail",
        "create title": "New Custom S3 Profile",
        "edit title": "Edit Custom S3 Profile",
        "close aria label": "Close S3 profile dialog"
    },
    S3ProfileDetails: {
        "read only": "Read-only",
        custom: "Custom",
        edit: "Edit",
        delete: "Delete",
        "connection details title": "Connection details",
        "connection details subtitle":
            "Use these values when configuring S3 clients outside the explorer.",
        "endpoint url label": "Endpoint URL",
        "default region label": "Default region",
        "access credentials title": "Access credentials",
        "access credentials anonymous subtitle":
            "This profile does not expose credentials. Use anonymous S3 access where the target bucket allows it.",
        "access credentials subtitle":
            "Copy the value required by the client you are configuring.",
        "access key id label": "Access key ID",
        "secret access key label": "Secret access key",
        "session token label": "Session token",
        "environment variable": "Environment variable",
        "no expiration": "No expiration time is advertised for these credentials.",
        expires: ({ expirationTime }) => `Expires ${expirationTime}.`,
        renewing: "Renewing...",
        "renew tokens": "Renew tokens",
        "init script title": "To access your storage outside of datalab services",
        "init script subtitle":
            "Download or copy the init script in the programming language of your choice.",
        "technology aria label": "Technology",
        download: "Download",
        "select s3 profile aria label": "Select S3 profile",
        "s3 profiles aria label": "S3 profiles",
        "new s3 profile": "New S3 Profile",
        "copy aria label": ({ what }) => `Copy ${what}`,
        copied: "Copied",
        copy: "Copy"
    },
    S3ProfileForm: {
        "must be an url": "Enter a valid URL.",
        "is required": "This field is required.",
        "not a valid access key id": "Enter a valid access key ID.",
        "profile name already used": "This profile name is already used.",
        "connection details title": "Connection details",
        "connection details subtitle":
            "Define the profile name and S3 endpoint used by the explorer.",
        "profile name label": "Profile name",
        "s3 service url label": "URL of the S3 service",
        "s3 service url helper": "Example: https://minio.lab.example.net",
        "default region label": "Default region",
        "default region helper": "Example: eu-west-1, if not sure, leave empty",
        "url style title": "URL style",
        "url style subtitle":
            "Specify how your S3 server formats the URL for downloading files.",
        "path style": "Path style",
        "virtual hosted style": "Virtual-hosted style",
        example: "Example",
        "account credentials title": "Account credentials",
        "account credentials subtitle":
            "Choose whether this profile uses anonymous access or explicit credentials.",
        "anonymous access": "Anonymous access",
        "access key id label": "Access Key ID",
        "access key id helper": "Example: ASIAIOSFODNN7EXAMPLE",
        "secret access key label": "Secret Access Key",
        "secret access key helper": "Example: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
        "session token label": "Session Token",
        "session token helper":
            "Optional. Leave empty when your credentials do not include a session token.",
        cancel: "Cancel",
        "save configuration": "Save Configuration",
        "create profile": "Create Profile"
    },
    MySecrets: {
        "page title - my secrets": "My Secrets",
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
                <MuiLink {...accountTabLink}>
                    Configure your local Vault CLI
                </MuiLink>.
            </>
        )
    },
    SecretsExplorerItem: {
        description: "description"
    },
    SecretsExplorerButtonBar: {
        secret: "secret",
        rename: "rename",
        delete: "delete",
        "create secret": "Create secret",
        "copy path": "Use in a service",
        "create new empty directory": "create new empty directory",
        refresh: "refresh",
        "create what": ({ what }) => `Create ${what}`,
        new: "New"
    },

    SecretsExplorerItems: {
        "empty directory": "This directory is empty"
    },
    SecretsExplorer: {
        file: "file",
        secret: "secret",
        create: "create",
        cancel: "cancel",
        delete: "delete",
        "do not display again": "Don't display again",

        "untitled what": ({ what }) => `untitled_${what}`,
        directory: "folder",
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
    MySecretsEditor: {
        "do not display again": "Don't display again",
        "add an entry": "Add a new variable",
        "environnement variable default name": "NEW_VAR",
        "table of secret": "table of secret",

        "key column name": "Variable name",
        "value column name": "Value",
        "unavailable key": "Already used",
        "invalid key empty string": "Name required",
        "invalid key _ not valid": "Can't be just _",
        "invalid key start with digit": "Can't start with a digit",
        "invalid key invalid character": "Invalid character",
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
    MySecretsEditorRow: {
        "key input desc": "Environnement variable name",
        "value input desc": "Environnement variable value"
    },
    Header: {
        login: "Login",
        logout: "Logout",
        region: "Region"
    },
    ProjectSelect: {
        project: "Project"
    },
    LeftBar: {
        reduce: "Reduce",
        home: "Home",
        account: "My account",
        catalog: "Service catalog",
        myServices: "My Services",
        mySecrets: "My Secrets",
        "divider: services features": "Services features",
        "divider: external services features": "External services features",
        "divider: onyxia instance specific features": "Onyxia instance specific features",
        dataExplorer: "Data Explorer",
        dataCollection: "Data Collection",
        s3Explorer: "File Explorer",
        sqlOlapShell: "SQL Olap Shell"
    },
    AutoLogoutCountdown: {
        "are you still there": "Are you still there?",
        "you'll soon be automatically logged out":
            "You'll soon be automatically logged out."
    },
    Page404: {
        "not found": "Page not found"
    },
    PortraitModeUnsupported: {
        instructions:
            "To use this app on your phone please enable the rotation sensor and turn your phone."
    },
    MaybeAcknowledgeConfigVolatilityDialog: {
        "dialog title": "Be aware, configurations are volatile",
        "dialog body": `This Onyxia instance does not implement any persistence mechanism for storing configurations. 
            All configurations are stored in the browser's local storage. This means that if you clear your browser's local 
            storage or change your browser, you will lose all your configurations.`,
        "do not show next time": "Don't show this message again",
        cancel: "Cancel",
        "I understand": "I understand"
    },
    Home: {
        "title authenticated": ({ userFirstname }) => `Welcome ${userFirstname}!`,
        title: "Welcome to the Onyxia datalab",
        "new user": "New to the datalab?",
        login: "Login",
        subtitle: "Work with Python or R, enjoy all the computing power you need!",
        cardTitle1: "An ergonomic environment and on-demand services",
        cardTitle2: "An active and enthusiastic community at your service",
        cardTitle3: "Fast, flexible and online data storage",
        cardText1:
            "Analyze data, perform distributed computing and take advantage of a large catalog of services. Reserve the computing power you need.",
        cardText2:
            "Use and share the resources available to you: tutorials, training and exchange channels.",
        cardText3:
            "To easily access your data and those made available to you from your programs - S3 API implementation",
        cardButton1: "Consult the catalog",
        cardButton2: "Join the community",
        cardButton3: "Consult the data"
    },
    Catalog: {
        header: "Service catalog",
        "no result found": ({ forWhat }) => `No result found for ${forWhat}`,
        "search results": "Search result",
        search: "Search",
        "title all catalog": "All"
    },
    CatalogChartCard: {
        launch: "Launch",
        "learn more": "Learn more"
    },
    CatalogNoSearchMatches: {
        "no service found": "No service found",
        "no result found": ({ forWhat }) => `No result found for ${forWhat}`,
        "check spelling": "Please check your spelling or try widening your search.",
        "go back": "Back to main services"
    },
    Launcher: {
        sources: ({
            helmChartName,
            helmChartRepositoryName,
            labeledHelmChartSourceUrls
        }) => (
            <>
                The Helm chart{" "}
                {
                    <MaybeLink href={labeledHelmChartSourceUrls.helmChartSourceUrl}>
                        {helmChartName}
                    </MaybeLink>
                }{" "}
                belongs to the Helm chart repository{" "}
                {
                    <MaybeLink
                        href={labeledHelmChartSourceUrls.helmChartRepositorySourceUrl}
                    >
                        {helmChartRepositoryName}
                    </MaybeLink>
                }
                .
                {labeledHelmChartSourceUrls.dockerImageSourceUrl !== undefined && (
                    <>
                        {" "}
                        It is based on the Docker image{" "}
                        {
                            <MuiLink
                                href={labeledHelmChartSourceUrls.dockerImageSourceUrl}
                                target="_blank"
                            >
                                {helmChartName}
                            </MuiLink>
                        }
                        .
                    </>
                )}
            </>
        ),
        "download as script": "Download as script",
        "api logs help body": ({
            k8CredentialsHref,
            myServicesHref,
            interfacePreferenceHref
        }) => (
            <Markdown
                getLinkProps={({ href }) => {
                    const doOpensNewTab = (() => {
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
                    })();

                    return {
                        href,
                        ...(doOpensNewTab ? { target: "_blank", onClick: undefined } : {})
                    };
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
        ),
        form: "Form",
        editor: "Text Editor"
    },
    AcknowledgeSharingOfConfigConfirmDialog: {
        "acknowledge sharing of config confirm dialog title":
            "Be aware, configurations are shared",
        "acknowledge sharing of config confirm dialog subtitle": ({
            groupProjectName
        }) => `If you save
        this configuration every member of the project ${groupProjectName} will be able to launch it.`,
        "acknowledge sharing of config confirm dialog body": `Although no personal information have been automatically injected 
        by Onyxia, be aware not to share any sensitive information shared restorable configuration.`,
        cancel: "Cancel",
        "i understand, proceed": "I understand, proceed"
    },
    AutoLaunchDisabledDialog: {
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
        ok: "Ok"
    },
    NoLongerBookmarkedDialog: {
        "no longer bookmarked dialog title": "Your changes wont be saved",
        "no longer bookmarked dialog body":
            "Click on the bookmark icon again to update your saved configuration",
        ok: "Ok"
    },
    FormFieldWrapper: {
        "reset to default": "Reset to default"
    },
    ConfigurationTopLevelGroup: {
        miscellaneous: "Miscellaneous",
        global: "global",
        "Configuration that applies to all charts":
            "Configuration that applies to all charts",
        "Top level configuration values": "Top level configuration values"
    },
    YamlCodeBlockFormField: {
        "not an array": "An array is expected",
        "not an object": "An object is expected",
        "not valid yaml": "Invalid YAML/JSON"
    },
    TextFormField: {
        "not matching pattern": ({ pattern }) => `Does not match the pattern ${pattern}`,
        "toggle password visibility": "Toggle password visibility",
        loading: "Loading..."
    },
    SelectFormField: {
        "empty string": "(Empty string)"
    },
    FormFieldGroupComponent: {
        add: "Add"
    },
    AutoInjectSwitch: {
        tooltip: ({ isAutoInjected }) => (
            <>
                If enabled, this configuration will be automatically injected into your
                services. You can still manually add it later when launching a service,
                even if this is left disabled.
                <br />
                <br />
                Current state: <strong>{isAutoInjected ? "enabled" : "disabled"}</strong>
            </>
        )
    },
    NumberFormField: {
        "below minimum": ({ minimum }) => `Must be greater than or equal to ${minimum}`,
        "not a number": "Not a number",
        "not an integer": "Not an integer"
    },
    MyService: {
        "page title": ({ helmReleaseFriendlyName }) =>
            `${helmReleaseFriendlyName} Monitoring`
    },
    PodLogsTab: {
        "not necessarily first logs":
            "This is not necessarily the first logs, older logs might have been flushed",
        "new logs are displayed in realtime": "New logs are displayed in realtime",
        follow: "Follow"
    },
    MyServiceButtonBar: {
        back: "Back",
        "external monitoring": "External monitoring",
        "helm values": "Helm Values",
        reduce: "Reduce"
    },
    LauncherMainCard: {
        "friendly name": "Friendly name",
        launch: "Launch",
        "problem with": "Problem with:",
        cancel: "Cancel",
        "copy auto launch url": "Copy auto launch URL",
        "copy auto launch url helper": ({
            chartName
        }) => `Copy the URL that will enable any user of this Onyxia instance to 
            launch a ${chartName} in this configuration on their namespace`,
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
            helmCharName,
            helmRepositoryName,
            labeledHelmChartSourceUrls
        }) => (
            <>
                Version of the{" "}
                {
                    <MaybeLink href={labeledHelmChartSourceUrls.helmChartSourceUrl}>
                        {helmCharName}
                    </MaybeLink>
                }{" "}
                Helm chart that belongs to the{" "}
                {
                    <>
                        <MaybeLink
                            href={labeledHelmChartSourceUrls.helmChartRepositorySourceUrl}
                        >
                            {helmRepositoryName}
                        </MaybeLink>{" "}
                        Helm chart repository.
                    </>
                }
            </>
        ),
        "save changes": "Save changes",
        "copied to clipboard": "Copied to clipboard!",
        "s3 configuration": "S3 configuration",
        "s3 configuration - explain": ({ projectS3ConfigLink }) => (
            <>
                S3 configuration to use for this service.{" "}
                <MuiLink {...projectS3ConfigLink}>S3 Configuration</MuiLink>.
            </>
        )
    },
    Footer: {
        "terms of service": "Terms of service",
        "change language": "Change language",
        "dark mode switch": "Dark mode switch"
    },
    MyServices: {
        text1: "My Services",
        text2: "Access your running services",
        text3: "Services are supposed to be shut down as soon as you stop using them actively.",
        "running services": "Running services"
    },
    ClusterEventsDialog: {
        title: "Events",
        subtitle: (
            <>
                Kubernetes namespace's events, it's a real-time feed of{" "}
                <code>kubectl get events</code>
            </>
        ),
        close: "Close"
    },
    MyServicesConfirmDeleteDialog: {
        "confirm delete title": "Are you sure?",
        "confirm delete subtitle": "Make sure your service are ready to be deleted",
        "confirm delete body shared services":
            "Be mindful that some of your services are shared with the other project member.",
        "confirm delete body":
            "Don't forget to push your code on GitHub or GitLab before terminating your services",
        cancel: "cancel",
        confirm: "Yes, delete"
    },
    MyServicesButtonBar: {
        refresh: "Refresh",
        launch: "New service",
        trash: "Delete all",
        "trash my own": "Delete all my services",
        events: "Events"
    },
    MyServicesCard: {
        service: "Service",
        "running since": "Started: ",
        open: "Open",
        readme: "readme",
        "reminder to delete services": "Remember to delete your services.",
        status: "Status",
        "container starting": "Container starting",
        failed: "Failed",
        "suspend service tooltip": "Suspend the service and release resources",
        "resume service tooltip": "Resume the service",
        suspended: "Suspended",
        suspending: "Suspending",
        "share tooltip - belong to someone else": ({
            projectName,
            ownerUsername,
            focusColor
        }) => (
            <>
                This service is shared among{" "}
                <span style={{ color: focusColor }}>{projectName}</span>'s project members
                by <span style={{ color: focusColor }}>{ownerUsername}</span>.
            </>
        ),
        "share tooltip - belong to you, shared": ({ projectName, focusColor }) => (
            <>
                This service is shared among{" "}
                <span style={{ color: focusColor }}>{projectName}</span>'s project
                members. Click to stop sharing.
            </>
        ),
        "share tooltip - belong to you, not shared": ({ projectName, focusColor }) => (
            <>
                Only you can access this service. Click to share it with{" "}
                <span style={{ color: focusColor }}>{projectName}</span>'s project
                members.
            </>
        )
    },
    MyServicesRestorableConfigOptions: {
        edit: "Edit",
        "copy link": "Copy URL link",
        "remove bookmark": "Delete",
        "move down": "Move down",
        "move to bottom": "Move to bottom",
        "move to top": "Move to top",
        "move up": "Move up"
    },
    MyServicesRestorableConfig: {
        edit: "Edit",
        launch: "Launch"
    },
    MyServicesRestorableConfigs: {
        saved: "Saved",
        expand: "Expand"
    },
    ReadmeDialog: {
        ok: "ok",
        return: "Return"
    },
    CopyOpenButton: {
        "first copy the password": "Click to copy the password...",
        "open the service": "Open the service 🚀"
    },
    MyServicesCards: {
        "running services": "Running services"
    },
    NoRunningService: {
        "launch one": "Click here to launch one",
        "no services running": "You don't have any service running"
    },
    CircularUsage: {
        max: "Max",
        used: "Used",
        "quota card title": ({ what, isLimit }) => {
            const whatTranslated = (() => {
                switch (what) {
                    case "memory":
                        return "RAM";
                    case "cpu":
                        return "CPU";
                    case "storage":
                        return "Storage";
                    case "count/pod":
                        return "Kubernetes pods";
                    case "nvidia.com/gpu":
                        return "Nvidia GPUs";
                    default:
                        return capitalize(what);
                }
            })();

            return `${whatTranslated} - ${isLimit ? "Limit" : "Requested"}`;
        }
    },
    Quotas: {
        "show more": "Show more",
        "resource usage quotas": "Resource usage quotas",
        "current resource usage is reasonable":
            "Your current resource usage is reasonable."
    },
    DataExplorer: {
        "page header title": "Data Explorer",
        "page header help title":
            "Preview your Parquet and CSV files right from your browser!",
        "page header help content": ({ demoParquetFileLink }) => (
            <>
                Simply pass the <code>https://</code> or <code>s3://</code> URL of a data
                file to preview it.
                <br />
                The file isn't fully downloaded; its content is streamed as you navigate
                through the pages.
                <br />
                You can share a permalink to the file or even to a specific row of the
                file by copying the URL from the address bar.
                <br />
                Not sure where to start? Try this{" "}
                <MuiLink {...demoParquetFileLink}>demo file</MuiLink>!
            </>
        ),
        column: "column",
        density: "density",
        "download file": "Download file",
        "resize table": "Resize",
        "unsupported file type": ({ supportedFileTypes }) =>
            `Unsupported data format. Supported types are: ${supportedFileTypes.join(", ")}.`,
        "no s3 client":
            "No S3 client configured. Go to settings to enable one for the explorer.",
        "unsupported protocol":
            "Unsupported URL. Supported protocols are https:// and s3://.",
        "https fetch error": "Unable to fetch the HTTPS file.",
        "query error": "DuckDB query error."
    },
    UrlInput: {
        load: "Load",
        reset: "Reset",
        "data source": "Data source"
    },
    CommandBar: {
        ok: "Ok"
    },
    formattedDate: {
        past1: ({ divisorKey }) => {
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
        pastN: ({ divisorKey }) => {
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
        future1: ({ divisorKey }) => {
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
        futureN: ({ divisorKey }) => {
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
        },
        singular: ({ divisorKey }) => {
            switch (divisorKey) {
                case "second":
                    return "1 second";
                case "minute":
                    return "1 minute";
                case "hour":
                    return "1 hour";
                case "day":
                    return "1 day";
                case "week":
                    return "1 week";
                case "month":
                    return "1 month";
                case "year":
                    return "1 year";
            }
        },
        plural: ({ divisorKey }) => {
            switch (divisorKey) {
                case "second":
                    return "# seconds";
                case "minute":
                    return "# minutes";
                case "hour":
                    return "# hours";
                case "day":
                    return "# days";
                case "week":
                    return "# weeks";
                case "month":
                    return "# months";
                case "year":
                    return "# years";
            }
        }
    },
    CopyToClipboardIconButton: {
        "copied to clipboard": "Copied!",
        "copy to clipboard": "Copy to clipboard"
    },
    CustomDataGrid: {
        "empty directory": "This directory is empty",
        "label rows count": ({ count }) => {
            const plural = count > 1 ? "s" : "";
            return `${count} item${plural} selected`;
        },
        "label rows per page": "Items per page"
    },
    CustomNoRowsOverlay: {
        "no rows": "No rows"
    },
    CustomDataGridToolbarDensitySelector: {
        toolbarDensity: "Density",
        toolbarDensityStandard: "Standard",
        toolbarDensityComfortable: "Comfortable",
        toolbarDensityCompact: "Compact"
    },
    CustomDataGridToolbarColumnsButton: {
        toolbarColumnsLabel: "Columns"
    },
    DatasetCard: {
        publishedOn: "Published on",
        datasetPage: "Dataset page",
        license: "License:",
        format: "Format",
        size: "Size",
        distributions: "Distributions",
        visualize: "Visualize",
        unknown: "Unknown"
    },
    DataCollection: {
        "page header help title":
            "Simply enter the https:// URL of your DCAT JSON-LD schema",
        "page header title": "Data catalog",
        "page header help content": ({ demoCatalogLink }) => (
            <>
                Just enter the <code>https://</code> URL of a data catalog to preview it.
                <br />
                Not sure where to start? Try this{" "}
                <MuiLink {...demoCatalogLink}>demo catalog</MuiLink>!
            </>
        ),
        "https fetch error": "Unable to fetch the HTTPS resource.",
        "invalid json response": "The response is not valid JSON.",
        "json-ld compact error": "Failed to compact the JSON-LD response.",
        "json-ld frame error": "Failed to frame the JSON-LD response.",
        "datasets parsing error": "Unable to parse datasets from the catalog."
    },
    DataTextEditor: {
        "not a valid format": ({ format }) => `Not a valid ${format}`,
        format: "Format",
        "all defaults": "All defaults",
        schema: "Schema"
    },
    JsonSchemaDialog: {
        "json schema": "JSON Schema",
        ok: "Ok"
    },
    S3UriBar: {
        explore: "Explore..",
        "copy s3 path": "Copy S3 path",
        copied: "Copied",
        "copied path": ({ s3Uri }) => `Copied path: ${s3Uri}`,
        "add to bookmarks": "Add to bookmarks",
        "delete from bookmarks": "Delete from bookmarks",
        bookmarked: "Bookmarked",
        "edit s3 uri": "Edit S3 URI",
        prefix: "Prefix",
        "admin bookmark": "Admin bookmark",
        bookmark: "Bookmark",
        object: "Object",
        public: "Public",
        "go to s3 uri": ({ s3Uri, isPublic }) =>
            `${isPublic ? "Public. " : ""}Go to ${s3Uri}`,
        "s3 uri": "S3 URI",
        "edit from s3 root": "Edit from S3 root",
        "edit object key": "Edit object key",
        "object key": "Object key",
        listing: "Listing..."
    }
};
