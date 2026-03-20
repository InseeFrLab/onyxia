import type { Translations } from "../types";
import MuiLink from "@mui/material/Link";
import { Markdown } from "ui/shared/Markdown";
import { Icon } from "onyxia-ui/Icon";
import { getIconUrlByName } from "lazy-icons";
import { capitalize } from "tsafe/capitalize";
import { MaybeLink } from "ui/shared/MaybeLink";

export const translations: Translations<"fr"> = {
    /* spell-checker: disable */
    Account: {
        profile: "Profil",
        git: undefined,
        storage: "Connexion au stockage",
        k8sCodeSnippets: "Connexion à Kubernetes",
        "user-interface": "Modes d'interface",
        text1: "Mon compte",
        text2: "Accédez à vos différentes informations de compte.",
        text3: "Configurez vos identifiants, e-mails, mots de passe et jetons d'accès personnels directement connectés à vos services.",
        "personal tokens tooltip": 'Ou en anglais "token".',
        vault: "Vault"
    },
    AccountProfileTab: {
        "account id": "Identifiant de compte",
        "account id helper":
            "Vos identifiants intangibles liés à l'identité que vous utilisez pour vous connecter à la plateforme",
        "user id": "ID utilisateur",
        email: "Email",
        "account management": "Gestion du compte"
    },
    UserProfileForm: {
        "customizable profile": "Profil personnalisable",
        "customizable profile helper":
            "Informations utiles à la configuration automatique de vos services",
        save: "Enregistrer",
        restore: "Restaurer"
    },
    ConfirmNavigationDialog: {
        "you have unsaved changes": "Vous avez des modifications non enregistrées !",
        cancel: "Annuler",
        "continue without saving": "Continuer sans enregistrer"
    },
    AccountGitTab: {
        gitName: "Nom d'utilisateur pour Git",
        "gitName helper text": ({ gitName, focusClassName }) => (
            <>
                Cette commande configurera votre nom d'utilisateur global Git, exécutée au
                démarrage du service:&nbsp;
                <code className={focusClassName}>
                    git config --global user.name "{gitName || "<votre_nom_utilisateur>"}"
                </code>
            </>
        ),
        gitEmail: "Email pour Git",
        "gitEmail helper text": ({ gitEmail, focusClassName }) => (
            <>
                Cette commande configurera votre email global Git, exécutée au démarrage
                du service:&nbsp;
                <code className={focusClassName}>
                    git config --global user.email "
                    {gitEmail || "<votre_email@domaine.com>"}"
                </code>
            </>
        ),
        githubPersonalAccessToken: "Token d'accès personnel pour Forge Git",
        "githubPersonalAccessToken helper text": ({ focusClassName }) => (
            <>
                En fournissant ce token, vous pourrez cloner et pousser vers vos dépôts
                privés GitHub ou GitLab sans devoir saisir à nouveau vos identifiants de
                forge.
                <br />
                Ce token sera également disponible en tant que variable
                d'environnement:&nbsp;
                <span className={focusClassName}>$GIT_PERSONAL_ACCESS_TOKEN</span>
            </>
        )
    },
    AccountStorageTab: {
        "credentials section title": "Connecter vos données à vos services",
        "credentials section helper":
            "Stockage object MinIO compatible Amazon (AWS S3). Ces informations sont déjà renseignées automatiquement.",
        "accessible as env":
            "Accessible au sein de vos services en tant que la variable d'environnement",
        "init script section title":
            "Pour accéder au stockage en dehors des services du datalab",
        "init script section helper":
            "Téléchargez ou copiez le script d'initialisation dans le langage de programmation de votre choix.",
        "expires in": ({ howMuchTime }) => `Expire ${howMuchTime}`
    },
    AccountKubernetesTab: {
        "credentials section title": "Connection au cluster Kubernetes",
        "credentials section helper":
            "Identifiants pour interagir directement avec le serveur d'API Kubernetes.",
        "init script section title": "Script Shell",
        "init script section helper": ({ installKubectlUrl }) => (
            <>
                Ce script permet d'utiliser kubectl ou helm sur votre machine locale.{" "}
                <br />
                Pour l'utiliser,{" "}
                <MuiLink href={installKubectlUrl} target="_blank">
                    installez simplement kubectl sur votre machine
                </MuiLink>{" "}
                et exécutez le script en le copiant-collant dans votre terminal.
                <br />
                Après avoir fait cela, vous pouvez confirmer que cela fonctionne en
                exécutant la commande&nbsp;
                <code>kubectl get pods</code> ou <code>helm list</code>
            </>
        ),
        "expires in": ({ howMuchTime }) =>
            `Ces identifiants sont valables pour les ${howMuchTime} prochaines`
    },
    AccountVaultTab: {
        "credentials section title": "Identifiants Vault",
        "credentials section helper": ({ vaultDocHref, mySecretLink }) => (
            <>
                <MuiLink href={vaultDocHref} target="_blank">
                    Vault
                </MuiLink>{" "}
                est le système où &nbsp;
                <MuiLink {...mySecretLink}>vos secrets</MuiLink> sont enregistrés.
            </>
        ),
        "init script section title": "Utiliser Vault depuis votre terminal",
        "init script section helper": ({ vaultCliDocLink }) => (
            <>
                Télécharger ou copier les variables d'<code>ENV</code> pour configurer
                votre{" "}
                <MuiLink href={vaultCliDocLink} target="_blank">
                    Vault CLI
                </MuiLink>{" "}
                local.
            </>
        ),
        "expires in": ({ howMuchTime }) => `Le token expire ${howMuchTime}`
    },
    AccountUserInterfaceTab: {
        title: "Configurer le mode d'interface",
        "enable dark mode": "Activer le mode sombre",
        "dark mode helper":
            "Thème de l'interface à faible luminosité avec un fond de couleur sombre.",
        "enable beta": "Activer le mode béta-testeur",
        "beta mode helper":
            "Pour des configurations et fonctionnalités avancées de la plateforme.",
        "enable dev mode": "Activer le mode développeur",
        "dev mode helper": "Activer les fonctionnalités en cours de développement",
        "Enable command bar": "Activer la barre de commande",
        "Enable command bar helper": ({ imgUrl }) => (
            <>
                La{" "}
                <MuiLink href={imgUrl} target="_blank">
                    barre de commande
                </MuiLink>{" "}
                vous donne un aperçu des commandes exécutées en votre nom lorsque vous
                interagissez avec l'interface utilisateur.
            </>
        )
    },
    SettingField: {
        "copy tooltip": "Copier dans le presse-papier",
        language: "Changer la langue",
        "service password": "Mot de passe par défault des services",
        "service password helper text": ({ groupProjectName }) => (
            <>
                Ceci est le mot de passe par défaut utilisé pour protéger vos services en
                cours d'exécution. <br />
                Lorsque vous lancez un service, le champ de mot de passe dans l'onglet
                sécurité est pré-rempli avec ce mot de passe. <br />
                Cliquer sur l'icône{" "}
                <Icon size="extra small" icon={getIconUrlByName("Refresh")} /> générera un
                nouveau mot de passe aléatoire. Cependant, soyez conscient que cela ne
                mettra pas à jour le mot de passe pour les services qui sont déjà en cours
                d'exécution. <br />
                Le mot de passe du service est ce qu'Onyxia vous fait copier dans votre
                presse-papiers avant d'accéder à un service en cours d'exécution. <br />
                {groupProjectName !== undefined && (
                    <>
                        Veuillez noter que ce mot de passe est partagé parmi tous les
                        membres du projet ({groupProjectName}).
                    </>
                )}
            </>
        ),
        "not yet defined": "Non définie",
        "reset helper dialogs": "Réinitialiser les fenêtres d'instructions",
        reset: "Réinitialiser",
        "reset helper dialogs helper text":
            "Réinitialiser les fenêtres de messages que vous avez demandé de ne plus afficher"
    },
    ConfirmBucketCreationAttemptDialog: {
        "bucket does not exist title": ({ bucket }) => `Le bucket ${bucket} n'existe pas`,
        "bucket does not exist body": "Voulez-vous tenter de le créer maintenant ?",
        no: "Non",
        yes: "Oui",
        "success title": "Succès",
        "failed title": "Échec",
        "success body": ({ bucket }) => `Bucket ${bucket} créé avec succès.`,
        "failed body": ({ bucket }) => `Échec de la création de ${bucket}.`,
        ok: "Ok"
    },
    CreateOrRenameBookmarkDialog: {
        "dialog title": "Nom du signet",
        "bookmarkName textField label": "Nom",
        "bookmarkName textField empty error": "Le nom du signet ne peut pas être vide",
        cancel: "Annuler",
        ok: "Ok"
    },
    MySecrets: {
        "page title - my secrets": "My Secrets",
        "what this page is used for - my secrets":
            "Stockez ici des secrets qui seront accessibles sous forme de variables d'environnement dans vos services.",
        "learn more - my files": "Pour en savoir plus sur l'utilisation du stockage S3,",
        "help content": ({ accountTabLink, docHref }) => (
            <>
                Lire{" "}
                <MuiLink href={docHref} target="_blank">
                    notre documentation
                </MuiLink>
                . &nbsp;
                <MuiLink {...accountTabLink}>
                    Configurer votre Vault CLI local
                </MuiLink>.
            </>
        )
    },
    SecretsExplorerItem: {
        description: "description"
    },
    SecretsExplorerButtonBar: {
        secret: "secret",
        rename: "renommer",
        delete: "supprimer",
        "create secret": "Nouveau secret",
        "copy path": "Utiliser dans le service",
        "create new empty directory": "Nouveau dossier",
        refresh: "rafraîchir",
        "create what": ({ what }) => `Nouveau ${what}`,
        new: "Nouveau"
    },
    SecretsExplorer: {
        file: "fichier",
        secret: "secret",
        cancel: "annuler",
        delete: "supprimer",
        "do not display again": "Ne plus afficher",
        "untitled what": ({ what }) => `${what}_sans_nom`,
        directory: "dossier",
        "deletion dialog title": ({ deleteWhat }) => `Supprimer un ${deleteWhat} ?`,
        "deletion dialog body": ({ deleteWhat }) => `
            Vous êtes sur le point de supprimer un ${deleteWhat}. 
            Cette action entraînera la perte potentielle des données liées à ce ${deleteWhat}.
            `,
        "already a directory with this name": "Il y a déjà un dossier avec ce nom",
        "can't be empty": "Ne peut être vide",
        create: "Créer",
        "new directory": "Nouveau dossier"
    },
    SecretsExplorerItems: {
        "empty directory": "Ce répertoire est vide"
    },
    CreateOrUpdateProfileDialog: {
        "dialog title": "Nouvelle configuration S3 personnalisée",
        "dialog subtitle":
            "Spécifiez un compte de service personnalisé ou connectez-vous à un autre service compatible S3",
        cancel: "Annuler",
        "save config": "Enregistrer la configuration",
        "update config": "Mettre à jour la configuration",
        "is required": "Ce champ est requis",
        "must be an url": "URL non valide",
        "profile name already used": "Un autre profil portant le même nom existe déjà",
        "not a valid access key id":
            "Cela ne ressemble pas à un ID de clé d'accès valide",
        "url textField label": "URL",
        "url textField helper text": "URL du service S3",
        "region textField label": "Région AWS S3",
        "region textField helper text":
            "Exemple : eu-west-1, si vous n'êtes pas sûr, laissez vide",
        "account credentials": "Identifiants du compte",
        "profileName textField label": "Nom du profil",
        "profileName textField helper text": "Identifiant unique de ce profil S3",
        "isAnonymous switch label": "Accès anonyme",
        "isAnonymous switch helper text":
            "Mettre sur ON si aucune clé d'accès secrète n'est requise",
        "accessKeyId textField label": "ID de clé d'accès",
        "accessKeyId textField helper text": "Exemple : 1A2B3C4D5E6F7G8H9I0J",
        "secretAccessKey textField label": "Clé d'accès secrète",
        "sessionToken textField label": "Jeton de session",
        "sessionToken textField helper text":
            "Optionnel, laissez vide si vous n'êtes pas sûr",
        "url style": "Style d'URL",
        "url style helper text":
            "Indiquez comment votre serveur S3 formate l'URL pour télécharger des fichiers.",
        "path style label": ({ example }) => (
            <>
                Style chemin
                {example !== undefined && (
                    <>
                        :&nbsp;
                        <code>{example}my-dataset.parquet</code>
                    </>
                )}
            </>
        ),
        "virtual-hosted style label": ({ example }) => (
            <>
                Style virtual-hosted
                {example !== undefined && (
                    <>
                        :&nbsp;
                        <code>{example}my-dataset.parquet</code>
                    </>
                )}
            </>
        )
    },
    MySecretsEditor: {
        "do not display again": "Ne plus afficher",
        "add an entry": "Ajouter une variable",
        "environnement variable default name": "NOUVELLE_VARENV",
        "table of secret": "table de secrets",

        "key column name": "Nom de la variable",
        "value column name": "Valeur",
        "unavailable key": "Déjà utilisé",
        "invalid key empty string": "Un nom est requis",
        "invalid key _ not valid": "Ne peut pas être juste _",
        "invalid key start with digit": "Ne doit pas commencer par un chiffre",
        "invalid key invalid character": "Caractère non valide",
        "use this secret": "Utiliser dans un service",

        "use secret dialog title": "Utiliser dans un service",
        "use secret dialog subtitle": "Le chemin du secret a été copié.",
        "use secret dialog body": `
                Au moment de lancer un service (RStudio, Jupyter), rendez-vous
                dans l'onglet 'VAULT' et collez le chemin du secret dans le champ prévu à cet effet.
                Vos clefs valeurs seront disponibles sous forme de variables d'environnement.
            `,
        "use secret dialog ok": "J'ai compris"
    },
    MySecretsEditorRow: {
        "key input desc": "Nom de la variable d'environnement",
        "value input desc": "Valeur de la variable d'environnement"
    },
    Header: {
        login: "Connexion",
        logout: "Déconnexion",
        project: "Projet",
        region: "Région"
    },
    LeftBar: {
        reduce: "Réduire",
        home: "Accueil",
        account: "Mon compte",
        catalog: "Catalogue de services",
        myServices: "Mes services",
        mySecrets: "Mes secrets",
        "divider: services features": "Fonctionnalités relative aux services",
        "divider: external services features":
            "Fonctionnalités relative aux services externes",
        "divider: onyxia instance specific features":
            "Fonctionnalités spécifiques à cette instance d'Onyxia",
        dataExplorer: "Explorateur de Données",
        dataCollection: "Explorateur de Collections",
        sqlOlapShell: "Coquille SQL OLAP"
    },
    AutoLogoutCountdown: {
        "are you still there": "Êtes-vous toujours là ?",
        "you'll soon be automatically logged out":
            "Vous serez bientôt déconnecté automatiquement."
    },
    Page404: {
        "not found": "Page non trouvée"
    },
    PortraitModeUnsupported: {
        instructions:
            "Pour utiliser cette application depuis votre mobile, veuillez activer le capteur de rotation et tourner votre téléphone."
    },
    MaybeAcknowledgeConfigVolatilityDialog: {
        "dialog title": "Attention, les configurations sont volatiles",
        "dialog body": `Cette instance Onyxia n'implémente aucun mécanisme de persistance pour stocker les configurations. 
            Toutes les configurations sont stockées dans le stockage local du navigateur. Cela signifie que si vous effacez le 
            stockage local de votre navigateur ou changez de navigateur, vous perdrez toutes vos configurations.`,
        "do not show next time": "Ne plus afficher ce message",
        cancel: "Annuler",
        "I understand": "Je comprends"
    },
    Home: {
        "title authenticated": ({ userFirstname }) => `Bienvenue ${userFirstname}!`,
        title: "Bienvenue sur le datalab",
        login: "Connexion",
        "new user": "Nouvel utilisateur du datalab ?",
        subtitle:
            "Travaillez avec Python ou R et disposez de la puissance dont vous avez besoin !",
        cardTitle1: "Un environnement ergonomique et des services à la demande",
        cardTitle2: "Une communauté active et enthousiaste à votre écoute",
        cardTitle3: "Un espace de stockage de données rapide, flexible et en ligne",
        cardText1:
            "Analysez les données, faites du calcul distribué et profitez d'un large catalogue de services. Réservez la puissance de calcul dont vous avez besoin.",
        cardText2:
            "Profitez et partagez des ressources mises à votre disposition : tutoriels, formations et canaux d'échanges.",
        cardText3:
            "Pour accéder facilement à vos données et à celles mises à votre disposition depuis vos programmes - Implémentation API S3",
        cardButton1: "Consulter le catalogue",
        cardButton2: "Rejoindre la communauté",
        cardButton3: "Consulter des données"
    },
    Catalog: {
        header: "Catalogue de services",
        "no result found": ({ forWhat }) => `Aucun résultat trouvé pour ${forWhat}`,
        "search results": "Résultats de la recherche",
        search: "Rechercher",
        "title all catalog": "Tous"
    },
    CatalogChartCard: {
        launch: "Lancer",
        "learn more": "En savoir plus"
    },
    CatalogNoSearchMatches: {
        "no service found": "Service non trouvé",
        "no result found": ({ forWhat }) => `Aucun résultat trouvé pour ${forWhat}`,
        "check spelling": `Vérifiez que le nom du service est correctement 
            orthographié ou essayez d'élargir votre recherche.`,
        "go back": "Retourner aux principaux services"
    },
    Launcher: {
        sources: ({
            helmChartName,
            helmChartRepositoryName,
            labeledHelmChartSourceUrls
        }) => (
            <>
                Le chart Helm{" "}
                {
                    <MaybeLink href={labeledHelmChartSourceUrls.helmChartSourceUrl}>
                        {helmChartName}
                    </MaybeLink>
                }{" "}
                appartient au dépôt de charts Helm{" "}
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
                        Il est basé sur l'image Docker{" "}
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
        "download as script": "Télécharger le script",
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
            >{`Nous avons conçu la barre de commande pour vous permettre de prendre le contrôle de vos déploiements Kubernetes.
Voici ce que vous devez savoir :

#### Quelles sont ces commandes Helm ?

Ces commandes sont les commandes Helm exactes que l'API Onyxia exécutera en votre nom dans votre espace de noms Kubernetes.
Cela vous permet de savoir ce qui se passe en coulisse lorsque vous interagissez avec l'interface utilisateur.

#### Mises à jour en temps réel

Lorsque vous interagissez avec l'interface utilisateur, les commandes Helm se mettront à jour automatiquement pour refléter ce que vous faites.

#### Pourquoi devrais-je m'en soucier ?

- **Transparence :** Nous croyons que vous avez le droit de savoir quelles actions sont effectuées dans votre environnement.
- **Apprentissage :** Comprendre ces commandes peut fournir des informations sur Kubernetes et Helm, approfondissant ainsi vos connaissances.
- **Exécution manuelle :** Vous pouvez copier et coller ces commandes dans un terminal ayant un accès en écriture à Kubernetes, ce qui vous permet de lancer le service manuellement.

#### Comment puis-je exécuter ces commandes manuellement ?

${
    k8CredentialsHref === undefined
        ? ""
        : "Il y a deux façons d'exécuter ces commandes :  "
}

${
    k8CredentialsHref === undefined
        ? ""
        : `
- **Terminal local :** Allez dans [\`Mon compte -> Onglet Kubernetes\`](${k8CredentialsHref}).
  Ici, vous trouverez les informations d'identification qui vous permettent d'exécuter des commandes dans votre espace de noms Kubernetes depuis votre terminal local.
`
}

- Si cette instance d'Onyxia propose des services comme VSCode ou Jupyter, vous pouvez ouvrir un terminal au sein de ces services et y exécuter des commandes.
  Pour des commandes constructives ou destructives, vous devrez lancer votre service avec le rôle Kubernetes \`admin\` ou \`edit\`.

En exécutant la commande manuellement, vous pourrez toujours voir le service dans l'onglet [\`Mes Services\`](${myServicesHref}) comme si celui-ci avait été lancé via l'interface utilisateur.

Vous pouvez désactiver la barre de commande dans l'onglet [\`Mon compte -> Préférences d'interface\`](${interfacePreferenceHref}).

N'hésitez pas à explorer et à prendre en main vos déploiements Kubernetes !
        `}</Markdown>
        ),
        form: "Formulaire",
        editor: "Éditeur de texte"
    },
    AcknowledgeSharingOfConfigConfirmDialog: {
        "acknowledge sharing of config confirm dialog title":
            "Soyez conscient, les configurations sont partagées",
        "acknowledge sharing of config confirm dialog subtitle": ({
            groupProjectName
        }) => `Si vous enregistrez
        cette configuration, chaque membre du projet ${groupProjectName} pourra la lancer.`,
        "acknowledge sharing of config confirm dialog body": `Bien qu'aucune information personnelle n'ait été automatiquement injectée
        par Onyxia, soyez prudent de ne pas partager d'informations sensibles dans la configuration restaurable.`,
        cancel: "Annuler",
        "i understand, proceed": "Je comprends, continuer"
    },
    AutoLaunchDisabledDialog: {
        "auto launch disabled dialog title": "Lancement automatique désactivé",
        "auto launch disabled dialog body": (
            <>
                <b>ATTENTION</b>: Quelqu'un pourrait essayer de vous tromper en lançant un
                service qui pourrait compromettre l'intégrité de votre namespace.
                <br />
                Veuillez examiner attentivement la configuration du service avant de le
                lancer.
                <br />
                En cas de doute, veuillez contacter votre administrateur.
            </>
        ),
        ok: "Ok"
    },
    FormFieldWrapper: {
        "reset to default": "Réinitialiser à la valeur par défaut"
    },
    ConfigurationTopLevelGroup: {
        miscellaneous: "Divers",
        "Configuration that applies to all charts":
            "Configurations qui s'appliquent à tous les charts",
        "Top level configuration values": "Configuration racine"
    },
    YamlCodeBlockFormField: {
        "not an array": "Un tableau est attendu",
        "not an object": "Un objet est attendu",
        "not valid yaml": "YAML/JSON invalide"
    },
    TextFormField: {
        "not matching pattern": ({ pattern }) => `Ne correspond pas au motif ${pattern}`,
        "toggle password visibility": "Basculer la visibilité du mot de passe"
    },
    FormFieldGroupComponent: {
        add: "Ajouter"
    },
    AutoInjectSwitch: {
        tooltip: ({ isAutoInjected }) => (
            <>
                Si activé, cette configuration sera automatiquement injectée dans vos
                services. Vous pouvez tout de même l’ajouter manuellement lors du
                lancement d’un service, même si cette option reste désactivée.
                <br />
                <br />
                État actuel : <strong>{isAutoInjected ? "activé" : "désactivé"}</strong>
            </>
        )
    },
    NumberFormField: {
        "below minimum": ({ minimum }) => `Doit être supérieur ou égal à ${minimum}`,
        "not a number": "Pas un nombre",
        "not an integer": "Pas un entier"
    },
    NoLongerBookmarkedDialog: {
        "no longer bookmarked dialog title": "Changements non enregistrés",
        "no longer bookmarked dialog body":
            "Cliquer une nouvelle fois sur le symbole marque-page pour mettre à jour votre configuration enregistrée.",
        ok: "Ok"
    },
    MyService: {
        "page title": ({ helmReleaseFriendlyName }) =>
            `${helmReleaseFriendlyName} Surveillance`
    },
    PodLogsTab: {
        "not necessarily first logs":
            "Ce ne sont pas nécessairement les premiers journaux, les journaux plus anciens peuvent avoir été effacés",
        "new logs are displayed in realtime":
            "Les nouveaux journaux sont affichés en temps réel"
    },
    MyServiceButtonBar: {
        back: "Retour",
        "external monitoring": "Surveillance externe",
        "helm values": "Valeurs de Helm",
        reduce: "Réduire"
    },
    S3ExplorerMainView: {
        "upload files": "Upload files",
        "new folder": "New folder",
        "get link": "Get link",
        delete: "Delete",
        "create folder": "Create folder",
        "create folder subtitle":
            "Folders are created relative to the prefix currently being listed.",
        "folder name": "Folder name",
        "folder name cannot be empty": "Folder name cannot be empty.",
        cancel: "Cancel",
        "delete selection": "Delete selection",
        "delete selection subtitle": ({ count }) =>
            `This will permanently delete ${count} selected item${count > 1 ? "s" : ""}.`,
        "deleted folders remove everything inside them":
            "Deleted folders remove everything inside them.",
        "shareable link": "Shareable link",
        "shareable link loading": "Generating a direct download URL...",
        "shareable link ready description":
            "Anyone with this URL can download the file until it expires.",
        close: "Close",
        retry: "Retry",
        open: "Open",
        "copy link": "Copy link",
        "access denied": "Access denied",
        "bucket not found": "Bucket not found",
        "access denied description":
            "You do not have permission to list this S3 location.",
        "bucket not found description":
            "The requested bucket does not exist or is not reachable with the current profile.",
        "select item": ({ itemName }) => `Select ${itemName}`,
        deleting: "Deleting...",
        uploading: ({ percent }) => `Uploading ${percent}%`,
        uploaded: "Uploaded",
        folder: "Folder",
        "open folder": "Open folder",
        "open file": "Open file",
        "get shareable link": "Get shareable link",
        "selected items": ({ count }) => `${count} selected`,
        items: ({ count }) => `${count} item${count > 1 ? "s" : ""}`,
        "refreshing listing": "Refreshing listing...",
        "drag files anywhere in this panel to upload":
            "Drag files anywhere in this panel to upload.",
        "clear selection": "Clear selection",
        "drop files to upload": "Drop files to upload",
        "files will be uploaded into the currently listed prefix":
            "Files will be uploaded into the currently listed prefix.",
        "this prefix is empty": "This prefix is empty",
        "upload files or create a folder to start populating this location":
            "Upload files or create a folder to start populating this location.",
        "select all items": "Select all items",
        name: "Name",
        size: "Size",
        "last modified": "Last modified",
        actions: "Actions",
        "shareable link generation failed":
            "Unable to generate a shareable link for this file."
    },
    LauncherMainCard: {
        "friendly name": "Nom personnalisé",
        launch: "Lancer",
        "problem with": "Problème avec :",
        cancel: "Annuler",
        "copy auto launch url": "Copier l'URL de lancement automatique",
        "copy auto launch url helper": ({
            chartName
        }) => `Copier l'URL qui permettra à tout utilisateur de cette instance Onyxia de 
            lancer un ${chartName} dans cette configuration dans leur namespace`,
        "share the service": "Partager le service",
        "share the service - explain":
            "Rendre accessible le service aux collaborateurs du groupe",
        "restore all default": "Réinitialiser les configurations",
        "bookmark button": ({ isBookmarked }) =>
            `${isBookmarked ? "Supprimer" : "Enregistrer"} la configuration`,
        "bookmark button tooltip": ({ myServicesSavedConfigsExtendedLink }) => (
            <>
                Les configurations enregistrées peuvent être relancer rapidement depuis la
                page&nbsp;
                <MuiLink {...myServicesSavedConfigsExtendedLink} target="_blank">
                    Mes Services
                </MuiLink>
            </>
        ),
        "version select label": "Version",
        "version select helper text": ({
            helmCharName,
            helmRepositoryName,
            labeledHelmChartSourceUrls
        }) => (
            <>
                Version du helm chart{" "}
                {
                    <MaybeLink href={labeledHelmChartSourceUrls.helmChartSourceUrl}>
                        {helmCharName}
                    </MaybeLink>
                }{" "}
                qui appartient au dépôt de helm charts{" "}
                {
                    <>
                        <MaybeLink
                            href={labeledHelmChartSourceUrls.helmChartRepositorySourceUrl}
                        >
                            {helmRepositoryName}
                        </MaybeLink>
                        .
                    </>
                }
            </>
        ),
        "save changes": "Enregistrer les modifications",
        "copied to clipboard": "Copié dans le presse-papiers !",
        "s3 configuration": "Configuration S3",
        "s3 configuration - explain": ({ projectS3ConfigLink }) => (
            <>
                Configuration S3 à utiliser pour ce service.{" "}
                <MuiLink {...projectS3ConfigLink}>Configuration S3</MuiLink>.
            </>
        )
    },
    Footer: {
        "terms of service": "Conditions d'utilisation",
        "change language": "Changer la langue",
        "dark mode switch": "Interrupteur pour le mode sombre"
    },
    MyServices: {
        text1: "Mes services",
        text2: "Lancer, visualiser et gérer rapidement vos différents services en cours d'exécution.",
        text3: "Il est recommandé de supprimer vos services après chaque session de travail.",
        "running services": "Services en cours"
    },
    ClusterEventsDialog: {
        title: "Événements",
        subtitle: (
            <>
                Les événements du namespace Kubernetes, il s'agit d'un flux en temps réel
                de <code>kubectl get events</code>
            </>
        )
    },
    MyServicesConfirmDeleteDialog: {
        "confirm delete title": "Êtes-vous sûr?",
        "confirm delete subtitle":
            "Assurez-vous que vos services ne contiennent pas de travail non sauvegardé.",
        "confirm delete body":
            "N'oubliez pas de pusher votre code sur GitHub ou GitLab avant de continuer.",
        "confirm delete body shared services":
            "Attention, certains de vos services sont partagés aux autres membres du projet.",
        cancel: "Annuler",
        confirm: "Oui, supprimer"
    },
    MyServicesButtonBar: {
        refresh: "Rafraîchir",
        launch: "Nouveau service",
        trash: "Supprimer tous",
        "trash my own": "Supprimer tous mes services"
    },
    MyServicesCard: {
        service: "Service",
        "running since": "Démarré : ",
        open: "ouvrir",
        readme: "readme",
        "reminder to delete services":
            "Rappelez-vous de supprimer vos services après utilisation.",
        status: "Statut",
        "container starting": "Démarrage du conteneur",
        failed: "Échoué",
        "suspend service tooltip": "Suspendre le service et libérer les ressources",
        "resume service tooltip": "Reprendre le service",
        suspended: "Suspendu",
        suspending: "En suspension",
        "share tooltip - belong to someone else": ({
            projectName,
            ownerUsername,
            focusColor
        }) => (
            <>
                Ce service est partagé parmi les membres du projet{" "}
                <span style={{ color: focusColor }}>{projectName}</span>
                par <span style={{ color: focusColor }}>{ownerUsername}</span>.
            </>
        ),
        "share tooltip - belong to you, shared": ({ projectName, focusColor }) => (
            <>
                Ce service est partagé parmi les membres du projet{" "}
                <span style={{ color: focusColor }}>{projectName}</span>. Cliquez pour
                arrêter le partage.
            </>
        ),
        "share tooltip - belong to you, not shared": ({ projectName, focusColor }) => (
            <>
                Vous seul pouvez accéder à ce service. Cliquez pour le partager avec les
                membres du projet <span style={{ color: focusColor }}>{projectName}</span>
                .
            </>
        )
    },
    MyServicesRestorableConfigOptions: {
        edit: "Modifier",
        "copy link": "Copier l'URL",
        "remove bookmark": "Supprimer",
        "move down": "Déplacer vers le bas",
        "move up": "Déplacer vers le haut",
        "move to top": "Déplacer tout en haut",
        "move to bottom": "Déplacer tout en bas"
    },
    MyServicesRestorableConfig: {
        edit: "Modifier",
        launch: "Lancer"
    },
    MyServicesRestorableConfigs: {
        saved: "Enregistrés",
        expand: "Développer"
    },
    ReadmeDialog: {
        ok: "ok",
        return: "Retour"
    },
    CopyOpenButton: {
        "first copy the password": "Cliquez pour copier le mot de passe...",
        "open the service": "Ouvrir le service 🚀"
    },
    MyServicesCards: {
        "running services": "Services en cours"
    },
    NoRunningService: {
        "launch one": "Clickez ici pour en lancer un",
        "no services running":
            "Vous n'avez actuellement aucun service en cours d'exécution"
    },
    CircularUsage: {
        max: "Max",
        used: "Utilisé",
        "quota card title": ({ what, isLimit }) => {
            const whatTranslated = (() => {
                switch (what) {
                    case "memory":
                        return "RAM";
                    case "cpu":
                        return "CPU";
                    case "storage":
                        return "Stockage";
                    case "count/pod":
                        return "Pods Kubernetes";
                    case "nvidia.com/gpu":
                        return "GPUs Nvidia";
                    default:
                        return capitalize(what);
                }
            })();

            return `${whatTranslated} - ${isLimit ? "Limite" : "Demandé"}`;
        }
    },
    Quotas: {
        "show more": "Afficher plus",
        "resource usage quotas": "Quotas d'utilisation des ressources",
        "current resource usage is reasonable":
            "Votre utilisation actuelle des ressources est raisonnable."
    },
    DataExplorer: {
        "page header title": "Explorateur de Données",
        "page header help title":
            "Prévisualisez vos fichiers Parquet et CSV directement depuis votre navigateur !",
        "page header help content": ({ demoParquetFileLink }) => (
            <>
                Entrez simplement l'URL <code>https://</code> ou <code>s3://</code> d'un
                fichier de données pour le prévisualiser.
                <br />
                Le fichier n'est pas entièrement téléchargé ; son contenu est diffusé au
                fur et à mesure que vous naviguez à travers les pages.
                <br />
                Vous pouvez partager un permalien vers le fichier ou même vers une ligne
                spécifique du fichier en copiant l'URL de la barre d'adresse.
                <br />
                Vous ne savez pas par où commencer ? Essayez ce{" "}
                <MuiLink {...demoParquetFileLink}>
                    fichier de démonstration
                </MuiLink> !
            </>
        ),
        column: "colonne",
        density: "densité",
        "download file": "télécharger le fichier",
        "resize table": "Redimensionner",
        "unsupported file type": ({ supportedFileTypes }) =>
            `Format de données non pris en charge. Les types pris en charge sont : ${supportedFileTypes.join(", ")}.`,
        "no s3 client":
            "Aucun client S3 configuré. Allez dans les paramètres pour en activer un pour l’explorateur.",
        "unsupported protocol":
            "URL non prise en charge. Les protocoles supportés sont https:// et s3://.",
        "https fetch error": "Impossible de récupérer le fichier HTTPS.",
        "query error": "Erreur de requête DuckDB."
    },
    UrlInput: {
        load: "Charger",
        reset: "Vider"
    },
    CommandBar: {
        ok: "ok"
    },
    formattedDate: {
        past1: ({ divisorKey }) => {
            switch (divisorKey) {
                case "now":
                    return "à l'instant";
                case "second":
                    return "il y a une seconde";
                case "minute":
                    return "il y a une minute";
                case "hour":
                    return "il y a une heure";
                case "day":
                    return "hier";
                case "week":
                    return "la semaine dernière";
                case "month":
                    return "le mois dernier";
                case "year":
                    return "l'année dernière";
            }
        },
        pastN: ({ divisorKey }) => {
            switch (divisorKey) {
                case "now":
                    return "à l'instant";
                case "second":
                    return "il y a # secondes";
                case "minute":
                    return "il y a # minutes";
                case "hour":
                    return "il y a # heures";
                case "day":
                    return "il y a # jours";
                case "week":
                    return "il y a # semaines";
                case "month":
                    return "il y a # mois";
                case "year":
                    return "il y a # ans";
            }
        },
        future1: ({ divisorKey }) => {
            switch (divisorKey) {
                case "now":
                    return "à l'instant";
                case "second":
                    return "dans une seconde";
                case "minute":
                    return "dans une minute";
                case "hour":
                    return "dans une heure";
                case "day":
                    return "demain";
                case "week":
                    return "la semaine prochaine";
                case "month":
                    return "le mois prochain";
                case "year":
                    return "l'année prochaine";
            }
        },
        futureN: ({ divisorKey }) => {
            switch (divisorKey) {
                case "now":
                    return "à l'instant";
                case "second":
                    return "dans # secondes";
                case "minute":
                    return "dans # minutes";
                case "hour":
                    return "dans # heures";
                case "day":
                    return "dans # jours";
                case "week":
                    return "dans # semaines";
                case "month":
                    return "dans # mois";
                case "year":
                    return "dans # ans";
            }
        },
        singular: ({ divisorKey }) => {
            switch (divisorKey) {
                case "second":
                    return "1 seconde";
                case "minute":
                    return "1 minute";
                case "hour":
                    return "1 heure";
                case "day":
                    return "1 jour";
                case "week":
                    return "1 semaine";
                case "month":
                    return "1 mois";
                case "year":
                    return "1 an";
            }
        },
        plural: ({ divisorKey }) => {
            switch (divisorKey) {
                case "second":
                    return "# secondes";
                case "minute":
                    return "# minutes";
                case "hour":
                    return "# heures";
                case "day":
                    return "# jours";
                case "week":
                    return "# semaines";
                case "month":
                    return "# mois";
                case "year":
                    return "# ans";
            }
        }
    },
    CopyToClipboardIconButton: {
        "copied to clipboard": "Copié !",
        "copy to clipboard": "Copier dans le presse-papiers"
    },
    CustomDataGridToolbarDensitySelector: {
        toolbarDensity: "Densité",
        toolbarDensityStandard: "Standard",
        toolbarDensityComfortable: "Confortable",
        toolbarDensityCompact: "Compact"
    },
    CustomDataGridToolbarColumnsButton: {
        toolbarColumnsLabel: "Colonnes"
    },
    CustomDataGrid: {
        "empty directory": "Ce répertoire est vide",
        "label rows count": ({ count }) => {
            const plural = count > 1 ? "s" : "";
            return `${count} élément${plural} sélectionnée${plural}`;
        },
        "label rows per page": "Éléments par page"
    },
    DatasetCard: {
        publishedOn: "Publié le",
        datasetPage: "Page du jeu de données",
        license: "Licence :",
        format: "Format",
        size: "Taille",
        distributions: "Distributions",
        visualize: "Visualiser",
        unknown: "Inconnu"
    },
    DataCollection: {
        "page header help title":
            "Entrez simplement l'URL https:// de votre schema jsonld dcat",
        "page header title": "Catalogue de données",
        "page header help content": ({ demoCatalogLink }) => (
            <>
                Entrez simplement l'URL <code>https://</code> d'un catalogue de données
                pour le prévisualiser.
                <br />
                Vous ne savez pas par où commencer ? Essayez ce{" "}
                <MuiLink {...demoCatalogLink}>catalogue de démonstration</MuiLink> !
            </>
        ),
        "https fetch error": "Impossible de récupérer la ressource HTTPS.",
        "invalid json response": "La réponse n'est pas un JSON valide.",
        "json-ld compact error": "Impossible de compacter la réponse JSON-LD.",
        "json-ld frame error": "Impossible de structurer la réponse JSON-LD.",
        "datasets parsing error":
            "Impossible d'analyser les jeux de données du catalogue."
    }
    /* spell-checker: enable */
};
