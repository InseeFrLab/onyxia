import type { Translations } from "../types";
import MuiLink from "@mui/material/Link";

export const translations: Translations<"it"> = {
    /* spell-checker: disable */
    "Account": {
        "infos": "Informazioni dell'account",
        "third-party-integration": "Servizi esterni",
        "storage": "Connessione allo storage",
        "k8sCredentials": "Connessione a Kubernetes",
        "user-interface": "Modalità d'interfaccia",
        "text1": "Il mio account",
        "text2": "Accedi alle diverse informazioni del tuo account.",
        "text3":
            "Configura le tue credenziali, email, password e token di accesso personale direttamente collegati ai tuoi servizi.",
        "personal tokens tooltip": 'O in inglese solo "token".',
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
        "credentials section title": "Connessione a Kubernetes",
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
        "deletion dialog title": ({ deleteWhat }) => `Eliminare un ${deleteWhat}?`,
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
        "deletion dialog title": ({ deleteWhat }) => `Eliminare un ${deleteWhat}?`,
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
        "login": "Connessione",
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
            "Funzioni specifiche di questa istanza di Onyxia"
    },
    "Page404": {
        "not found": "Pagina non trovata"
    },
    "PortraitModeUnsupported": {
        "portrait mode not supported": "La modalità ritratto non è ancora supportata",
        "instructions":
            "Per utilizzare questa applicazione dal tuo cellulare, attiva il sensore di rotazione e ruota il tuo telefono."
    },
    "Home": {
        "welcome": ({ who }) => `Benvenuto ${who}!`,
        "title": "Benvenuto sul datalab",
        "login": "Connessione",
        "new user": "Nuovo utente del datalab?",
        "subtitle":
            "Lavora con Python o R e goditi la potenza di cui hai bisogno!",
        "cardTitle1": "Un ambiente ergonomico e servizi su richiesta",
        "cardTitle2": "Una comunità attiva ed entusiasta pronta ad ascoltarti",
        "cardTitle3": "Uno spazio di archiviazione dati veloce, flessibile e online",
        "cardText1":
            "Analizza i dati, esegui calcoli distribuiti e approfitta di un ampio catalogo di servizi. Prenota la potenza di calcolo di cui hai bisogno.",
        "cardText2":
            "Approfitta e condividi le risorse messe a tua disposizione: tutorial, formazione e canali di comunicazione.",
        "cardText3":
            "Per accedere facilmente ai tuoi dati e a quelli messi a tua disposizione dai tuoi programmi - Implementazione dell'API S3",
        "cardButton1": "Consultare il catalogo",
        "cardButton2": "Uniscirsi alla comunità",
        "cardButton3": "Consultare i dati"
    },
    "CatalogExplorerCard": {
        "launch": "Avviare",
        "learn more": "Per saperne di più"
    },
    "CatalogExplorerCards": {
        "show more": "Mostrare tutto",
        "no service found": "Servizio non trovato",
        "no result found": ({ forWhat }) => `Nessun risultato trovato per ${forWhat}`,
        "check spelling": `Verifica che il nome del servizio sia correttamente scritto o prova ad ampliare la tua ricerca.`,
        "go back": "Torna ai servizi principali",
        "main services": "Servizi principali",
        "all services": "Tutti i servizi",
        "search results": "Risultati della ricerca",
        "search": "Cercare"
    },
    "Catalog": {
        "header text1": "Catalogo di servizi",
        "header text2":
            "Esplora, avvia e configura servizi con pochi clic.",
        "contribute to the catalog": ({ catalogName }) => (
            <>Contribuire al catalogo {catalogName}</>
        ),
        "contribute to the package": ({ packageName }) =>
            `Accedere alle fonti del pacchetto ${packageName} `,
        "here": "Qui"
    },
    "CatalogLauncher": {
        "no longer bookmarked dialog title": "Modifiche non salvate",
        "no longer bookmarked dialog body":
            "Clicca nuovamente sull'icona del segnalibro per aggiornare la configurazione salvata.",
        "ok": "Ok",
        "should overwrite configuration dialog title": "Vuoi sostituirlo?",
        "should overwrite configuration dialog subtitle": ({ friendlyName }) =>
            `«${friendlyName}» esiste già nelle tuoi registrazioni.`,
        "should overwrite configuration dialog body":
            "Esiste già un servizio registrato con lo stesso nome. Se lo sostituisci, il contenuto originale verrà perso.",
        "cancel": "Annullare",
        "replace": "Sostituire",
        "sensitive configuration dialog title":
            "Avviare questo servizio potrebbe essere pericoloso.",
        "proceed to launch": "Lanciare con consapevolezza"
    },
    "Footer": {
        "contribute": "Contribuire al proggetto",
        "terms of service": "Condizioni d'uso",
        "change language": "Cambiare la lingua",
        "dark mode switch": "Interruttore per la modalità scura"
    },
    "CatalogLauncherMainCard": {
        "card title": "Crea il tuo proprio servizio",
        "friendly name": "Nome personalizzato",
        "launch": "Avviare",
        "cancel": "Annullare",
        "copy url helper text":
            "Copiare l'URL per ripristinare questa configurazione",
        "save configuration": "Salvare questa configurazione",
        "share the service": "Condividire il servizio",
        "share the service - explain":
            "Rendere il servizio accessibile ai membri del gruppo",
        "restore all default": "Ripristinare le configurazioni"
    },
    "CatalogLauncherConfigurationCard": {
        "global config": "Configurazioni globali",
        "configuration": ({ packageName }) => `Configurazione ${packageName}`,
        "dependency": ({ dependencyName }) => `Dipendenza ${dependencyName}`,
        "launch of a service": ({ dependencyName }) =>
            `Avvio di un servizio ${dependencyName}`,
        "mismatching pattern": ({ pattern }) => `Deve rispettare ${pattern}`,
        "Invalid YAML Object": "Oggetto YAML non valido",
        "Invalid YAML Array": "Tabella YAML non valida"
    },
    "MyServices": {
        "text1": "I miei servizi",
        "text2":
            "Avvia, visualizza e gestisci rapidamente i tuoi vari servizi in esecuzione.",
        "text3":
            "Si consiglia di eliminare i servizi dopo ogni sessione di lavoro.",
        "running services": "Servizi in corso",
        "confirm delete title": "Sei sicuro?",
        "confirm delete subtitle":
            "Assicurati che i tuoi servizi non contengano lavori non salvati.",
        "confirm delete body":
            "Non dimenticare di fare un push del tuo codice su GitHub o GitLab prima di procedere.",
        "confirm delete body shared services":
            "Attenzione, alcuni dei tuoi servizi sono condivisi con gli altri membri del progetto.",
        "cancel": "Annullare",
        "confirm": "Sì, eliminare"
    },
    "MyServicesButtonBar": {
        "refresh": "Aggiornare",
        "launch": "Nuovo servizio",
        "password": "Copiare la password",
        "trash": "Eliminare tutti",
        "trash my own": "Eliminare tutti i miei servizi."
    },
    "MyServicesCard": {
        "service": "Servizio",
        "running since": "In esecuzione da: ",
        "open": "Aprire",
        "readme": "readme",
        "shared by you": "Condiviso da te",
        "which token expire when": ({ which, howMuchTime }) =>
            `Il token ${which} scade ${howMuchTime}.`,
        "which token expired": ({ which }) => `Il token ${which} è scaduto.`,
        "reminder to delete services":
            "Ricordati di eliminare i tuoi servizi dopo l'utilizzo.",
        "this is a shared service": "Questo servizio è condiviso all'interno del progetto"
    },
    "MyServicesRunningTime": {
        "launching": "In corso..."
    },
    "MyServicesSavedConfigOptions": {
        "edit": "Modificare",
        "copy link": "Copiare l'URL",
        "remove bookmark": "Eliminare"
    },
    "MyServicesSavedConfig": {
        "edit": "Modificare",
        "launch": "Avviare"
    },
    "MyServicesSavedConfigs": {
        "saved": "Salvati",
        "show all": "Mostrare tutti"
    },
    "MyServicesCards": {
        "running services": "Servizi in corso",
        "no services running":
            "Attualmente non hai alcun servizio in esecuzione",
        "launch one": "Clicca qui per avviarne uno",
        "ok": "ok",
        "need to copy": "Hai bisogno di copiare i valori non troncati?",
        "everything have been printed to the console": "Tutto è stato registrato nella console.",
        "first copy the password": "Inizia copiando la password...",
        "open the service": "Aprire il servizio 🚀",
        "return": "Ritorno"
    }
    /* spell-checker: enable */
};
