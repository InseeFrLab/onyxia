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
        profile: "Profilo",
        git: "Git",
        k8sCodeSnippets: "Connessione a Kubernetes",
        "user-interface": "Modalità d'interfaccia",
        text1: "Il mio account",
        text2: "Accedi alle diverse informazioni del tuo account.",
        text3: "Configura le tue credenziali, email, password e token di accesso personale direttamente collegati ai tuoi servizi.",
        "personal tokens tooltip": 'O in inglese solo "token".',
        vault: "Vault"
    },
    AccountProfileTab: {
        "account id": "Identificatore dell'account",
        "account id helper":
            "I tuoi identificatori intangibili associati all'identità che usi per accedere alla piattaforma",
        "user id": "ID utente",
        email: "Email",
        "account management": "Gestione account"
    },
    UserProfileForm: {
        "customizable profile": "Profilo personalizzabile",
        "customizable profile helper":
            "Informazioni utili per la configurazione automatica dei tuoi servizi",
        save: "Salva",
        restore: "Ripristina"
    },
    ConfirmNavigationDialog: {
        "you have unsaved changes": "You have unsaved changes!",
        cancel: "Cancel",
        "continue without saving": "Continue without saving"
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
    ConfirmBucketCreationAttemptDialog: {
        "bucket does not exist title": ({ bucket }) => `Il bucket ${bucket} non esiste`,
        "bucket does not exist body": "Vuoi provare a crearlo ora?",
        no: "No",
        yes: "Sì",
        "success title": "Successo",
        "failed title": "Fallito",
        "success body": ({ bucket }) => `Bucket ${bucket} creato con successo.`,
        "failed body": ({ bucket }) => `Creazione di ${bucket} non riuscita.`,
        ok: "Ok"
    },
    ConfirmOverwriteDialog: {
        "dialog title": "Il file esiste già",
        "dialog body": "Vuoi sovrascrivere il file esistente?",
        "no, keep the existing file": "No, mantieni il file esistente",
        "yes, overwrite": "Sì, sovrascrivi"
    },
    ConfirmCustomS3ConfigDeletionDialog: {
        "dialog title":
            "Confermare l'eliminazione della configurazione S3 personalizzata?",
        cancel: "Annulla",
        yes: "Sì"
    },
    DisplayErrorDialog: {
        error: "Errore",
        ok: "Ok"
    },
    S3Explorer: {
        "page header title": "Archiviazione dati",
        "create profile": "Crea profilo",
        back: "Indietro",
        upload: "Carica",
        "create new folder": "Crea nuova cartella"
    },
    S3ShareObjectDialogContainer: {
        "dialog title": "Condividi oggetto"
    },
    S3BookmarksBar: {
        "s3 bookmarks aria label": "Segnalibri S3",
        "show more bookmarks": "Mostra altri segnalibri"
    },
    S3BookmarkItem: {
        "open bookmark": "Apri segnalibro",
        "open bucket": "Apri bucket",
        "bookmark actions": "Azioni segnalibro",
        rename: "Rinomina",
        delete: "Elimina",
        "rename bookmark": "Rinomina segnalibro",
        "delete bookmark": "Elimina segnalibro"
    },
    S3BookmarksEntryPointList: {
        "s3 bookmark entry points aria label": "Punti di accesso ai segnalibri S3",
        bookmarks: "Segnalibri",
        "no bookmarks yet": "Ancora nessun segnalibro.",
        "storage locations": "Posizioni di archiviazione"
    },
    S3DialogCopyField: {
        "generating url": "Generazione URL...",
        copy: "Copia",
        copied: "Copiato"
    },
    S3DialogItemSummary: {
        public: "Pubblico"
    },
    S3ProfileSelect: {
        "select s3 profile aria label": "Seleziona profilo S3",
        "profile settings aria label": "Impostazioni profilo",
        "s3 profiles aria label": "Profili S3",
        "new s3 profile": "Nuovo profilo S3"
    },
    S3SelectionActionBar: {
        download: "Scarica",
        delete: "Elimina",
        "copy s3 uri": "Copia URI S3",
        copied: "Copiato",
        "copy s3 uri tooltip": ({ s3UriStr }) => `Copia "${s3UriStr}"`,
        "add to bookmarks": "Aggiungi ai segnalibri",
        "delete from bookmarks": "Rimuovi dai segnalibri",
        share: "Condividi",
        "make public": "Rendi pubblico",
        "make private": "Rendi privato",
        "one selected": "1 selezionato",
        "many selected": ({ count }) => `${count} selezionati`,
        "clear selection": "Cancella selezione"
    },
    ConfirmAbortUploadDialog: {
        "dialog title": "Annullare il caricamento?",
        "dialog body": "Il caricamento non è completo. Vuoi annullarlo?",
        "continue upload": "Continua caricamento",
        "cancel upload": "Annulla caricamento"
    },
    S3Uploads: {
        "uploading count": ({ count }) =>
            `Caricamento di ${count} elemento${count === 1 ? "" : "i"}...`,
        "upload count": ({ count }) => `${count} caricamento${count === 1 ? "" : "i"}`,
        "expand uploads": "Espandi caricamenti",
        "collapse uploads": "Comprimi caricamenti",
        "close uploads": "Chiudi caricamenti",
        "uploading status": "Caricamento...",
        completed: "Completato",
        error: "Errore",
        "uploaded size of total size": ({ uploadedSize, totalSize }) =>
            `${uploadedSize} di ${totalSize}`,
        of: "di",
        "open uploaded directory": "Apri directory caricata",
        "cancel upload": "Annulla caricamento",
        "retry upload": "Riprova caricamento"
    },
    CustomNoRowsOverlay: {
        "no rows": "Nessuna riga"
    },
    DataTextEditor: {
        "not a valid format": ({ format }) => `Formato non valido: ${format}`,
        format: "Formato",
        "all defaults": "Tutti i valori predefiniti",
        schema: "Schema"
    },
    JsonSchemaDialog: {
        "json schema": "Schema JSON",
        ok: "Ok"
    },
    SelectFormField: {
        "empty string": "(Stringa vuota)"
    },
    CreateOrRenameBookmarkDialog: {
        "dialog title": "Nome del segnalibro",
        "add dialog title": "Aggiungi questa posizione ai segnalibri",
        "rename dialog title": "Rinomina segnalibro",
        "dialog subtitle":
            "Salva questa posizione S3 per accedervi più rapidamente in seguito.",
        "bookmarkName textField label": "Nome",
        "bookmarkName textField empty error":
            "Il nome del segnalibro non può essere vuoto",
        "copy s3 path aria label": "Copia percorso S3",
        cancel: "Annulla",
        ok: "Ok",
        "add to bookmarks": "Aggiungi ai segnalibri",
        "rename bookmark": "Rinomina segnalibro"
    },
    DirectoryCreationDialog: {
        "dialog title": "Crea directory",
        "dialog subtitle":
            "Le directory vengono create rispetto al prefisso attualmente visualizzato.",
        "create prefix dialog title": "Crea prefisso",
        "create prefix dialog subtitle":
            "Crea un nuovo prefisso nella posizione S3 corrente.",
        "directoryName textField label": "Nome della directory",
        "prefixName textField label": "Nome del prefisso",
        "directoryName textField empty error":
            "Il nome della directory non può essere vuoto",
        "directoryName textField duplicate error": "Il nome della directory esiste già",
        cancel: "Annulla",
        create: "Crea",
        "create prefix": "Crea prefisso"
    },
    MakePrefixPublicDialog: {
        "dialog title": "Rendi pubblico il prefisso",
        "make public dialog title": "Rendere pubblico questo prefisso?",
        "make private dialog title": "Rendere privato questo prefisso?",
        "make public dialog body main":
            "Tutti i file in questo prefisso saranno accessibili a chiunque disponga di un link, inclusi i contenuti attuali e futuri.",
        "make public dialog body alternative":
            "Per condividere file specifici o limitare l'accesso nel tempo, crea invece un link di condivisione.",
        "make private dialog body main":
            "Tutti i file in questo prefisso sono accessibili a chiunque disponga di un link, inclusi i contenuti attuali e futuri. Rendere privato questo prefisso rimuove l'accesso pubblico.",
        "make private dialog body alternative":
            "Per condividere file specifici o limitare l'accesso nel tempo, crea invece un link di condivisione.",
        "dialog body": ({ s3Uri, s3UriClassName }) => (
            <>
                Stai per rendere pubblico <span className={s3UriClassName}>{s3Uri}</span>.
                Chiunque potrà elencare e scaricare tutti gli oggetti attuali e futuri in
                questo prefisso.
                <br />
                <br />I link di download che condividi per gli oggetti in questo prefisso
                non scadranno mai.
            </>
        ),
        cancel: "Annulla",
        "make public": "Rendi pubblico",
        "make private": "Rendi privato"
    },
    S3ExplorerMainView: {
        "create prefix dialog title": "Crea prefisso",
        "create prefix dialog subtitle":
            "Crea un nuovo prefisso nella posizione S3 corrente.",
        "prefix name field label": "Nome del prefisso",
        "prefix name empty error": "Il nome del prefisso non può essere vuoto.",
        cancel: "Annulla",
        "create prefix": "Crea prefisso",
        "delete selection dialog title": "Elimina selezione",
        "delete selection dialog subtitle":
            "Questa azione elimina definitivamente gli elementi selezionati.",
        "delete selection dialog body": ({ count }) =>
            `Stai per eliminare ${count} element${count > 1 ? "i" : "o"} selezionat${count > 1 ? "i" : "o"}. Eliminare un prefisso elimina anche tutto il suo contenuto.`,
        delete: "Elimina",
        share: "Condividi",
        download: "Scarica",
        "copy s3 uri": "Copia URI S3",
        copied: "Copiato",
        "copy s3 uri tooltip": ({ s3UriStr }) => `Copia "${s3UriStr}"`,
        "add to bookmarks": "Aggiungi ai segnalibri",
        "delete from bookmarks": "Elimina dai segnalibri",
        "make public": "Rendi pubblico",
        "make private": "Rendi privato",
        folder: "Cartella",
        object: "Oggetto",
        "folder is public": "La cartella è pubblica",
        "folder is private": "La cartella è privata",
        today: "Oggi",
        yesterday: "Ieri",
        "access denied": "Accesso negato",
        "bucket not found": "Bucket non trovato",
        "access denied description":
            "Non hai il permesso di elencare questa posizione S3.",
        "bucket not found description":
            "Il bucket richiesto non esiste o non è raggiungibile con il profilo corrente.",
        "select item": ({ itemName }) => `Seleziona ${itemName}`,
        "select all items": "Seleziona tutti gli elementi",
        public: "Pubblico",
        deleting: "Eliminazione...",
        uploading: "Caricamento",
        "drag and drop to import files": "Trascina e rilascia per importare file",
        "go back": "Indietro",
        "no objects found": "Nessun oggetto trovato",
        "no objects found description": ({ s3UriStr }) =>
            `Non ci sono oggetti con chiave che inizia per "${s3UriStr}".`,
        "this prefix is empty": "Questo prefisso è vuoto",
        "empty prefix description":
            "Carica file o crea una cartella per iniziare a popolare questa posizione.",
        "empty prefix upload description":
            "Carica file qui oppure trascinali e rilasciali in quest'area.",
        "upload files": "Carica file",
        "upload files here": "Carica file qui",
        "drop files here hint":
            "Rilascia file in qualsiasi punto di quest'area per caricarli.",
        "new folder": "Nuova cartella",
        name: "Nome",
        "last modified": "Ultima modifica",
        size: "Dimensione"
    },
    S3ShareObjectDialog: {
        "generating public URL": "Generazione URL pubblico...",
        "copy public URL aria label": "Copia URL pubblico",
        "signed link with time limit": "Link firmato con limite di tempo",
        "signed link validity aria label": "Durata di validità del link firmato",
        "generating signed URL": "Generazione URL firmato...",
        "copy signed URL aria label": "Copia URL firmato",
        "public description":
            "Chiunque disponga dell'URL può accedere a questo oggetto. Il link non scade mai perché l'oggetto si trova in un prefisso pubblico.",
        "signed description":
            "Crea un URL firmato con un periodo di validità limitato. Per condividere un URL che non scade, rendi pubblico uno dei prefissi superiori di questo oggetto.",
        "validity duration one hour": "1 ora",
        "validity duration one day": "1 giorno",
        "validity duration one week": "1 settimana",
        "selected duration": "la durata selezionata"
    },
    S3ProfileDialog: {
        "detail title": "Dettaglio profilo S3",
        "create title": "Nuovo profilo S3 personalizzato",
        "edit title": "Modifica profilo S3 personalizzato",
        "close aria label": "Chiudi finestra profilo S3"
    },
    S3ProfileDetails: {
        "read only": "Sola lettura",
        custom: "Personalizzato",
        edit: "Modifica",
        delete: "Elimina",
        "connection details title": "Dettagli connessione",
        "connection details subtitle":
            "Usa questi valori quando configuri client S3 fuori dall'explorer.",
        "endpoint url label": "URL endpoint",
        "default region label": "Regione predefinita",
        "access credentials title": "Credenziali di accesso",
        "access credentials anonymous subtitle":
            "Questo profilo non espone credenziali. Usa l'accesso S3 anonimo quando il bucket di destinazione lo consente.",
        "access credentials subtitle":
            "Copia il valore richiesto dal client che stai configurando.",
        "access key id label": "ID chiave di accesso",
        "secret access key label": "Chiave di accesso segreta",
        "session token label": "Token di sessione",
        "environment variable": "Variabile d'ambiente",
        "no expiration": "Non è indicata alcuna scadenza per queste credenziali.",
        expires: ({ expirationTime }) => `Scade il ${expirationTime}.`,
        renewing: "Rinnovo...",
        "renew tokens": "Rinnova token",
        "init script title": "Per accedere allo storage fuori dai servizi Datalab",
        "init script subtitle":
            "Scarica o copia lo script di inizializzazione nel linguaggio di programmazione che preferisci.",
        "technology aria label": "Tecnologia",
        download: "Scarica",
        "select s3 profile aria label": "Seleziona profilo S3",
        "s3 profiles aria label": "Profili S3",
        "new s3 profile": "Nuovo profilo S3",
        "copy aria label": ({ what }) => `Copia ${what}`,
        copied: "Copiato",
        copy: "Copia"
    },
    S3ProfileForm: {
        "must be an url": "Inserisci un URL valido.",
        "is required": "Questo campo è obbligatorio.",
        "not a valid access key id": "Inserisci un ID chiave di accesso valido.",
        "profile name already used": "Questo nome profilo è già in uso.",
        "connection details title": "Dettagli connessione",
        "connection details subtitle":
            "Definisci il nome profilo e l'endpoint S3 usati dall'explorer.",
        "profile name label": "Nome profilo",
        "s3 service url label": "URL del servizio S3",
        "s3 service url helper": "Esempio: https://minio.lab.example.net",
        "default region label": "Regione predefinita",
        "default region helper": "Esempio: eu-west-1, se non sai cosa usare lascia vuoto",
        "url style title": "Stile URL",
        "url style subtitle":
            "Specifica come il server S3 formatta gli URL per scaricare i file.",
        "path style": "Stile path",
        "virtual hosted style": "Stile virtual-hosted",
        example: "Esempio",
        "account credentials title": "Credenziali account",
        "account credentials subtitle":
            "Scegli se questo profilo usa accesso anonimo o credenziali esplicite.",
        "anonymous access": "Accesso anonimo",
        "access key id label": "ID chiave di accesso",
        "access key id helper": "Esempio: ASIAIOSFODNN7EXAMPLE",
        "secret access key label": "Chiave di accesso segreta",
        "secret access key helper": "Esempio: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
        "session token label": "Token di sessione",
        "session token helper":
            "Opzionale. Lascia vuoto se le credenziali non includono un token di sessione.",
        cancel: "Annulla",
        "save configuration": "Salva configurazione",
        "create profile": "Crea profilo"
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
                {". \u00a0"}
                <MuiLink {...accountTabLink}>Configurare il tuo Vault CLI locale</MuiLink>
                {"."}
            </>
        )
    },
    SecretsExplorerItem: {
        description: "descrizione"
    },
    SecretsExplorerButtonBar: {
        secret: "segreto",
        rename: "rinominare",
        delete: "eliminare",
        "create secret": "Nuovo segreto",
        "copy path": "Utilizzare nel servizio",
        "create new empty directory": "Nuova cartella",
        refresh: "aggiornare",
        "create what": ({ what }) => `Nuovo ${what}`,
        new: "Nuovo"
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
    Header: {
        login: "Connessione",
        logout: "Disconnessione",
        region: "Regione"
    },
    ProjectSelect: {
        project: "Proggetto"
    },
    LeftBar: {
        reduce: "Ridurre",
        home: "Home",
        account: "Il mio account",
        catalog: "Catalogo di servizi",
        myServices: "I miei servizi",
        mySecrets: "I miei segreti",
        "divider: services features": "Funzioni relative ai servizi",
        "divider: external services features": "Funzioni relative ai servizi esterni",
        "divider: onyxia instance specific features":
            "Funzioni specifiche di questa istanza di Onyxia",
        dataExplorer: "Esploratore di Dati",
        dataCollection: "Esploratore di Collezioni",
        s3Explorer: "Archiviazione dati",
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
        search: "Cercare",
        "title all catalog": "Tutti"
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
        global: "global",
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
        "toggle password visibility": "Alterna la visibilità della password",
        loading: "Caricamento..."
    },
    FormFieldGroupComponent: {
        add: "Aggiungi"
    },
    AutoInjectSwitch: {
        tooltip: ({ isAutoInjected }) => (
            <>
                Se abilitata, questa configurazione verrà automaticamente iniettata nei
                tuoi servizi. Puoi comunque aggiungerla manualmente durante l'avvio di un
                servizio, anche se questa opzione è disabilitata.
                <br />
                <br />
                Stato attuale:{" "}
                <strong>{isAutoInjected ? "abilitato" : "disabilitato"}</strong>
            </>
        )
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
            "I nuovi log vengono visualizzati in tempo reale",
        follow: "Segui"
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
        ),
        close: "Chiudi"
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
        "trash my own": "Eliminare tutti i miei servizi.",
        events: "Eventi"
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
        "remove bookmark": "Eliminare",
        "move down": "Sposta in basso",
        "move up": "Sposta in alto",
        "move to top": "Sposta all'inizio",
        "move to bottom": "Sposta alla fine"
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
        "resize table": "Ridimensiona",
        "unsupported file type": ({ supportedFileTypes }) =>
            `Formato dati non supportato. I tipi supportati sono: ${supportedFileTypes.join(", ")}.`,
        "no s3 client":
            "Nessun client S3 configurato. Vai nelle impostazioni per abilitarne uno per l’esploratore.",
        "unsupported protocol":
            "URL non supportato. I protocolli supportati sono https:// e s3://.",
        "https fetch error": "Impossibile recuperare il file HTTPS.",
        "query error": "Errore di query DuckDB."
    },
    UrlInput: {
        load: "Carica",
        reset: "Svuotare",
        "data source": "Origine dati"
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
    },
    DatasetCard: {
        publishedOn: "Pubblicato il",
        datasetPage: "Pagina del dataset",
        license: "Licenza:",
        format: "Formato",
        size: "Dimensione",
        distributions: "Distribuzioni",
        visualize: "Visualizza",
        unknown: "Sconosciuto"
    },
    DataCollection: {
        "page header help title":
            "Inserisci semplicemente l'URL https:// del tuo schema DCAT JSON-LD",
        "page header title": "Catalogo dati",
        "page header help content": ({ demoCatalogLink }) => (
            <>
                Inserisci semplicemente l'URL <code>https://</code> di un catalogo dati
                per visualizzarne l'anteprima.
                <br />
                Non sai da dove iniziare? Prova questo{" "}
                <MuiLink {...demoCatalogLink}>catalogo dimostrativo</MuiLink>!
            </>
        ),
        "https fetch error": "Impossibile recuperare la risorsa HTTPS.",
        "invalid json response": "La risposta non è un JSON valido.",
        "json-ld compact error": "Impossibile compattare la risposta JSON-LD.",
        "json-ld frame error": "Impossibile applicare il frame alla risposta JSON-LD.",
        "datasets parsing error": "Impossibile analizzare i dataset del catalogo."
    },
    S3UriBar: {
        explore: "Esplora..",
        "copy s3 path": "Copia percorso S3",
        copied: "Copiato",
        "copied path": ({ s3Uri }) => `Percorso copiato: ${s3Uri}`,
        "add to bookmarks": "Aggiungi ai segnalibri",
        "delete from bookmarks": "Elimina dai segnalibri",
        "pinned storage location": "Posizione di archiviazione fissata",
        bookmarked: "Nei segnalibri",
        "edit s3 uri": "Modifica URI S3",
        prefix: "Prefisso",
        "admin bookmark": "Segnalibro amministratore",
        bookmark: "Segnalibro",
        object: "Oggetto",
        public: "Pubblico",
        "go to s3 uri": ({ s3Uri, isPublic }) =>
            `${isPublic ? "Pubblico. " : ""}Vai a ${s3Uri}`,
        "s3 uri": "S3 URI",
        "edit from s3 root": "Modifica dalla radice S3",
        "edit object key": "Modifica chiave dell'oggetto",
        "object key": "Chiave dell'oggetto",
        listing: "Elenco..."
    }
};
