import type { Translations } from "../types";
import MuiLink from "@mui/material/Link";
import { Markdown } from "onyxia-ui/Markdown";
import { elementsToSentence } from "ui/tools/elementsToSentence";

export const translations: Translations<"fr"> = {
    /* spell-checker: disable */
    "Account": {
        "infos": "Information du compte",
        "third-party-integration": "Services externes",
        "storage": "Connexion au stockage",
        "k8sCredentials": "Connexion a Kubernetes",
        "user-interface": "Modes d'interface",
        "text1": "Mon compte",
        "text2": "Accédez à vos différentes informations de compte.",
        "text3":
            "Configurez vos identifiants, e-mails, mots de passe et jetons d'accès personnels directement connectés à vos services.",
        "personal tokens tooltip": 'Ou en anglais "token".',
        "vault": "Vault"
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
        "ip address": "Adresse IP"
    },
    "AccountIntegrationsTab": {
        "git section title": "Configurations Git",
        "git section helper": `Pour vous assurer que vous apparaissez depuis vos
            services comme l'auteur des contributions Git`,
        "gitName": "Nom d'utilisateur pour Git",
        "gitEmail": "Email pour Git",
        "third party tokens section title":
            "Connecter vos comptes Gitlab, Github et Kaggle",
        "third party tokens section helper": `Connectez vos services à des comptes extérieurs à l'aide
            de jetons d'accès personnel et de variables d'environnement.`,
        "personal token": ({ serviceName }) => `Jeton d'accès personnel ${serviceName}`,
        "link for token creation": ({ serviceName }) =>
            `Créer votre jeton ${serviceName}.`,
        "accessible as env":
            "Accessible au sein de vos services en tant que la variable d'environnement"
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
        "expires in": ({ howMuchTime }) => `Expire dans ${howMuchTime}`
    },
    "AccountKubernetesTab": {
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
    "AccountVaultTab": {
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
        "expires in": ({ howMuchTime }) => `Le token expire in ${howMuchTime}`
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
    "AccountField": {
        "copy tooltip": "Copier dans le presse-papier",
        "language": "Changer la langue",
        "service password": "Mot de passe pour vos services",
        "service password helper text": `Ce mot de passe est nécessaire pour vous connecter à tous vos services. 
            Il est généré automatiquement et se renouvelle régulièrement.`,
        "not yet defined": "Non définie",
        "reset helper dialogs": "Réinitialiser les fenêtres d'instructions",
        "reset": "Réinitialiser",
        "reset helper dialogs helper text":
            "Réinitialiser les fenêtres de messages que vous avez demandé de ne plus afficher"
    },
    "MyFiles": {
        "page title - my files": "Mes fichiers",
        "page title - my secrets": "My Secrets",
        "what this page is used for - my files": "Stocker ici vos fichiers de données.",
        "what this page is used for - my secrets":
            "Stockez ici des secrets qui seront accessibles sous forme de variables d'environnement dans vos services.",
        "help content": ({ accountTabLink, docHref }) => (
            <>
                Lire{" "}
                <MuiLink href={docHref} target="_blank">
                    notre documentation
                </MuiLink>
                . &nbsp;
                <MuiLink {...accountTabLink}>Configurer les clients MinIO</MuiLink>.
            </>
        )
    },
    "MySecrets": {
        "page title - my files": "Mes fichiers",
        "page title - my secrets": "My Secrets",
        "what this page is used for - my files": "Stockez ici vos fichiers de données.",
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
                <MuiLink {...accountTabLink}>Configurer votre Vault CLI local</MuiLink>.
            </>
        )
    },
    "ExplorerItem": {
        "description": "description"
    },
    "SecretsExplorerItem": {
        "description": "description"
    },
    "ExplorerButtonBar": {
        "file": "fichier",
        "secret": "secret",
        "delete": "supprimer",
        "create secret": "Nouveau secret",
        "upload file": "Téléverser un fichier",
        "copy path": "Copier le nom de l'objet S3",
        "create directory": "Nouveau dossier",
        "refresh": "rafraîchir",
        "create what": ({ what }) => `Nouveau ${what}`,
        "new": "Nouveau"
    },
    "SecretsExplorerButtonBar": {
        "file": "fichier",
        "secret": "secret",
        "rename": "renommer",
        "delete": "supprimer",

        "create secret": "Nouveau secret",
        "upload file": "Téléverser un fichier",
        "copy path": "Utiliser dans le service",
        "create directory": "Nouveau dossier",
        "refresh": "rafraîchir",
        "create what": ({ what }) => `Nouveau ${what}`,
        "new": "Nouveau"
    },
    "Explorer": {
        "file": "fichier",
        "secret": "secret",
        "create": "créer",
        "cancel": "annuler",
        "delete": "supprimer",
        "do not display again": "Ne plus afficher",

        "untitled what": ({ what }) => `${what}_sans_nom`,
        "directory": "dossier",
        "deletion dialog title": ({ deleteWhat }) => `Supprimer un ${deleteWhat} ?`,
        "deletion dialog body": ({ deleteWhat }) => `
            Vous êtes sur le point de supprimer un ${deleteWhat}. 
            Cette action entraînera la perte potentielle des données liées à ce ${deleteWhat}.
            `,
        "already a directory with this name": "Il y a déjà un dossier avec ce nom",
        "can't be empty": "Ne peut être vide",
        "new directory": "Nouveau dossier"
    },
    "SecretsExplorer": {
        "file": "fichier",
        "secret": "secret",
        "cancel": "annuler",
        "delete": "supprimer",
        "do not display again": "Ne plus afficher",
        "untitled what": ({ what }) => `${what}_sans_nom`,
        "directory": "dossier",
        "deletion dialog title": ({ deleteWhat }) => `Supprimer un ${deleteWhat} ?`,
        "deletion dialog body": ({ deleteWhat }) => `
            Vous êtes sur le point de supprimer un ${deleteWhat}. 
            Cette action entraînera la perte potentielle des données liées à ce ${deleteWhat}.
            `,
        "already a directory with this name": "Il y a déjà un dossier avec ce nom",
        "can't be empty": "Ne peut être vide",
        "create": "Créer",
        "new directory": "Nouveau dossier"
    },
    "ExplorerItems": {
        "empty directory": "Ce répertoire est vide"
    },
    "SecretsExplorerItems": {
        "empty directory": "Ce répertoire est vide"
    },
    "MySecretsEditor": {
        "do not display again": "Ne plus afficher",
        "add an entry": "Ajouter une variable",
        "environnement variable default name": "NOUVELLE_VARENV",
        "table of secret": "table de secrets",

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
        "use secret dialog ok": "J'ai compris"
    },
    "MySecretsEditorRow": {
        "key input desc": "Nom de la variable d'environnement",
        "value input desc": "Valeur de la variable d'environnement"
    },
    "ExplorerUploadModalDropArea": {
        "browse files": "Parcourir vos fichiers",
        "drag and drop or": "Glisser et déposer ou"
    },
    "ExplorerUploadProgress": {
        "over": "sur",
        "importing": "importation"
    },
    "ExplorerUploadModal": {
        "import files": "Importer des fichiers",
        "cancel": "Annuler",
        "minimize": "Minimiser"
    },
    "Header": {
        "login": "Connexion",
        "logout": "Déconnexion",
        "project": "Projet",
        "region": "Région"
    },
    "App": {
        "reduce": "Réduire",
        "home": "Accueil",
        "account": "Mon compte",
        "catalog": "Catalogue de services",
        "myServices": "Mes services",
        "mySecrets": "Mes secrets",
        "myFiles": "Mes fichiers",
        "divider: services features": "Fonctionnalités relative aux services",
        "divider: external services features":
            "Fonctionnalités relative aux services externes",
        "divider: onyxia instance specific features":
            "Fonctionnalités spécifiques à cette instance d'Onyxia"
    },
    "Page404": {
        "not found": "Page non trouvée"
    },
    "PortraitModeUnsupported": {
        "instructions":
            "Pour utiliser cette application depuis votre mobile, veuillez activer le capteur de rotation et tourner votre téléphone."
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
        "cardTitle3": "Un espace de stockage de données rapide, flexible et en ligne",
        "cardText1":
            "Analysez les données, faites du calcul distribué et profitez d'un large catalogue de services. Réservez la puissance de calcul dont vous avez besoin.",
        "cardText2":
            "Profitez et partagez des ressources mises à votre disposition : tutoriels, formations et canaux d'échanges.",
        "cardText3":
            "Pour accéder facilement à vos données et à celles mises à votre disposition depuis vos programmes - Implémentation API S3",
        "cardButton1": "Consulter le catalogue",
        "cardButton2": "Rejoindre la communauté",
        "cardButton3": "Consulter des données"
    },
    "Catalog": {
        "header text1": "Catalogue de services",
        "header text2":
            "Explorez, lancez et configurez des services en quelques clics seulement.",
        "header help": ({ catalogName, catalogDescription, repositoryUrl }) => (
            <>
                Vous explorez le dépôt de Helm Chart{" "}
                <MuiLink href={repositoryUrl} target="_blank">
                    {catalogName}: {catalogDescription}
                </MuiLink>{" "}
            </>
        ),
        "here": "ici",
        "show more": "Afficher tous",
        "no service found": "Service non trouvé",
        "no result found": ({ forWhat }) => `Aucun résultat trouvé pour ${forWhat}`,
        "check spelling": `Vérifiez que le nom du service est correctement 
            orthographié ou essayez d'élargir votre recherche.`,
        "go back": "Retourner aux principaux services",
        "search results": "Résultats de la recherche",
        "search": "Rechercher"
    },
    "CatalogChartCard": {
        "launch": "Lancer",
        "learn more": "En savoir plus"
    },
    "CatalogNoSearchMatches": {
        "no service found": "Service non trouvé",
        "no result found": ({ forWhat }) => `Aucun résultat trouvé pour ${forWhat}`,
        "check spelling": `Vérifiez que le nom du service est correctement 
            orthographié ou essayez d'élargir votre recherche.`,
        "go back": "Retourner aux principaux services"
    },
    "Launcher": {
        "header text1": "Catalogue de services",
        "header text2":
            "Explorez, lancez et configurez des services en quelques clics seulement.",
        "chart sources": ({ chartName, urls }) =>
            urls.length === 0 ? (
                <></>
            ) : (
                <>
                    Accéder aux source{urls.length === 1 ? "" : "s"} du chart {chartName}
                    :&nbsp;
                    {elementsToSentence({
                        "elements": urls.map(source => (
                            <MuiLink href={source} target="_blank" underline="hover">
                                ici
                            </MuiLink>
                        )),
                        "language": "fr"
                    })}
                </>
            ),
        "download as script": "Télécharger le script",
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
        )
    },
    "AcknowledgeSharingOfConfigConfirmDialog": {
        "acknowledge sharing of config confirm dialog title":
            "Soyez conscient, les configurations sont partagées",
        "acknowledge sharing of config confirm dialog subtitle": ({
            groupProjectName
        }) => `Si vous enregistrez
        cette configuration, chaque membre du projet ${groupProjectName} pourra la lancer.`,
        "acknowledge sharing of config confirm dialog body": `Bien qu'aucune information personnelle n'ait été automatiquement injectée
        par Onyxia, soyez prudent de ne pas partager d'informations sensibles dans la configuration restaurable.`,
        "cancel": "Annuler",
        "i understand, proceed": "Je comprends, continuer"
    },
    "AutoLaunchDisabledDialog": {
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
        "ok": "Ok"
    },
    "NoLongerBookmarkedDialog": {
        "no longer bookmarked dialog title": "Changements non enregistrés",
        "no longer bookmarked dialog body":
            "Cliquer une nouvelle fois sur le symbole marque-page pour mettre à jour votre configuration enregistrée.",
        "ok": "Ok"
    },
    "SensitiveConfigurationDialog": {
        "sensitive configuration dialog title":
            "Lancer ce service pourrait être dangereux",
        "proceed to launch": "Lancer en conscience",
        "cancel": "Annuler"
    },
    "LauncherMainCard": {
        "card title": "Créer votre propre service",
        "friendly name": "Nom personnalisé",
        "launch": "Lancer",
        "cancel": "Annuler",
        "copy url helper text":
            "Copier l'URL permettant de restaurer cette configuration",
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
            chartName,
            catalogRepositoryUrl,
            catalogName
        }) => (
            <>
                Version du Chart {chartName} dans le&nbsp;
                <MuiLink href={catalogRepositoryUrl}>dépôt Helm {catalogName}</MuiLink>
            </>
        ),
        "save changes": "Enregistrer les modifications"
    },
    "LauncherConfigurationCard": {
        "global config": "Configurations globales",
        "configuration": ({ packageName }) => `Configuration ${packageName}`,
        "dependency": ({ dependencyName }) => `Dépendance ${dependencyName}`,
        "launch of a service": ({ dependencyName }) =>
            `Lancement d'un service ${dependencyName}`,
        "mismatching pattern": ({ pattern }) => `Doit respecter ${pattern}`,
        "Invalid YAML Object": "Objet YAML non valide",
        "Invalid YAML Array": "Tableau YAML non valide"
    },
    "Footer": {
        "contribute": "Contribuer au projet",
        "terms of service": "Conditions d'utilisation",
        "change language": "Changer la langue",
        "dark mode switch": "Interrupteur pour le mode sombre"
    },
    "MyServices": {
        "text1": "Mes services",
        "text2":
            "Lancer, visualiser et gérer rapidement vos différents services en cours d'exécution.",
        "text3":
            "Il est recommandé de supprimer vos services après chaque session de travail.",
        "running services": "Services en cours"
    },
    "MyServicesConfirmDeleteDialog": {
        "confirm delete title": "Êtes-vous sûr?",
        "confirm delete subtitle":
            "Assurez-vous que vos services ne contiennent pas de travail non sauvegardé.",
        "confirm delete body":
            "N'oubliez pas de pusher votre code sur GitHub ou GitLab avant de continuer.",
        "confirm delete body shared services":
            "Attention, certains de vos services sont partagés aux autres membres du projet.",
        "cancel": "Annuler",
        "confirm": "Oui, supprimer"
    },
    "MyServicesButtonBar": {
        "refresh": "Rafraîchir",
        "launch": "Nouveau service",
        "trash": "Supprimer tous",
        "trash my own": "Supprimer tous mes services"
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
        "this is a shared service": "Ce service est partagé au sein du projet"
    },
    "MyServicesRunningTime": {
        "launching": "En cours..."
    },
    "MyServicesRestorableConfigOptions": {
        "edit": "Modifier",
        "copy link": "Copier l'URL",
        "remove bookmark": "Supprimer"
    },
    "MyServicesRestorableConfig": {
        "edit": "Modifier",
        "launch": "Lancer"
    },
    "MyServicesRestorableConfigs": {
        "saved": "Enregistrés",
        "show all": "Afficher tous"
    },
    "ReadmeAndEnvDialog": {
        "ok": "ok",
        "return": "Retour"
    },
    "CopyOpenButton": {
        "first copy the password": "Cliquez pour copier le mot de passe...",
        "open the service": "Ouvrir le service 🚀"
    },
    "MyServicesCards": {
        "running services": "Services en cours"
    },
    "NoRunningService": {
        "launch one": "Clickez ici pour en lancer un",
        "no services running":
            "Vous n'avez actuellement aucun service en cours d'exécution"
    },
    "CommandBar": {
        "ok": "ok"
    },
    "moment": {
        "date format": ({ isSameYear }) =>
            `dddd Do MMMM${isSameYear ? "" : " YYYY"} à H[h]mm`,
        "past1": ({ divisorKey }) => {
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
        "pastN": ({ divisorKey }) => {
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
        "future1": ({ divisorKey }) => {
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
        "futureN": ({ divisorKey }) => {
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
        }
    }
    /* spell-checker: enable */
};
