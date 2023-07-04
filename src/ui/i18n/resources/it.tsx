import type { Translations } from "../types";
import MuiLink from "@mui/material/Link";

export const translations: Translations<"it"> = {
    /* spell-checker: disable */
    "Account": {
        "infos": "Informazioni dell'account",
        "third-party-integration": "Servizi esterni",
        "storage": "Connessionne allo storage",
        "k8sCredentials": "Connessionne a Kubernetes",
        "user-interface": "Modalità d'interfaccia",
        "text1": "Il mio account",
        "text2": "Accedi alle diverse informazioni del tuo account.",
        "text3":
            "Configura le tue credenziali, email, password e token di accesso personale direttamente collegati ai tuoi servizi.",
        "personal tokens tooltip": 'O in inglese "token".',
        "vault": "Vault"
    },
    "AccountInfoTab": {
        "general information": "Informazioni generali",
        "user id": "Identificatore (IDEP)",
        "full name": "Nome completo",
        "email": "Indirizzo email",
        "change account info":
            "Modifica le informazioni dell'account (ad esempio, la password)",
        "auth information": "Informazioni di autenticazione Onyxia",
        "auth information helper":
            `Queste informazioni ti permettono di identificarti all'interno della piattaforma e dei vari servizi.`,
        "ip address": "Indirizzo IP"
    },
    "AccountIntegrationsTab": {
        "git section title": "Configurazioni Git",
        "git section helper": `Per assicurarti di apparire come l'autore delle contribuzioni Git dai tuoi servizi`,
        "gitName": "Nome utente per Git",
        "gitEmail": "Email per Git",
        "third party tokens section title":
            "Collegare in tuoi account Gitlab, Github e Kaggle",
        "third party tokens section helper": `Collega i tuoi servizi a account esterni utilizzando token di accesso personale e variabili d'ambiente.`,
        "personal token": ({ serviceName }) => `Token di accesso personale ${serviceName}`,
        "link for token creation": ({ serviceName }) =>
            `Creare il tuo token ${serviceName}.`,
        "accessible as env":
            "Accessibile all'interno dei tuoi servizi come variabile d'ambiente"
    },
    "AccountStorageTab": {
        "credentials section title": "Collega i tuoi dati ai tuoi servizi",
        "credentials section helper":
            "Archiviazione oggetti MinIO compatibile con Amazon (AWS S3). Queste informazioni sono già precompilate automaticamente.",
        "accessible as env":
            "Accessibile all'interno dei tuoi servizi come variabile d'ambiente",
        "init script section title":
            "Per accedere allo storage al di fuori dei servizi del datalab",
        "init script section helper": `Scarica o copia lo script di inizializzazione nel linguaggio di programmazione di tua scelta.`,
        "expires in": ({ howMuchTime }) => `Scade in ${howMuchTime}`
    },
    "AccountKubernetesTab": {
        "credentials section title": "Connessionne a Kubernetes",
        "credentials section helper":
            "Credenziali per interagire direttamente con il cluster Kubernetes.",
        "init script section title":
            "Per connetterti al cluster Kubernetes tramite il tuo kubectl locale",
        "init script section helper": `Scarica o copia lo script.`,
        "expires in": ({ howMuchTime }) => `Il token scade in ${howMuchTime}`
    },
    "AccountVaultTab": {
        "credentials section title": "Credenziali Vault",
        "credentials section helper": ({ vaultDocHref, mySecretLink }) => (
            <>
                <MuiLink href={vaultDocHref} target="_blank">
                    Vault
                </MuiLink>{" "}
                è il sistema in cui &nbsp;
                <MuiLink {...mySecretLink}>i tuoi segreti</MuiLink> sono archiviati.
            </>
        ),
        "init script section title": "Utilizzare Vault dal tuo terminale",
        "init script section helper": ({ vaultCliDocLink }) => (
            <>
                Scaricare o copiare le varabili d'<code>ENV</code> per configurare il tuo{" "}
                <MuiLink href={vaultCliDocLink} target="_blank">
                    Vault CLI
                </MuiLink>{" "}
                locale.
            </>
        ),
        "expires in": ({ howMuchTime }) => `Il token scade in ${howMuchTime}`
    },
    "AccountUserInterfaceTab": {
        "title": "Configurare la modalità di interfaccia",
        "enable dark mode": "Attivare la modalità scura",
        "dark mode helper":
            "Tema dell'interfaccia a bassa luminosità con sfondo di colore scuro",
        "enable beta": "Attivare la modalità di beta testing",
        "beta mode helper":
            "Per configurazioni e funzionalità avanzate della piattaforma.",
        "enable dev mode": "Attivare la modalità sviluppatore",
        "dev mode helper": "Attivare le funzionalità in fase di sviluppo"
    },
    "AccountField": {
        "copy tooltip": "Copiare negli appunti.",
        "language": "Cambiare la lingua",
        "service password": "Password per i tuoi servizi",
        "service password helper text": `Questa password è necessaria per accedere a tutti i tuoi servizi.
            Viene generata automaticamente e viene rinnovata regolarmente.`,
        "not yet defined": "Non definita",
        "reset helper dialogs": "Ripristinare le finestre di istruzioni",
        "reset": "Ripristinare",
        "reset helper dialogs helper text":
            "Ripristinare le finestre di messaggi che hai richiesto di non mostrare più"
    },
    "MyFiles": {
        "page title - my files": "I miei file",
        "page title - my secrets": "I miei segreti",
        "what this page is used for - my files": "Archivia qui i tuoi file di dati.",
        "what this page is used for - my secrets":
            "Archivia qui i segreti che saranno accessibili come variabili d'ambiente nei tuoi servizi.",
        "help content": ({ accountTabLink, docHref }) => (
            <>
                Leggere{" "}
                <MuiLink href={docHref} target="_blank">
                    la nostra documentazione
                </MuiLink>
                . &nbsp;
                <MuiLink {...accountTabLink}>Configurare i client MinIO</MuiLink>.
            </>
        )
    },
    "MySecrets": {
        "page title - my files": "I miei file",
        "page title - my secrets": "I miei segreti",
        "what this page is used for - my files": "Archivia qui i tuoi file di dati.",
        "what this page is used for - my secrets":
            "Archivia qui i segreti che saranno accessibili come variabili d'ambiente nei tuoi servizi.",
        "learn more - my files": "Per saperne di più sull'utilizzo dello storage S3,",
        "help content": ({ accountTabLink, docHref }) => (
            <>
                Leggere{" "}
                <MuiLink href={docHref} target="_blank">
                    la nostra documentazione
                </MuiLink>
                . &nbsp;
                <MuiLink {...accountTabLink}>Configurare il tuo Vault CLI locale</MuiLink>.
            </>
        )
    },
    "ExplorerItem": {
        "description": "descrizione"
    },
    "SecretsExplorerItem": {
        "description": "descrizione"
    },
    "ExplorerButtonBar": {
        "file": "file",
        "secret": "segreto",
        "delete": "eliminare",
        "create secret": "Nuovo segreto",
        "upload file": "Caricare un file",
        "copy path": "Copia il nome dell'oggetto S3",
        "create directory": "Nuova cartella",
        "refresh": "aggiornare",
        "create what": ({ what }) => `Nuovo ${what}`,
        "new": "Nuovo"
    },
    "SecretsExplorerButtonBar": {
        "file": "file",
        "secret": "segreto",
        "rename": "rinominare",
        "delete": "eliminare",

        "create secret": "Nuovo segreto",
        "upload file": "Caricare un file",
        "copy path": "Utilizzare nel servizio",
        "create directory": "Nuova cartella",
        "refresh": "aggiornare",
        "create what": ({ what }) => `Nuovo ${what}`,
        "new": "Nuovo"
    },
    "Explorer": {
        "file": "file",
        "secret": "segreto",
        "create": "creare",
        "cancel": "annullare",
        "delete": "eliminare",
        "do not display again": "Non mostrare più",

        "untitled what": ({ what }) => `${what}_senza_nome`,
        "directory": "cartella",
        "deletion dialog title": ({ deleteWhat }) => `Eliminare un ${deleteWhat} ?`,
        "deletion dialog body": ({ deleteWhat }) => `
            Stai per eliminare un ${deleteWhat}. 
            Questa azione potrebbe comportare la potenziale perdita dei dati associati a questo ${deleteWhat}.
            `,
        "already a directory with this name": "Esiste già una cartella con questo nome",
        "can't be empty": "Non può essere vuoto",
        "new directory": "Nuova cartella"
    },
    "SecretsExplorer": {
        "file": "file",
        "secret": "segreto",
        "cancel": "annullare",
        "delete": "eliminare",
        "do not display again": "Non mostrare più",
        "untitled what": ({ what }) => `${what}_senza_nome`,
        "directory": "cartella",
        "deletion dialog title": ({ deleteWhat }) => `Eliminare un ${deleteWhat} ?`,
        "deletion dialog body": ({ deleteWhat }) => `
            Stai per eliminare un ${deleteWhat}. 
            Questa azione potrebbe comportare la potenziale perdita dei dati associati a questo ${deleteWhat}.
            `,
        "already a directory with this name": "Esiste già una cartella con questo nome",
        "can't be empty": "Non può essere vuoto",
        "create": "creare",
        "new directory": "Nuova cartella"
    },
    "ExplorerItems": {
        "empty directory": "Questa cartella è vuota"
    },
    "SecretsExplorerItems": {
        "empty directory": "Questa cartella è vuota"
    },
    "MySecretsEditor": {
        "do not display again": "Non mostrare più",
        "add an entry": "Aggiungiere una variabile",
        "environnement variable default name": "NUOVA_VARENV",
        "table of secret": "Tabella dei segreti",

        "key column name": "Nome della variabile",
        "value column name": "Valore",
        "resolved value column name": "Valore risolto",
        "what's a resolved value": `
        Una variabile di ambiente può fare riferimento a un'altra,
        ad esempio se hai definito la variabile NOME=Louis,
        puoi definire la variabile NOME_COMPLETO="$NOME"-Dupon che avrà come valore risolto "Louis-Dupon".
            `,
        "unavailable key": "Già utilizzato",
        "invalid key empty string": "È richiesto un nome",
        "invalid key _ not valid": "Non può essere semplicemente _",
        "invalid key start with digit": "Non deve iniziare con un numero",
        "invalid key invalid character": "Caractère non valide",
        "invalid value cannot eval": "Carattere non valido",
        "use this secret": "Utilizzare in un servizio",

        "use secret dialog title": "Utilizzare in un servizio",
        "use secret dialog subtitle": "Il percorso del segreto è stato copiato.",
        "use secret dialog body": `
                Prima di avviare un servizio (come RStudio, Jupyter), vai nella scheda "VAULT"
                e incolla il percorso del segreto nel campo apposito. Le tue chiavi e valori
                saranno disponibili come variabili d'ambiente.
            `,
        "use secret dialog ok": "Ho capito"
    },
    "MySecretsEditorRow": {
        "key input desc": "Nome della variabile di ambiente",
        "value input desc": "Valore della variabile di ambiente"
    },
    "ExplorerUploadModalDropArea": {
        "browse files": "Sfoglia i tuoi file",
        "drag and drop or": "Trascina e rilascia o"
    },
    "ExplorerUploadProgress": {
        "over": "su",
        "importing": "importazione"
    },
    "ExplorerUploadModal": {
        "import files": "Importare file",
        "cancel": "Annullare",
        "minimize": "Minimizzare"
    },
    "Header": {
        "login": "Connessionne",
        "logout": "Disconnessione",
        "trainings": "Formazioni",
        "documentation": "Documentazione",
        "project": "Proggetto"
    },
    "App": {
        "reduce": "Ridurre",
        "home": "Home",
        "account": "Il mio account",
        "catalog": "Catalogo di servizi",
        "myServices": "I miei servizi",
        "mySecrets": "I miei segreti",
        "myFiles": "I miei file",
        "divider: services features": "Funzioni relative ai servizi",
        "divider: external services features":
            "Funzioni relative ai servizi esterni",
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
