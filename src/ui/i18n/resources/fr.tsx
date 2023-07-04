import type { Translations } from "../types";
import MuiLink from "@mui/material/Link";

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
        "credentials section title": "Connexion a Kubernetes",
        "credentials section helper":
            "Identifiants pour interagir directement avec le cluster Kubernetes.",
        "init script section title":
            "Pour vous connecter au cluster Kubernetes via votre kubectl local",
        "init script section helper": `Téléchargez ou copiez le script.`,
        "expires in": ({ howMuchTime }) => `Le token expire dans ${howMuchTime}`
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
        "dev mode helper": "Activer les fonctionnalités en cours de développement"
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
        "trainings": "Formations",
        "documentation": "Documentation",
        "project": "Projet"
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
        "portrait mode not supported": "Le mode portrait n'est pas encore supporté",
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
            "Analysez les données, faites du calcul distribué et profitez d’un large catalogue de services. Réservez la puissance de calcul dont vous avez besoin.",
        "cardText2":
            "Profitez et partagez des ressources mises à votre disposition : tutoriels, formations et canaux d’échanges.",
        "cardText3":
            "Pour accéder facilement à vos données et à celles mises à votre disposition depuis vos programmes - Implémentation API S3",
        "cardButton1": "Consulter le catalogue",
        "cardButton2": "Rejoindre la communauté",
        "cardButton3": "Consulter des données"
    },
    "CatalogExplorerCard": {
        "launch": "Lancer",
        "learn more": "En savoir plus"
    },
    "CatalogExplorerCards": {
        "show more": "Afficher tous",
        "no service found": "Service non trouvé",
        "no result found": ({ forWhat }) => `Aucun résultat trouvé pour ${forWhat}`,
        "check spelling": `Vérifiez que le nom du service est correctement 
            orthographié ou essayez d'élargir votre recherche.`,
        "go back": "Retourner aux principaux services",
        "main services": "Principaux services",
        "all services": "Tous les services",
        "search results": "Résultats de la recherche",
        "search": "Rechercher"
    },
    "Catalog": {
        "header text1": "Catalogue de services",
        "header text2":
            "Explorez, lancez et configurez des services en quelques clics seulement.",
        "contribute to the catalog": ({ catalogName }) => (
            <>Contribuer au catalogue {catalogName}</>
        ),
        "contribute to the package": ({ packageName }) =>
            `Accéder aux sources du package ${packageName} `,
        "here": "ici"
    },
    "CatalogLauncher": {
        "no longer bookmarked dialog title": "Changements non enregistrés",
        "no longer bookmarked dialog body":
            "Cliquer une nouvelle fois sur le symbole marque-page pour mettre à jour votre configuration enregistrée.",
        "ok": "Ok",
        "should overwrite configuration dialog title": "Souhaitez-vous le remplacer ?",
        "should overwrite configuration dialog subtitle": ({ friendlyName }) =>
            `«${friendlyName}» existe déjà dans vos enregistrements.`,
        "should overwrite configuration dialog body":
            "Un service enregistré du même nom existe déjà. Si vous le remplacez, le contenu d'origine sera perdu.",
        "cancel": "Annuler",
        "replace": "Remplacer",
        "sensitive configuration dialog title":
            "Lancer ce service pourrait être dangereux",
        "proceed to launch": "Lancer en conscience"
    },
    "Footer": {
        "contribute": "Contribuer au projet",
        "terms of service": "Conditions d'utilisation",
        "change language": "Changer la langue",
        "dark mode switch": "Interrupteur pour le mode sombre"
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
        "restore all default": "Réinitialiser les configurations"
    },
    "CatalogLauncherConfigurationCard": {
        "global config": "Configurations globales",
        "configuration": ({ packageName }) => `Configuration ${packageName}`,
        "dependency": ({ dependencyName }) => `Dépendance ${dependencyName}`,
        "launch of a service": ({ dependencyName }) =>
            `Lancement d'un service ${dependencyName}`,
        "mismatching pattern": ({ pattern }) => `Doit respecter ${pattern}`,
        "Invalid YAML Object": "Objet YAML non valide",
        "Invalid YAML Array": "Tableau YAML non valide"
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
        "confirm": "Oui, supprimer"
    },
    "MyServicesButtonBar": {
        "refresh": "Rafraîchir",
        "launch": "Nouveau service",
        "password": "Copier le mot de passe",
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
    "MyServicesSavedConfigOptions": {
        "edit": "Modifier",
        "copy link": "Copier l'URL",
        "remove bookmark": "Supprimer"
    },
    "MyServicesSavedConfig": {
        "edit": "Modifier",
        "launch": "Lancer"
    },
    "MyServicesSavedConfigs": {
        "saved": "Enregistrés",
        "show all": "Afficher tous"
    },
    "MyServicesCards": {
        "running services": "Services en cours",
        "no services running":
            "Vous n'avez actuellement aucun service en cours d'exécution",
        "launch one": "Cliquez ici pour en lancer un",
        "ok": "ok",
        "need to copy": "Besoin de copier les valeurs non tronquées ?",
        "everything have been printed to the console": "Tout a été loggé dans la console",
        "first copy the password": "Commencez par copier le mot de passe...",
        "open the service": "Ouvrir le service 🚀",
        "return": "Retour"
    }
    /* spell-checker: enable */
};
