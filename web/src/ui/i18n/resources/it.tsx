import type { Translations } from "../types";
import MuiLink from "@mui/material/Link";
import { Markdown } from "ui/shared/Markdown";
import { Icon } from "onyxia-ui/Icon";
import { getIconUrlByName } from "lazy-icons";
import { capitalize } from "tsafe/capitalize";
import { MaybeLink } from "ui/shared/MaybeLink";

export const translations: Translations<"it"> = {
    /* spell-checker: disable */
    Account: {
        infos: "Informazioni dell'account",
        git: undefined,
        storage: "Connessione allo storage",
        k8sCodeSnippets: "Connessione a Kubernetes",
        "user-interface": "Modalità d'interfaccia",
        text1: "Il mio account",
        text2: "Accedi alle diverse informazioni del tuo account.",
        text3: "Configura le tue credenziali, email, password e token di accesso personale direttamente collegati ai tuoi servizi.",
        "personal tokens tooltip": 'O in inglese solo "token".',
        vault: "Vault"
    },
    AccountInfoTab: {
        "general information": "Informazioni generali",
        "user id": "Identificatore (IDEP)",
        "full name": "Nome completo",
        email: "Indirizzo email",
        "instructions about how to change password":
            'Per cambiare la tua password, semplicemente esci e clicca sul link "password dimenticata".'
    },
    AccountGitTab: {
        gitName: "Nome utente per Git",
        "gitName helper text": ({ gitName, focusClassName }) => (
            <>
                Questo comando imposterà il tuo nome utente globale di Git, eseguito
                all'avvio del servizio:&nbsp;
                <code className={focusClassName}>
                    git config --global user.name "{gitName || "<tuo_nome_utente>"}"
                </code>
            </>
        ),
        gitEmail: "Email per Git",
        "gitEmail helper text": ({ gitEmail, focusClassName }) => (
            <>
                Questo comando imposterà la tua email globale di Git, eseguito all'avvio
                del servizio:&nbsp;
                <code className={focusClassName}>
                    git config --global user.email "
                    {gitEmail || "<tua_email@dominio.com>"}"
                </code>
            </>
        ),
        githubPersonalAccessToken: "Token di Accesso Personale per Forge Git",
        "githubPersonalAccessToken helper text": ({ focusClassName }) => (
            <>
                Fornendo questo token, potrai clonare e inviare modifiche ai tuoi
                repository privati di GitHub o GitLab senza dover reinserire le
                credenziali della tua forge.
                <br />
                Questo token sarà anche disponibile come variabile d'ambiente:&nbsp;
                <span className={focusClassName}>$GIT_PERSONAL_ACCESS_TOKEN</span>
            </>
        )
    },
    AccountStorageTab: {
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
    AccountKubernetesTab: {
        "credentials section title": "Connetti al cluster Kubernetes",
        "credentials section helper":
            "Credenziali per interagire direttamente con il server API di Kubernetes.",
        "init script section title": "Script Shell",
        "init script section helper": ({ installKubectlUrl }) => (
            <>
                Questo script consente di utilizzare kubectl o helm sul tuo computer
                locale. <br />
                Per utilizzarlo,{" "}
                <MuiLink href={installKubectlUrl} target="_blank">
                    installa semplicemente kubectl sul tuo computer
                </MuiLink>{" "}
                e esegui lo script copiandolo e incollandolo nel tuo terminale.
                <br />
                Dopo averlo fatto, puoi confermare che funziona eseguendo il comando&nbsp;
                <code>kubectl get pods</code> o <code>helm list</code>
            </>
        ),
        "expires in": ({ howMuchTime }) =>
            `Queste credenziali sono valide per i prossimi ${howMuchTime}`
    },
    AccountVaultTab: {
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
    ProjectSettings: {
        "page header title": "Impostazioni del Progetto",
        "page header help title": ({ groupProjectName }) =>
            groupProjectName === undefined
                ? "Impostazioni del tuo progetto personale"
                : `Impostazioni per "${groupProjectName}"`,
        "page header help content": ({
            groupProjectName,
            doesUserBelongToSomeGroupProject
        }) => (
            <>
                Questa pagina ti permette di configurare le impostazioni applicabili a
                {groupProjectName === undefined
                    ? " il tuo progetto personale"
                    : ` il progetto ${groupProjectName}`}
                .
                <br />
                {groupProjectName !== undefined && (
                    <>
                        Sii consapevole che {groupProjectName} è un progetto di gruppo
                        condiviso con altri utenti; le modifiche che apporti qui si
                        applicheranno a tutti i membri del progetto.
                        <br />
                    </>
                )}
                {doesUserBelongToSomeGroupProject && (
                    <>
                        Puoi passare da un progetto all'altro utilizzando il menu a
                        tendina nell'intestazione.
                        <br />
                    </>
                )}
                Nota che solo l'amministratore della tua istanza Onyxia può creare nuovi
                progetti.
            </>
        ),
        "security-info": "Informazioni sulla Sicurezza",
        "s3-configs": "Configurazioni S3"
    },
    ProjectSettingsS3ConfigTab: {
        "add custom config": "Aggiungi una configurazione S3 personalizzata"
    },
    S3ConfigCard: {
        "data source": "Fonte dei dati",
        credentials: "Credenziali",
        "sts credentials": "Token richiesti dinamicamente per tuo conto da Onyxia (STS)",
        account: "Account",
        "use in services": "Utilizza nei servizi",
        "use in services helper": `Se abilitato, questa configurazione verrà utilizzata
            di default nei tuoi servizi che implementano un'integrazione S3.`,
        "use for onyxia explorers": "Utilizza per gli esploratori Onyxia",
        "use for onyxia explorers helper": `Se abilitato, questa configurazione verrà utilizzata
            dall'esploratore di file e dall'esploratore di dati.`,
        edit: "Modifica",
        delete: "Elimina"
    },
    AddCustomS3ConfigDialog: {
        "dialog title": "Nuova configurazione S3 personalizzata",
        "dialog subtitle":
            "Specifica un account di servizio personalizzato o connettiti ad un altro servizio compatibile con S3",
        cancel: "Annulla",
        "save config": "Salva configurazione",
        "update config": "Aggiorna configurazione",
        "is required": "Questo campo è richiesto",
        "must be an url": "URL non valido",
        "not a valid access key id": "Non sembra un ID chiave di accesso valido",
        "url textField label": "URL",
        "url textField helper text": "URL del servizio S3",
        "region textField label": "Regione AWS S3",
        "region textField helper text":
            "Esempio: eu-west-1, se non sei sicuro, lascia vuoto",
        "workingDirectoryPath textField label": "Percorso della directory di lavoro",
        "workingDirectoryPath textField helper text": (
            <>
                Questo ti permette di specificare il bucket e il prefisso dell'oggetto S3
                che possiedi sul servizio S3. <br />
                Esempio: <code>il-mio-bucket/il-mio-prefisso/</code> o{" "}
                <code>solo il-mio-bucket/</code> se possiedi l'intero bucket.
            </>
        ),
        "account credentials": "Credenziali dell'account",
        "friendlyName textField label": "Nome della configurazione",
        "friendlyName textField helper text":
            "Questo serve solo ad aiutarti a identificare questa configurazione. Esempio: Il mio bucket AWS",

        "isAnonymous switch label": "Accesso anonimo",
        "isAnonymous switch helper text":
            "Impostare su ON se non è richiesta una chiave di accesso segreta",

        "accessKeyId textField label": "ID chiave di accesso",
        "accessKeyId textField helper text": "Esempio: 1A2B3C4D5E6F7G8H9I0J",
        "secretAccessKey textField label": "Chiave di accesso segreta",
        "sessionToken textField label": "Token di sessione",
        "sessionToken textField helper text": "Opzionale, lascia vuoto se non sei sicuro",
        "url style": "Stile URL",
        "url style helper text": `Specifica come il tuo server S3 formatta l'URL per il download dei file.`,
        "path style label": ({ example }) => (
            <>
                Stile del percorso
                {example !== undefined && (
                    <>
                        :&nbsp;
                        <code>{example}il-mio-dataset.parquet</code>
                    </>
                )}
            </>
        ),
        "virtual-hosted style label": ({ example }) => (
            <>
                Stile virtual-hosted
                {example !== undefined && (
                    <>
                        :&nbsp;
                        <code>{example}il-mio-dataset.parquet</code>
                    </>
                )}
            </>
        )
    },
    TestS3ConnectionButton: {
        "test connection": "Testa la connessione",
        "test connection failed": ({ errorMessage }) => (
            <>
                Test della connessione fallito con errore: <br />
                {errorMessage}
            </>
        )
    },
    AccountUserInterfaceTab: {
        title: "Configurare la modalità di interfaccia",
        "enable dark mode": "Attivare la modalità scura",
        "dark mode helper":
            "Tema dell'interfaccia a bassa luminosità con sfondo di colore scuro",
        "enable beta": "Attivare la modalità di beta testing",
        "beta mode helper":
            "Per configurazioni e funzionalità avanzate della piattaforma.",
        "enable dev mode": "Attivare la modalità sviluppatore",
        "dev mode helper": "Attivare le funzionalità in fase di sviluppo",
        "Enable command bar": "Abilita la barra dei comandi",
        "Enable command bar helper": ({ imgUrl }) => (
            <>
                La{" "}
                <MuiLink href={imgUrl} target="_blank">
                    barra dei comandi
                </MuiLink>{" "}
                ti offre una panoramica dei comandi eseguiti per tuo conto quando
                interagisci con l'interfaccia utente.
            </>
        )
    },
    SettingField: {
        "copy tooltip": "Copiare negli appunti.",
        language: "Cambiare la lingua",
        "service password": "Password del servizio predefinito",
        "service password helper text": ({ groupProjectName }) => (
            <>
                Questa è la password predefinita utilizzata per proteggere i tuoi servizi
                in esecuzione. <br />
                Quando avvii un servizio, il campo password nella scheda di sicurezza è
                pre-riempito con questa password. <br />
                Cliccando sull'icona{" "}
                <Icon size="extra small" icon={getIconUrlByName("Refresh")} /> verrà
                generata una nuova password casuale. Tuttavia, tieni presente che non
                aggiornerà la password per i servizi che sono già in esecuzione. <br />
                La password del servizio è quella che Onyxia ti fa copiare negli appunti
                prima di accedere a un servizio in esecuzione. <br />
                {groupProjectName !== undefined && (
                    <>
                        Si prega di notare che questa password è condivisa tra tutti i
                        membri del progetto ({groupProjectName}).
                    </>
                )}
            </>
        ),
        "not yet defined": "Non definita",
        "reset helper dialogs": "Ripristinare le finestre di istruzioni",
        reset: "Ripristinare",
        "reset helper dialogs helper text":
            "Ripristinare le finestre di messaggi che hai richiesto di non mostrare più"
    },
    MyFiles: {
        "page title - my files": "I miei file",
        "what this page is used for - my files": "Archivia qui i tuoi file di dati.",
        "help content": ({ accountTabLink, docHref }) => (
            <>
                Leggere{" "}
                <MuiLink href={docHref} target="_blank">
                    la nostra documentazione
                </MuiLink>
                . &nbsp;
                <MuiLink {...accountTabLink}>
                    Configurare i client MinIO
                </MuiLink>.
            </>
        )
    },
    MyFilesDisabledDialog: {
        "dialog title": "Nessun server S3 configurato",
        "dialog body":
            "Non è stato configurato nessun server S3 per questa istanza. Tuttavia, è possibile aggiungerne uno manualmente per abilitare l'esploratore file S3.",
        cancel: "Annulla",
        "go to settings": "Vai alle impostazioni"
    },
    ShareDialog: {
        title: "Condividi i tuoi dati",
        close: "Chiudi",
        "create and copy link": "Crea e copia il link",
        "paragraph current policy": ({ isPublic }) =>
            isPublic
                ? "Il tuo file è pubblico, chiunque abbia il link può scaricarlo."
                : "Il tuo file è attualmente privato.",

        "paragraph change policy": ({ isPublic }) =>
            isPublic
                ? "Per limitare l'accesso, modifica lo stato di condivisione del tuo file."
                : "Per condividere e dare accesso al tuo file, modifica lo stato di condivisione o crea un link di accesso temporaneo.",

        "hint link access": ({ isPublic, expiration }) =>
            isPublic
                ? "Il tuo link è disponibile finché il file è pubblico."
                : `Questo link garantirà l'accesso ai tuoi dati per ${expiration}.`,
        "label input link": "Link di accesso"
    },
    SelectTime: {
        "validity duration label": "Durata di validità"
    },
    MySecrets: {
        "page title - my secrets": "I miei segreti",
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
                <MuiLink {...accountTabLink}>
                    Configurare il tuo Vault CLI locale
                </MuiLink>.
            </>
        )
    },
    ExplorerItem: {
        description: "descrizione"
    },
    SecretsExplorerItem: {
        description: "descrizione"
    },
    ExplorerButtonBar: {
        file: "file",
        delete: "eliminare",
        "upload file": "Caricare un file",
        "copy path": "Copia il nome dell'oggetto S3",
        "create directory": "Nuova cartella",
        refresh: "aggiornare",
        new: "Nuovo",
        share: "Condividi",
        "alt list view": "Mostra lista",
        "alt block view": "Mostra blocco"
    },
    SecretsExplorerButtonBar: {
        secret: "segreto",
        rename: "rinominare",
        delete: "eliminare",
        "create secret": "Nuovo segreto",
        "copy path": "Utilizzare nel servizio",
        "create directory": "Nuova cartella",
        refresh: "aggiornare",
        "create what": ({ what }) => `Nuovo ${what}`,
        new: "Nuovo"
    },
    Explorer: {
        file: "file",
        secret: "segreto",
        create: "creare",
        cancel: "annullare",
        delete: "eliminare",
        "do not display again": "Non mostrare più",

        "untitled what": ({ what }) => `${what}_senza_nome`,
        directory: "cartella",
        multiple: "elementi",
        "deletion dialog title": ({ deleteWhat, isPlural }) =>
            `Eliminare ${isPlural ? "questi" : "questo"} ${deleteWhat}?`,
        "deletion dialog body": ({ deleteWhat, isPlural }) => `
        Stai per eliminare ${isPlural ? "questi" : "questo"} ${deleteWhat}.
        Questa azione potrebbe comportare la perdita dei dati associati a ${isPlural ? "questi" : "questo"} ${deleteWhat}.
        `,
        "already a directory with this name": "Esiste già una cartella con questo nome",
        "can't be empty": "Non può essere vuoto",
        "new directory": "Nuova cartella"
    },
    ListExplorerItems: {
        "header name": "Nome",
        "header modified date": "Modificato",
        "header size": "Dimensione",
        "header policy": "Politica"
    },
    SecretsExplorer: {
        file: "file",
        secret: "segreto",
        cancel: "annullare",
        delete: "eliminare",
        "do not display again": "Non mostrare più",
        "untitled what": ({ what }) => `${what}_senza_nome`,
        directory: "cartella",
        "deletion dialog title": ({ deleteWhat }) => `Eliminare un ${deleteWhat}?`,
        "deletion dialog body": ({ deleteWhat }) => `
            Stai per eliminare un ${deleteWhat}. 
            Questa azione potrebbe comportare la potenziale perdita dei dati associati a questo ${deleteWhat}.
            `,
        "already a directory with this name": "Esiste già una cartella con questo nome",
        "can't be empty": "Non può essere vuoto",
        create: "creare",
        "new directory": "Nuova cartella"
    },
    ExplorerItems: {
        "empty directory": "Questa cartella è vuota"
    },

    SecretsExplorerItems: {
        "empty directory": "Questa cartella è vuota"
    },
    MySecretsEditor: {
        "do not display again": "Non mostrare più",
        "add an entry": "Aggiungiere una variabile",
        "environnement variable default name": "NUOVA_VARENV",
        "table of secret": "Tabella dei segreti",

        "key column name": "Nome della variabile",
        "value column name": "Valore",
        "unavailable key": "Già utilizzato",
        "invalid key empty string": "È richiesto un nome",
        "invalid key _ not valid": "Non può essere semplicemente _",
        "invalid key start with digit": "Non deve iniziare con un numero",
        "invalid key invalid character": "Caractère non valide",
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
    MySecretsEditorRow: {
        "key input desc": "Nome della variabile di ambiente",
        "value input desc": "Valore della variabile di ambiente"
    },
    ExplorerUploadModalDropArea: {
        "browse files": "Sfoglia i tuoi file",
        "drag and drop or": "Trascina e rilascia o"
    },
    ExplorerUploadProgress: {
        over: "su",
        importing: "importazione"
    },
    ExplorerUploadModal: {
        "import files": "Importare file",
        cancel: "Annullare",
        minimize: "Minimizzare"
    },
    Header: {
        login: "Connessione",
        logout: "Disconnessione",
        project: "Proggetto",
        region: "Regione"
    },
    LeftBar: {
        reduce: "Ridurre",
        home: "Home",
        account: "Il mio account",
        projectSettings: "Impostazioni del progetto",
        catalog: "Catalogo di servizi",
        myServices: "I miei servizi",
        mySecrets: "I miei segreti",
        myFiles: "I miei file",
        "divider: services features": "Funzioni relative ai servizi",
        "divider: external services features": "Funzioni relative ai servizi esterni",
        "divider: onyxia instance specific features":
            "Funzioni specifiche di questa istanza di Onyxia",
        dataExplorer: "Esploratore di Dati",
        sqlOlapShell: "Guscio SQL OLAP"
    },
    AutoLogoutCountdown: {
        "are you still there": "Sei ancora lì?",
        "you'll soon be automatically logged out":
            "Verrai presto disconnesso automaticamente."
    },
    Page404: {
        "not found": "Pagina non trovata"
    },
    PortraitModeUnsupported: {
        instructions:
            "Per utilizzare questa applicazione dal tuo cellulare, attiva il sensore di rotazione e ruota il tuo telefono."
    },
    MaybeAcknowledgeConfigVolatilityDialog: {
        "dialog title": "Attenzione, le configurazioni sono volatili",
        "dialog body": `Questa istanza di Onyxia non implementa alcun meccanismo di persistenza per salvare le configurazioni. 
            Tutte le configurazioni sono memorizzate nel storage locale del browser. Questo significa che se cancelli lo 
            storage locale del tuo browser o cambi browser, perderai tutte le tue configurazioni.`,
        "do not show next time": "Non mostrare più questo messaggio",
        cancel: "Annulla",
        "I understand": "Ho capito"
    },
    Home: {
        "title authenticated": ({ userFirstname }) => `Benvenuto ${userFirstname}!`,
        title: "Benvenuto sul datalab",
        login: "Connessione",
        "new user": "Nuovo utente del datalab?",
        subtitle: "Lavora con Python o R e goditi la potenza di cui hai bisogno!",
        cardTitle1: "Un ambiente ergonomico e servizi su richiesta",
        cardTitle2: "Una comunità attiva ed entusiasta pronta ad ascoltarti",
        cardTitle3: "Uno spazio di archiviazione dati veloce, flessibile e online",
        cardText1:
            "Analizza i dati, esegui calcoli distribuiti e approfitta di un ampio catalogo di servizi. Prenota la potenza di calcolo di cui hai bisogno.",
        cardText2:
            "Approfitta e condividi le risorse messe a tua disposizione: tutorial, formazione e canali di comunicazione.",
        cardText3:
            "Per accedere facilmente ai tuoi dati e a quelli messi a tua disposizione dai tuoi programmi - Implementazione dell'API S3",
        cardButton1: "Consultare il catalogo",
        cardButton2: "Uniscirsi alla comunità",
        cardButton3: "Consultare i dati"
    },
    Catalog: {
        header: "Catalogo di servizi",
        "no result found": ({ forWhat }) => `Nessun risultato trovato per ${forWhat}`,
        "search results": "Risultati della ricerca",
        search: "Cercare"
    },
    CatalogChartCard: {
        launch: "Avviare",
        "learn more": "Per saperne di più"
    },
    CatalogNoSearchMatches: {
        "no service found": "Servizio non trovato",
        "no result found": ({ forWhat }) => `Nessun risultato trovato per ${forWhat}`,
        "check spelling": `Verifica che il nome del servizio sia correttamente scritto o prova ad ampliare la tua ricerca.`,
        "go back": "Torna ai servizi principali"
    },
    Launcher: {
        sources: ({
            helmChartName,
            helmChartRepositoryName,
            labeledHelmChartSourceUrls
        }) => (
            <>
                Il chart di Helm{" "}
                {
                    <MaybeLink href={labeledHelmChartSourceUrls.helmChartSourceUrl}>
                        {helmChartName}
                    </MaybeLink>
                }{" "}
                appartiene al repository di chart Helm{" "}
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
                        È basato sull'immagine Docker{" "}
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
        "download as script": "Scaricare lo script",
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
            >{`Abbiamo progettato la barra dei comandi per darti il controllo completo sui tuoi deployment Kubernetes.
Ecco cosa devi sapere:

#### Quali sono questi comandi Helm?

Questi comandi sono gli esatti comandi Helm che l'API Onyxia eseguirà per tuo conto nel tuo namespace Kubernetes.
Ciò ti permette di capire cosa sta accadendo dietro le quinte quando interagisci con l'UI.

#### Aggiornamenti in tempo reale

Mentre interagisci con l'UI, i comandi Helm si aggiorneranno automaticamente per riflettere le tue azioni.

#### Perché dovrei preoccuparmene?

- **Trasparenza:** Crediamo che tu abbia il diritto di sapere quali azioni vengono eseguite nel tuo ambiente.
- **Apprendimento:** Capire questi comandi può fornire intuizioni su Kubernetes e Helm, approfondendo la tua conoscenza.
- **Esecuzione Manuale:** Puoi copiare e incollare questi comandi in un terminale con accesso in scrittura a Kubernetes, permettendoti di avviare il servizio manualmente.

#### Come posso eseguire questi comandi manualmente?

${
    k8CredentialsHref === undefined
        ? ""
        : "Ci sono due modi per eseguire questi comandi:  "
}

${
    k8CredentialsHref === undefined
        ? ""
        : `
- **Terminale Locale:** Vai a [\`Il Mio Account -> Tab Kubernetes\`](${k8CredentialsHref}).
  Qui troverai le credenziali che ti permettono di eseguire comandi nel tuo namespace Kubernetes dal tuo terminale locale.
`
}

- Se questa istanza di Onyxia offre servizi come VSCode o Jupyter, puoi aprire un terminale all'interno di questi servizi ed eseguire i comandi da lì.
  Per comandi costruttivi o distruttivi, avrai bisogno di lanciare il tuo servizio con ruolo Kubernetes \`admin\` o \`edit\`.

Eseguendo il comando manualmente, sarai ancora in grado di vedere il servizio nella pagina [\`I Miei Servizi\`](${myServicesHref}) come se fosse stato lanciato attraverso l'UI.

Puoi disabilitare la barra dei comandi nel tab [\`Il Mio Account -> Preferenze Interfaccia\`](${interfacePreferenceHref}).

Sentiti libero di esplorare e prendere il controllo dei tuoi deployment Kubernetes!
        `}</Markdown>
        ),
        form: "Modulo",
        editor: "Editor di testo"
    },
    AcknowledgeSharingOfConfigConfirmDialog: {
        "acknowledge sharing of config confirm dialog title":
            "Siate consapevoli, le configurazioni sono condivise",
        "acknowledge sharing of config confirm dialog subtitle": ({
            groupProjectName
        }) => `Se salvi
        questa configurazione, ogni membro del progetto ${groupProjectName} sarà in grado di avviarla.`,
        "acknowledge sharing of config confirm dialog body": `Sebbene nessuna informazione personale sia stata automaticamente inserita
        da Onyxia, fai attenzione a non condividere informazioni sensibili nella configurazione ripristinabile.`,
        cancel: "Annulla",
        "i understand, proceed": "Ho capito, procedi"
    },
    AutoLaunchDisabledDialog: {
        ok: "Ok",
        "auto launch disabled dialog title": "Avvio automatico disabilitato",
        "auto launch disabled dialog body": (
            <>
                <b>ATTENZIONE</b>: Qualcuno potrebbe cercare di ingannarti per lanciare un
                servizio che potrebbe compromettere l'integrità del tuo namespace.
                <br />
                Si prega di rivedere attentamente la configurazione del servizio prima di
                lanciarlo.
                <br />
                In caso di dubbi, contattare l'amministratore.
            </>
        )
    },
    FormFieldWrapper: {
        "reset to default": "Ripristina il valore predefinito"
    },
    ConfigurationTopLevelGroup: {
        miscellaneous: "Varie",
        "Configuration that applies to all charts":
            "Configurazione che si applica a tutti i grafici",
        "Top level configuration values": "Valori di configurazione di livello superiore"
    },
    YamlCodeBlockFormField: {
        "not an array": "È previsto un array",
        "not an object": "È previsto un oggetto",
        "not valid yaml": "YAML/JSON non valido"
    },
    TextFormField: {
        "not matching pattern": ({ pattern }) => `Non corrisponde al modello ${pattern}`,
        "toggle password visibility": "Alterna la visibilità della password"
    },
    FormFieldGroupComponent: {
        add: "Aggiungi"
    },
    NumberFormField: {
        "below minimum": ({ minimum }) => `Deve essere maggiore o uguale a ${minimum}`,
        "not a number": "Non è un numero",
        "not an integer": "Non è un numero intero"
    },
    NoLongerBookmarkedDialog: {
        "no longer bookmarked dialog title": "Modifiche non salvate",
        "no longer bookmarked dialog body":
            "Clicca nuovamente sull'icona del segnalibro per aggiornare la configurazione salvata.",
        ok: "Ok"
    },
    MyService: {
        "page title": ({ helmReleaseFriendlyName }) =>
            `${helmReleaseFriendlyName} Monitoraggio`
    },
    PodLogsTab: {
        "not necessarily first logs":
            "Questi non sono necessariamente i primi log, i log più vecchi potrebbero essere stati cancellati",
        "new logs are displayed in realtime":
            "I nuovi log vengono visualizzati in tempo reale"
    },
    MyServiceButtonBar: {
        back: "Indietro",
        "external monitoring": "Monitoraggio esterno",
        "helm values": "Valori Helm",
        reduce: "Riduci"
    },
    LauncherMainCard: {
        "friendly name": "Nome personalizzato",
        launch: "Avviare",
        "problem with": "Problema con:",
        cancel: "Annullare",
        "copy auto launch url": "Copia URL di avvio automatico",
        "copy auto launch url helper": ({
            chartName
        }) => `Copia l'URL che consentirà a qualsiasi utente di questa istanza Onyxia di 
            lanciare un ${chartName} in questa configurazione nel loro namespace`,
        "share the service": "Condividire il servizio",
        "share the service - explain":
            "Rendere il servizio accessibile ai membri del gruppo",
        "restore all default": "Ripristinare le configurazioni",
        "bookmark button": ({ isBookmarked }) =>
            `${isBookmarked ? "Rimuovi" : "Salva"} configurazione`,
        "bookmark button tooltip": ({ myServicesSavedConfigsExtendedLink }) => (
            <>
                Le configurazioni salvate possono essere rapidamente riavviate dalla
                pagina&nbsp;
                <MuiLink {...myServicesSavedConfigsExtendedLink} target="_blank">
                    I Miei Servizi
                </MuiLink>
            </>
        ),
        "version select label": "Versione",
        "version select helper text": ({
            helmCharName,
            helmRepositoryName,
            labeledHelmChartSourceUrls
        }) => (
            <>
                Versione dell'helm chart{" "}
                {
                    <MaybeLink href={labeledHelmChartSourceUrls.helmChartSourceUrl}>
                        {helmCharName}
                    </MaybeLink>
                }{" "}
                che appartiene al repository di helm chart{" "}
                {
                    <MaybeLink
                        href={labeledHelmChartSourceUrls.helmChartRepositorySourceUrl}
                    >
                        {helmRepositoryName}
                    </MaybeLink>
                }
                .
            </>
        ),
        "save changes": "Salva modifiche",
        "copied to clipboard": "Copiato negli appunti!",
        "s3 configuration": "Configurazione S3",
        "s3 configuration - explain": ({ projectS3ConfigLink }) => (
            <>
                Configurazione S3 da utilizzare per questo servizio.{" "}
                <MuiLink {...projectS3ConfigLink}>Configurazione S3</MuiLink>.
            </>
        )
    },
    Footer: {
        contribute: "Contribuire al proggetto",
        "terms of service": "Condizioni d'uso",
        "change language": "Cambiare la lingua",
        "dark mode switch": "Interruttore per la modalità scura"
    },
    MyServices: {
        text1: "I miei servizi",
        text2: "Avvia, visualizza e gestisci rapidamente i tuoi vari servizi in esecuzione.",
        text3: "Si consiglia di eliminare i servizi dopo ogni sessione di lavoro.",
        "running services": "Servizi in corso"
    },
    ClusterEventsDialog: {
        title: "Eventi",
        subtitle: (
            <>
                Eventi dello spazio dei nomi di Kubernetes, è un flusso in tempo reale di{" "}
                <code>kubectl get events</code>
            </>
        )
    },
    MyServicesConfirmDeleteDialog: {
        "confirm delete title": "Sei sicuro?",
        "confirm delete subtitle":
            "Assicurati che i tuoi servizi non contengano lavori non salvati.",
        "confirm delete body":
            "Non dimenticare di fare un push del tuo codice su GitHub o GitLab prima di procedere.",
        "confirm delete body shared services":
            "Attenzione, alcuni dei tuoi servizi sono condivisi con gli altri membri del progetto.",
        cancel: "Annullare",
        confirm: "Sì, eliminare"
    },
    MyServicesButtonBar: {
        refresh: "Aggiornare",
        launch: "Nuovo servizio",
        trash: "Eliminare tutti",
        "trash my own": "Eliminare tutti i miei servizi."
    },
    MyServicesCard: {
        service: "Servizio",
        "running since": "Avviato: ",
        open: "Aprire",
        readme: "readme",
        "reminder to delete services":
            "Ricordati di eliminare i tuoi servizi dopo l'utilizzo.",
        status: "Stato",
        "container starting": "Avvio del contenitore",
        failed: "Fallito",
        "suspend service tooltip": "Sospendi il servizio e rilascia le risorse",
        "resume service tooltip": "Riprendi il servizio",
        suspended: "Sospeso",
        suspending: "Sospensione in corso",
        "share tooltip - belong to someone else": ({
            projectName,
            ownerUsername,
            focusColor
        }) => (
            <>
                Questo servizio è condiviso tra i membri del progetto{" "}
                <span style={{ color: focusColor }}>{projectName}</span>
                da <span style={{ color: focusColor }}>{ownerUsername}</span>.
            </>
        ),
        "share tooltip - belong to you, shared": ({ projectName, focusColor }) => (
            <>
                Questo servizio è condiviso tra i membri del progetto{" "}
                <span style={{ color: focusColor }}>{projectName}</span>. Clicca per
                interrompere la condivisione.
            </>
        ),
        "share tooltip - belong to you, not shared": ({ projectName, focusColor }) => (
            <>
                Solo tu puoi accedere a questo servizio. Clicca per condividerlo con i
                membri del progetto{" "}
                <span style={{ color: focusColor }}>{projectName}</span>.
            </>
        )
    },
    MyServicesRestorableConfigOptions: {
        edit: "Modificare",
        "copy link": "Copiare l'URL",
        "remove bookmark": "Eliminare"
    },
    MyServicesRestorableConfig: {
        edit: "Modificare",
        launch: "Avviare"
    },
    MyServicesRestorableConfigs: {
        saved: "Salvati",
        expand: "Espandi"
    },
    ReadmeDialog: {
        ok: "ok",
        return: "Ritorno"
    },
    CopyOpenButton: {
        "first copy the password": "Clicca per copiare la password...",
        "open the service": "Aprire il servizio 🚀"
    },
    MyServicesCards: {
        "running services": "Servizi in corso"
    },
    NoRunningService: {
        "launch one": "Clicca qui per avviarne uno",
        "no services running": "You don't have any service running"
    },
    CircularUsage: {
        max: "Massimo",
        used: "Usato",
        "quota card title": ({ what, isLimit }) => {
            const whatTranslated = (() => {
                switch (what) {
                    case "memory":
                        return "RAM";
                    case "cpu":
                        return "CPU";
                    case "storage":
                        return "Archiviazione";
                    case "count/pod":
                        return "Pod Kubernetes";
                    case "nvidia.com/gpu":
                        return "GPU Nvidia";
                    default:
                        return capitalize(what);
                }
            })();

            return `${whatTranslated} - ${isLimit ? "Limite" : "Richiesto"}`;
        }
    },
    Quotas: {
        "show more": "Mostra di più",
        "resource usage quotas": "Quote di utilizzo delle risorse",
        "current resource usage is reasonable":
            "Il tuo attuale utilizzo delle risorse è ragionevole."
    },
    DataExplorer: {
        "page header title": "Esploratore di Dati",
        "page header help title":
            "Anteprima dei tuoi file Parquet e CSV direttamente dal tuo browser!",
        "page header help content": ({ demoParquetFileLink }) => (
            <>
                Inserisci semplicemente l'URL <code>https://</code> o <code>s3://</code>{" "}
                di un file di dati per visualizzarne l'anteprima.
                <br />
                Il file non viene scaricato completamente; il suo contenuto viene
                trasmesso man mano che navighi tra le pagine.
                <br />
                Puoi condividere un link permanente al file o anche a una specifica riga
                del file copiando l'URL dalla barra degli indirizzi.
                <br />
                Non sai da dove iniziare? Prova questo{" "}
                <MuiLink {...demoParquetFileLink}>file dimostrativo</MuiLink>!
            </>
        ),
        column: "colonna",
        density: "densità",
        "download file": "scarica file",
        "resize table": "Ridimensiona"
    },
    UrlInput: {
        load: "Carica"
    },
    CommandBar: {
        ok: "ok"
    },
    formattedDate: {
        past1: ({ divisorKey }) => {
            switch (divisorKey) {
                case "now":
                    return "proprio ora";
                case "second":
                    return "un secondo fa";
                case "minute":
                    return "un minuto fa";
                case "hour":
                    return "un'ora fa";
                case "day":
                    return "ieri";
                case "week":
                    return "la settimana scorsa";
                case "month":
                    return "il mese scorso";
                case "year":
                    return "l'anno scorso";
            }
        },
        pastN: ({ divisorKey }) => {
            switch (divisorKey) {
                case "now":
                    return "proprio ora";
                case "second":
                    return "# secondi fa";
                case "minute":
                    return "# minuti fa";
                case "hour":
                    return "# ore fa";
                case "day":
                    return "# giorni fa";
                case "week":
                    return "# settimane fa";
                case "month":
                    return "# mesi fa";
                case "year":
                    return "# anni fa";
            }
        },
        future1: ({ divisorKey }) => {
            switch (divisorKey) {
                case "now":
                    return "proprio ora";
                case "second":
                    return "tra un secondo";
                case "minute":
                    return "tra un minuto";
                case "hour":
                    return "tra un'ora";
                case "day":
                    return "domani";
                case "week":
                    return "la prossima settimana";
                case "month":
                    return "il prossimo mese";
                case "year":
                    return "il prossimo anno";
            }
        },
        futureN: ({ divisorKey }) => {
            switch (divisorKey) {
                case "now":
                    return "proprio ora";
                case "second":
                    return "tra # secondi";
                case "minute":
                    return "tra # minuti";
                case "hour":
                    return "tra # ore";
                case "day":
                    return "tra # giorni";
                case "week":
                    return "tra # settimane";
                case "month":
                    return "tra # mesi";
                case "year":
                    return "tra # anni";
            }
        },
        singular: ({ divisorKey }) => {
            switch (divisorKey) {
                case "second":
                    return "1 secondo";
                case "minute":
                    return "1 minuto";
                case "hour":
                    return "1 ora";
                case "day":
                    return "1 giorno";
                case "week":
                    return "1 settimana";
                case "month":
                    return "1 mese";
                case "year":
                    return "1 anno";
            }
        },
        plural: ({ divisorKey }) => {
            switch (divisorKey) {
                case "second":
                    return "# secondi";
                case "minute":
                    return "# minuti";
                case "hour":
                    return "# ore";
                case "day":
                    return "# giorni";
                case "week":
                    return "# settimane";
                case "month":
                    return "# mesi";
                case "year":
                    return "# anni";
            }
        }
    },
    CopyToClipboardIconButton: {
        "copied to clipboard": "Copiato!",
        "copy to clipboard": "Copia negli appunti"
    },
    CustomDataGrid: {
        "empty directory": "Questa cartella è vuota",
        "label rows count": ({ count }) => {
            const plural = count > 1 ? "i" : "o";
            return `${count} elemento${plural} selezionato${plural}`;
        },
        "label rows per page": "Elementi per pagina"
    },
    CustomDataGridToolbarDensitySelector: {
        toolbarDensity: "Densità",
        toolbarDensityStandard: "Standard",
        toolbarDensityComfortable: "Confortevole",
        toolbarDensityCompact: "Compatto"
    },
    CustomDataGridToolbarColumnsButton: {
        toolbarColumnsLabel: "Colonne"
    }
    /* spell-checker: enable */
};
