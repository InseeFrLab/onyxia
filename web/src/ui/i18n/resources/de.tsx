import type { Translations } from "../types";
import MuiLink from "@mui/material/Link";
import { Markdown } from "ui/shared/Markdown";
import { Icon } from "onyxia-ui/Icon";
import { getIconUrlByName } from "lazy-icons";
import { capitalize } from "tsafe/capitalize";
import { MaybeLink } from "ui/shared/MaybeLink";

export const translations: Translations<"de"> = {
    /* spell-checker: disable */
    Account: {
        profile: "Profil",
        git: undefined,
        storage: "Verbindung zum Speicher",
        k8sCodeSnippets: "Verbindung zu Kubernetes",
        "user-interface": "Konfiguration der Benutzeroberfläche",
        text1: "Mein Konto",
        text2: "Greifen Sie auf Ihre verschiedenen Kontoinformationen zu.",
        text3: "Konfigurieren Sie Ihre persönlichen Logins, E-Mails, Passwörter und persönlichen Zugriffstoken, die direkt mit Ihren Diensten verbunden sind.",
        "personal tokens tooltip": 'Oder auf Englisch "Token".',
        vault: "Vault"
    },
    AccountProfileTab: {
        "account id": "Kontoidentifikator",
        "account id helper":
            "Ihre immateriellen Kennungen, die mit der Identität verknüpft sind, mit der Sie sich auf der Plattform anmelden",
        "user id": "Benutzer-ID",
        email: "E-Mail",
        "account management": "Kontoverwaltung"
    },
    UserProfileForm: {
        "customizable profile": "Anpassbares Profil",
        "customizable profile helper":
            "Nützliche Informationen für die automatische Konfiguration Ihrer Dienste",
        save: "Speichern",
        restore: "Wiederherstellen"
    },
    ConfirmNavigationDialog: {
        "you have unsaved changes": "Sie haben ungespeicherte Änderungen!",
        cancel: "Abbrechen",
        "continue without saving": "Ohne Speichern fortfahren"
    },
    AccountGitTab: {
        gitName: "Benutzername für Git",
        "gitName helper text": ({ gitName, focusClassName }) => (
            <>
                Dieser Befehl legt Ihren globalen Git-Benutzernamen fest und wird beim
                Start des Dienstes ausgeführt:&nbsp;
                <code className={focusClassName}>
                    git config --global user.name "{gitName || "<Ihr_Benutzername>"}"
                </code>
            </>
        ),
        gitEmail: "E-Mail für Git",
        "gitEmail helper text": ({ gitEmail, focusClassName }) => (
            <>
                Dieser Befehl legt Ihre globale Git-E-Mail-Adresse fest und wird beim
                Start des Dienstes ausgeführt:&nbsp;
                <code className={focusClassName}>
                    git config --global user.email "
                    {gitEmail || "<ihre_email@domain.com>"}"
                </code>
            </>
        ),
        githubPersonalAccessToken: "Persönlicher Zugangstoken für Git-Plattform",
        "githubPersonalAccessToken helper text": ({ focusClassName }) => (
            <>
                Durch Bereitstellen dieses Tokens können Sie ohne erneute Eingabe Ihrer
                Plattform-Anmeldedaten auf Ihre privaten GitHub- oder GitLab-Repositories
                zugreifen und Änderungen vornehmen.
                <br />
                Dieser Token ist auch als Umgebungsvariable verfügbar:&nbsp;
                <span className={focusClassName}>$GIT_PERSONAL_ACCESS_TOKEN</span>
            </>
        )
    },
    AccountStorageTab: {
        "credentials section title": "Verbinden Sie Ihre Daten mit Ihren Diensten",
        "credentials section helper":
            "MinIO-objektbasierter Speicher, kompatibel mit Amazon (AWS S3). Diese Informationen sind bereits automatisch eingetragen.",
        "accessible as env": "In Ihren Diensten als Umgebungsvariable verfügbar",
        "init script section title":
            "Zugriff auf den Speicher außerhalb der Datalab-Dienste",
        "init script section helper": `Laden Sie das Initialisierungsskript in der Programmiersprache Ihrer Wahl herunter.`,
        "expires in": ({ howMuchTime }) => `Läuft in ${howMuchTime} ab`
    },
    AccountKubernetesTab: {
        "credentials section title": "Verbindung zum Kubernetes-Cluster herstellen",
        "credentials section helper":
            "Anmeldedaten zur direkten Interaktion mit dem Kubernetes-API-Server.",
        "init script section title": "Shell-Skript",
        "init script section helper": ({ installKubectlUrl }) => (
            <>
                Dieses Skript ermöglicht die Verwendung von kubectl oder helm auf Ihrem
                lokalen Rechner. <br />
                Um es zu verwenden,{" "}
                <MuiLink href={installKubectlUrl} target="_blank">
                    installieren Sie einfach kubectl auf Ihrer Maschine
                </MuiLink>{" "}
                und führen Sie das Skript aus, indem Sie es in Ihr Terminal kopieren und
                einfügen.
                <br />
                Nachdem Sie dies getan haben, können Sie die Funktion mit den
                Befehlen&nbsp;
                <code>kubectl get pods</code> oder <code>helm list</code> bestätigen
            </>
        ),
        "expires in": ({ howMuchTime }) =>
            `Diese Anmeldedaten sind für die nächsten ${howMuchTime} gültig`
    },
    AccountVaultTab: {
        "credentials section title": "Vault-Anmeldeinformationen",
        "credentials section helper": ({ vaultDocHref, mySecretLink }) => (
            <>
                <MuiLink href={vaultDocHref} target="_blank">
                    Vault
                </MuiLink>{" "}
                ist das System, in dem &nbsp;
                <MuiLink {...mySecretLink}>ihre Geheimnisse</MuiLink> gespeichert sind.
            </>
        ),
        "init script section title": "Verwenden Sie Vault von Ihrem Terminal aus",
        "init script section helper": ({ vaultCliDocLink }) => (
            <>
                Laden Sie die <code>ENV</code>-Variablen herunter oder kopieren Sie sie,
                um ihre lokale{" "}
                <MuiLink href={vaultCliDocLink} target="_blank">
                    Vault CLI
                </MuiLink>{" "}
                zu konfigurieren.
            </>
        ),
        "expires in": ({ howMuchTime }) => `Das Token läuft in ${howMuchTime} ab`
    },
    ProjectSettings: {
        "page header title": "Projekteinstellungen",
        "page header help title": ({ groupProjectName }) =>
            groupProjectName === undefined
                ? "Einstellungen Ihres persönlichen Projekts"
                : `Einstellungen für "${groupProjectName}"`,
        "page header help content": ({
            groupProjectName,
            doesUserBelongToSomeGroupProject
        }) => (
            <>
                Diese Seite ermöglicht es Ihnen, die Einstellungen zu konfigurieren, die
                auf
                {groupProjectName === undefined
                    ? " Ihr persönliches Projekt"
                    : ` das ${groupProjectName}`}{" "}
                angewendet werden.
                <br />
                {groupProjectName !== undefined && (
                    <>
                        Beachten Sie, dass {groupProjectName} ein Gruppenprojekt ist, das
                        mit anderen Benutzern geteilt wird; die hier vorgenommenen
                        Änderungen gelten für alle Mitglieder des Projekts.
                        <br />
                    </>
                )}
                {doesUserBelongToSomeGroupProject && (
                    <>
                        Sie können zwischen Ihren Projekten wechseln, indem Sie das
                        Dropdown-Menü in der Kopfzeile verwenden.
                        <br />
                    </>
                )}
                Beachten Sie, dass nur Ihr Onyxia-Instanzadministrator neue Projekte
                erstellen kann.
            </>
        ),
        "security-info": "Sicherheitsinformationen",
        "s3-configs": "S3-Konfigurationen"
    },
    ProjectSettingsS3ConfigTab: {
        "add custom config": "Eine benutzerdefinierte S3-Konfiguration hinzufügen"
    },
    S3ConfigCard: {
        "data source": "Datenquelle",
        credentials: "Anmeldedaten",
        "sts credentials":
            "Dynamisch angeforderte Tokens in Ihrem Auftrag von Onyxia (STS)",
        account: "Konto",
        "use in services": "In Diensten verwenden",
        "use in services helper": `Wenn aktiviert, wird diese Konfiguration standardmäßig in Ihren Diensten verwendet, die eine S3-Integration implementieren.`,
        "use for onyxia explorers": "Für Onyxia-Explorer verwenden",
        "use for onyxia explorers helper": `Wenn aktiviert, wird diese Konfiguration vom Datei-Explorer und dem Daten-Explorer verwendet.`,
        edit: "Bearbeiten",
        delete: "Löschen"
    },
    AddCustomS3ConfigDialog: {
        "dialog title": "Neue benutzerdefinierte S3-Konfiguration",
        "dialog subtitle":
            "Geben Sie ein benutzerdefiniertes Dienstkonto an oder verbinden Sie sich mit einem anderen S3-kompatiblen Dienst",
        cancel: "Abbrechen",
        "save config": "Konfiguration speichern",
        "update config": "Konfiguration aktualisieren",
        "is required": "Dieses Feld ist erforderlich",
        "must be an url": "Keine gültige URL",
        "not a valid access key id":
            "Das sieht nicht nach einer gültigen Zugangsschlüssel-ID aus",
        "url textField label": "URL",
        "url textField helper text": "URL des S3-Dienstes",
        "region textField label": "AWS S3-Region",
        "region textField helper text": "Beispiel: eu-west-1, wenn unsicher, leer lassen",
        "workingDirectoryPath textField label": "Arbeitsverzeichnispfad",
        "workingDirectoryPath textField helper text": (
            <>
                Hiermit können Sie den Bucket und das S3-Objektprefix angeben, das Sie im
                S3-Dienst besitzen. <br />
                Beispiel: <code>mein-bucket/mein-präfix/</code> oder{" "}
                <code>nur mein-bucket/</code> wenn Sie den ganzen Bucket besitzen.
            </>
        ),
        "account credentials": "Kontozugangsdaten",
        "friendlyName textField label": "Konfigurationsname",
        "friendlyName textField helper text":
            "Dies hilft Ihnen nur, diese Konfiguration zu identifizieren. Beispiel: Mein AWS-Bucket",
        "isAnonymous switch label": "Anonymer Zugang",
        "isAnonymous switch helper text":
            "Auf EIN stellen, wenn kein geheimer Zugangsschlüssel erforderlich ist",
        "accessKeyId textField label": "Zugangsschlüssel-ID",
        "accessKeyId textField helper text": "Beispiel: 1A2B3C4D5E6F7G8H9I0J",
        "secretAccessKey textField label": "Geheimer Zugangsschlüssel",
        "sessionToken textField label": "Sitzungstoken",
        "sessionToken textField helper text": "Optional, leer lassen, wenn unsicher",
        "url style": "URL-Stil",
        "url style helper text": `Geben Sie an, wie Ihr S3-Server die URL für das Herunterladen von Dateien formatiert.`,
        "path style label": ({ example }) => (
            <>
                Pfadstil
                {example !== undefined && (
                    <>
                        :&nbsp;
                        <code>{example}meine-daten.parquet</code>
                    </>
                )}
            </>
        ),
        "virtual-hosted style label": ({ example }) => (
            <>
                Virtual-hosted-Stil
                {example !== undefined && (
                    <>
                        :&nbsp;
                        <code>{example}meine-daten.parquet</code>
                    </>
                )}
            </>
        )
    },
    TestS3ConnectionButton: {
        "test connection": "Verbindung testen",
        "test connection failed": ({ errorMessage }) => (
            <>
                Verbindungstest fehlgeschlagen mit Fehler: <br />
                {errorMessage}
            </>
        )
    },
    AccountUserInterfaceTab: {
        title: "Konfiguration der Benutzeroberfläche",
        "enable dark mode": "Dunkelmodus aktivieren",
        "dark mode helper":
            "Benutzeroberfläche mit geringer Helligkeit und dunklem Hintergrund.",
        "enable beta": "Betatester-Modus aktivieren",
        "beta mode helper":
            "Für erweiterte Konfigurationen und Funktionen der Plattform.",
        "enable dev mode": "Entwickleroptionen aktivieren",
        "dev mode helper":
            "Aktivieren Sie die Funktionen, die sich noch in der Entwicklung befinden",
        "Enable command bar": "Befehlsleiste aktivieren",
        "Enable command bar helper": ({ imgUrl }) => (
            <>
                Die{" "}
                <MuiLink href={imgUrl} target="_blank">
                    Befehlsleiste
                </MuiLink>{" "}
                gibt Ihnen einen Einblick in die Befehle, die in Ihrem Namen ausgeführt
                werden, wenn Sie mit der Benutzeroberfläche interagieren.
            </>
        )
    },
    SettingField: {
        "copy tooltip": "In die Zwischenablage kopieren",
        language: "Sprache ändern",
        "service password": "Standarddienstpasswort",
        "service password helper text": ({ groupProjectName }) => (
            <>
                Dies ist das Standardpasswort, das verwendet wird, um Ihre laufenden
                Dienste zu schützen. <br />
                Wenn Sie einen Dienst starten, wird das Passwortfeld im Sicherheitstab
                automatisch mit diesem Passwort ausgefüllt. <br />
                Ein Klick auf das{" "}
                <Icon size="extra small" icon={getIconUrlByName("Refresh")} /> Symbol
                generiert ein neues zufälliges Passwort. Beachten Sie jedoch, dass es das
                Passwort für bereits laufende Dienste nicht aktualisiert. <br />
                Das Dienstpasswort ist das, was Onyxia Sie auffordert, in Ihre
                Zwischenablage zu kopieren, bevor Sie auf einen laufenden Dienst
                zugreifen. <br />
                {groupProjectName !== undefined && (
                    <>
                        Bitte beachten Sie, dass dieses Passwort unter allen Mitgliedern
                        des Projekts ({groupProjectName}) geteilt wird.
                    </>
                )}
            </>
        ),
        "not yet defined": "Noch nicht definiert",
        "reset helper dialogs": "Hilfsdialoge zurücksetzen",
        reset: "Zurücksetzen",
        "reset helper dialogs helper text":
            "Die Hilfsdialoge zurücksetzen, die Sie aufgefordert haben, nicht mehr anzuzeigen"
    },
    FileExplorerEntry: {
        "page title - file explorer": "Datei-Explorer",
        "what this page is used for - file explorer": "Speichern Sie hier Ihre Dateien.",
        "help content": ({ accountTabLink, docHref }) => (
            <>
                Lesen Sie
                <MuiLink href={docHref} target="_blank">
                    unsere Dokumentation
                </MuiLink>
                . &nbsp;
                <MuiLink {...accountTabLink}>MinIO-Clients konfigurieren</MuiLink>.
            </>
        ),
        "title personal": "Meine Daten",
        "description personal": "Ihre eigenen Dateien und Datensätze.",
        "title project": ({ projectName }) => `Projekt ${projectName}`,
        "description project": ({ projectName }) =>
            `Gemeinsamer Speicherplatz für das Projekt ${projectName}`,
        tags: ({ type }) => {
            switch (type) {
                case "personal":
                    return "Meine Daten";
                case "project":
                    return "Gruppendaten";
            }
        }
    },
    S3EntryCard: {
        "space path": "Pfad des Bereichs"
    },
    FileExplorerDisabledDialog: {
        "dialog title": "Kein S3-Server konfiguriert",
        "dialog body":
            "Für diese Instanz ist kein S3-Server konfiguriert. Sie können jedoch manuell einen hinzufügen, um den S3-Dateiexplorer zu aktivieren.",
        cancel: "Abbrechen",
        "go to settings": "Zu den Einstellungen gehen"
    },
    ConfirmBucketCreationAttemptDialog: {
        "bucket does not exist title": ({ bucket }) =>
            `Der Bucket ${bucket} existiert nicht`,
        "bucket does not exist body": "Möchten Sie jetzt versuchen, ihn zu erstellen?",
        no: "Nein",
        yes: "Ja",
        "success title": "Erfolg",
        "failed title": "Fehlgeschlagen",
        "success body": ({ bucket }) => `Bucket ${bucket} wurde erfolgreich erstellt.`,
        "failed body": ({ bucket }) => `Bucket ${bucket} konnte nicht erstellt werden.`,
        ok: "Ok"
    },
    ShareDialog: {
        title: "Ihre Daten teilen",
        close: "Schließen",
        "create and copy link": "Link erstellen und kopieren",
        "paragraph current policy": ({ isPublic }) =>
            isPublic
                ? "Ihre Datei ist öffentlich, jeder mit dem Link kann sie herunterladen."
                : "Ihre Datei ist derzeit privat.",
        "paragraph change policy": ({ isPublic }) =>
            isPublic
                ? "Um den Zugriff einzuschränken, ändern Sie den Freigabestatus Ihrer Datei."
                : "Um Ihre Datei freizugeben und Zugriff zu gewähren, ändern Sie den Freigabestatus oder erstellen Sie einen temporären Zugriffslink.",

        "hint link access": params =>
            params.isPublic
                ? "Ihr Link ist verfügbar, solange die Datei öffentlich ist"
                : `Dieser Link gewährt für ${params.expiration} Zugriff auf Ihre Daten.`,
        "label input link": "Zugriffslink"
    },
    SelectTime: {
        "validity duration label": "Gültigkeitsdauer"
    },
    MySecrets: {
        "page title - my secrets": "Meine Geheimnisse",
        "what this page is used for - my secrets":
            "Speichern Sie hier Geheimnisse, die in Form von Umgebungsvariablen in Ihren Diensten verfügbar sein werden.",
        "learn more - my files":
            "Erfahren Sie mehr über die Verwendung des S3-Speichers,",
        "help content": ({ accountTabLink, docHref }) => (
            <>
                Lesen Sie
                <MuiLink href={docHref} target="_blank">
                    unsere Dokumentation
                </MuiLink>
                . &nbsp;
                <MuiLink {...accountTabLink}>
                    Ihren lokalen Vault CLI konfigurieren
                </MuiLink>
                .
            </>
        )
    },
    ExplorerItem: {
        description: "Beschreibung"
    },
    SecretsExplorerItem: {
        description: "Beschreibung"
    },
    ExplorerButtonBar: {
        file: "Datei",
        delete: "löschen",
        "download directory": "Herunterladen",
        "upload file": "Datei hochladen",
        "copy path": "Den S3-Objektnamen kopieren",
        "create new empty directory": "Neues Verzeichnis",
        refresh: "aktualisieren",
        new: "Neu",
        share: "Teilen",
        "alt list view": "Liste anzeigen",
        "alt block view": "Blockansicht anzeigen"
    },
    ExplorerDownloadSnackbar: {
        "download preparation": "Vorbereitung des Downloads ..."
    },
    SecretsExplorerButtonBar: {
        secret: "Geheimnis",
        rename: "umbenennen",
        delete: "löschen",
        "create secret": "Neues Geheimnis",
        "copy path": "Im Dienst verwenden",
        "create new empty directory": "Neues Verzeichnis",
        refresh: "aktualisieren",
        "create what": ({ what }) => `Neu ${what}`,
        new: "Neu"
    },
    Explorer: {
        file: "Datei",
        secret: "Geheimnis",
        create: "erstellen",
        cancel: "abbrechen",
        delete: "löschen",
        "do not display again": "Nicht mehr anzeigen",
        "untitled what": ({ what }) => `${what}_namenlos`,
        directory: "Verzeichnis",
        multiple: "Elemente",
        "deletion dialog title": ({ deleteWhat, isPlural }) =>
            `Möchten Sie ${isPlural ? "mehrere" : "ein"} ${deleteWhat} löschen?`,
        "deletion dialog body": ({ deleteWhat, isPlural }) => `
        Sie sind dabei, ${isPlural ? "mehrere" : "ein"} ${deleteWhat} zu löschen.
        Diese Aktion könnte zum Verlust der mit ${isPlural ? "diesen" : "diesem"} ${deleteWhat} verbundenen Daten führen.
        `,
        "already a directory with this name":
            "Es gibt bereits ein Verzeichnis mit diesem Namen",
        "can't be empty": "Darf nicht leer sein",
        "new directory": "Neues Verzeichnis"
    },
    ListExplorerItems: {
        "header name": "Name",
        "header modified date": "Geändert",
        "header size": "Größe",
        "header policy": "Richtlinie"
    },
    SecretsExplorer: {
        file: "Datei",
        secret: "Geheimnis",
        cancel: "abbrechen",
        delete: "löschen",
        "do not display again": "Nicht mehr anzeigen",
        "untitled what": ({ what }) => `${what}_namenlos`,
        directory: "Verzeichnis",
        "deletion dialog title": ({ deleteWhat }) => `Einen ${deleteWhat} löschen?`,
        "deletion dialog body": ({ deleteWhat }) => `
            Sie sind dabei, einen ${deleteWhat} zu löschen.
            Dies kann den potentiellen Verlust von Daten, die mit diesem ${deleteWhat} verbunden sind, zur Folge haben.
            `,
        "already a directory with this name":
            "Es gibt bereits ein Verzeichnis mit diesem Namen",
        "can't be empty": "Darf nicht leer sein",
        create: "Erstellen",
        "new directory": "Neues Verzeichnis"
    },
    ExplorerItems: {
        "empty directory": "Dieses Verzeichnis ist leer"
    },
    SecretsExplorerItems: {
        "empty directory": "Dieses Verzeichnis ist leer"
    },
    MySecretsEditor: {
        "do not display again": "Nicht mehr anzeigen",
        "add an entry": "Einen Variable hinzufügen",
        "environnement variable default name": "NEUE_UMGEBUNGSVAR",
        "table of secret": "Geheimliste",
        "key column name": "Variablenname",
        "value column name": "Variablenwert",
        "unavailable key": "Bereits vergeben",
        "invalid key empty string": "Ein Name ist erforderlich",
        "invalid key _ not valid": "Darf nicht nur _ sein",
        "invalid key start with digit": "Darf nicht mit einer Zahl beginnen",
        "invalid key invalid character": "Ungültiges Zeichen",
        "use this secret": "In einem Service verwenden",
        "use secret dialog title": "In einem Service verwenden",
        "use secret dialog subtitle": "Der Pfad des Geheimnisses wurde kopiert.",
        "use secret dialog body": `
                Wenn Sie einen Service starten (RStudio, Jupyter), gehen Sie zum
                'VAULT'-Tab und fügen Sie den Pfad des Geheimnisses in das dafür vorgesehene Feld ein.
                Ihre Schlüsselwerte werden als Umgebungsvariablen verfügbar sein.
            `,
        "use secret dialog ok": "Verstanden"
    },
    MySecretsEditorRow: {
        "key input desc": "Name der Umgebungsvariable",
        "value input desc": "Wert der Umgebungsvariable"
    },
    ExplorerUploadModalDropArea: {
        "browse files": "Durchsuchen Sie Ihre Dateien",
        "drag and drop or": "Drag & Drop oder"
    },
    ExplorerUploadProgress: {
        over: "über",
        importing: "derzeit importieren"
    },
    ExplorerUploadModal: {
        "import files": "Dateien importieren",
        cancel: "Abbrechen",
        minimize: "Minimieren"
    },
    Header: {
        login: "Login",
        logout: "Logout",
        project: "Projekt",
        region: "Region"
    },
    LeftBar: {
        reduce: "Reduzieren",
        home: "Startseite",
        account: "Mein Konto",
        projectSettings: "Projekteinstellungen",
        catalog: "Servicekatalog",
        myServices: "Meine Dienste",
        mySecrets: "Meine Geheimnisse",
        myFiles: "Meine Dateien",
        "divider: services features": "Funktionen im Zusammenhang mit Diensten",
        "divider: external services features":
            "Funktionen im Zusammenhang mit externen Diensten",
        "divider: onyxia instance specific features":
            "Funktionen spezifisch für diese Onyxia-Instanz",
        dataExplorer: "Daten-Explorer",
        fileExplorer: "Datei-Explorer",
        dataCollection: "Sammlungs-Explorer",
        sqlOlapShell: "SQL OLAP-Shell"
    },
    AutoLogoutCountdown: {
        "are you still there": "Sind Sie noch da?",
        "you'll soon be automatically logged out":
            "Sie werden bald automatisch abgemeldet."
    },
    Page404: {
        "not found": "Seite nicht gefunden"
    },
    PortraitModeUnsupported: {
        instructions:
            "Um diese App auf Ihrem Handy zu nutzen, aktivieren Sie bitte den Rotationssensor und drehen Sie Ihr Telefon."
    },
    MaybeAcknowledgeConfigVolatilityDialog: {
        "dialog title": "Beachten Sie, dass Konfigurationen flüchtig sind",
        "dialog body": `Diese Onyxia-Instanz implementiert keinen Persistenzmechanismus zum Speichern von Konfigurationen.
            Alle Konfigurationen werden im lokalen Speicher des Browsers gespeichert. Das bedeutet, dass Sie alle Ihre Konfigurationen verlieren werden, 
            wenn Sie den lokalen Speicher Ihres Browsers löschen oder Ihren Browser wechseln.`,
        "do not show next time": "Diese Nachricht nicht mehr anzeigen",
        cancel: "Abbrechen",
        "I understand": "Ich verstehe"
    },
    Home: {
        "title authenticated": ({ userFirstname }) => `Willkommen ${userFirstname}!`,
        title: "Willkommen im Datalab",
        login: "Login",
        "new user": "Neuer Datalab User?",
        subtitle:
            "Arbeiten Sie mit Python oder R und haben Sie die benötigte Rechenleistung!",
        cardTitle1: "Eine ergonomische Umgebung und Dienstleistungen auf Abruf",
        cardTitle2: "Eine aktive und begeisterte Gemeinschaft steht Ihnen zur Verfügung",
        cardTitle3:
            "Ein schneller, flexibler und online verfügbarer Datenspeicherbereich",
        cardText1:
            "Analysieren Sie Daten, führen Sie verteilte Berechnungen durch und nutzen Sie einen umfangreichen Katalog von Diensten. Reservieren Sie die benötigte Rechenleistung.",
        cardText2:
            "Nutzen und teilen Sie Ressourcen, die Ihnen zur Verfügung stehen: Tutorials, Trainings und Kommunikationskanäle.",
        cardText3:
            "Greifen Sie leicht auf Ihre Daten und die Ihnen zur Verfügung gestellten Daten von Ihren Programmen aus zu - S3 API-Implementierung.",
        cardButton1: "Katalog anschauen",
        cardButton2: "Der Community beitreten",
        cardButton3: "Daten anzeigen"
    },
    Catalog: {
        header: "Dienstkatalog",
        "no result found": ({ forWhat }) => `Keine Ergebnisse gefunden für ${forWhat}`,
        "search results": "Suchergebnisse",
        search: "Suchen",
        "title all catalog": "Alle"
    },
    CatalogChartCard: {
        launch: "Starten",
        "learn more": "Mehr erfahren"
    },
    CatalogNoSearchMatches: {
        "no service found": "Dienst nicht gefunden",
        "no result found": ({ forWhat }) => `Keine Ergebnisse gefunden für ${forWhat}`,
        "check spelling": `Überprüfen Sie die Schreibweise des Dienstnamens oder versuchen Sie, Ihre Suche zu erweitern.`,
        "go back": "Zurück zu den Hauptdiensten"
    },
    Launcher: {
        sources: ({
            helmChartName,
            helmChartRepositoryName,
            labeledHelmChartSourceUrls
        }) => (
            <>
                Das Helm-Chart{" "}
                {
                    <MaybeLink href={labeledHelmChartSourceUrls.helmChartSourceUrl}>
                        {helmChartName}
                    </MaybeLink>
                }{" "}
                gehört zum Helm-Chart-Repository{" "}
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
                        Es basiert auf dem Docker-Image{" "}
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
        "download as script": "Als Skript herunterladen",
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
            >{`Wir haben die Befehlsleiste so gestaltet, dass Sie die Kontrolle über Ihre Kubernetes-Bereitstellungen übernehmen können.
Was Sie wissen müssen:

#### Was sind diese Helm-Befehle?

Diese Befehle sind die genauen Helm-Befehle, die die Onyxia-API in Ihrem Namen in Ihrem Kubernetes-Namespace ausführen wird.
Dies ermöglicht es Ihnen, zu verstehen, was im Hintergrund passiert, wenn Sie mit der Benutzeroberfläche interagieren.

#### Echtzeit-Aktualisierungen

Wenn Sie mit der Benutzeroberfläche interagieren, werden die Helm-Befehle automatisch aktualisiert, um widerzuspiegeln, was Sie tun.

#### Warum sollte mich das interessieren?

- **Transparenz:** Wir glauben, dass Sie das Recht haben zu wissen, welche Aktionen in Ihrer Umgebung durchgeführt werden.
- **Lernen:** Das Verstehen dieser Befehle kann Einblicke in Kubernetes und Helm geben und Ihr Wissen vertiefen.
- **Manuelle Ausführung:** Sie können diese Befehle in ein Terminal mit Schreibzugriff auf Kubernetes kopieren und einfügen, um den Dienst manuell zu starten.

#### Wie kann ich diese Befehle manuell ausführen?

${
    k8CredentialsHref === undefined
        ? ""
        : "Es gibt zwei Möglichkeiten, diese Befehle auszuführen:  "
}

${
    k8CredentialsHref === undefined
        ? ""
        : `
- **Lokales Terminal:** Gehen Sie zu [\`Mein Konto -> Kubernetes-Tab\`](${k8CredentialsHref}).
  Hier finden Sie die Anmeldeinformationen, die es Ihnen ermöglichen, Befehle in Ihrem Kubernetes-Namespace von Ihrem lokalen Terminal aus auszuführen.
`
}

- Wenn diese Onyxia-Instanz Dienste wie VSCode oder Jupyter anbietet, können Sie ein Terminal in diesen Diensten öffnen und dort Befehle ausführen.
  Für konstruktive oder destruktive Befehle müssen Sie Ihren Dienst mit der Kubernetes-Rolle \`admin\` oder \`edit\` starten.

Durch die manuelle Ausführung des Befehls können Sie den Dienst weiterhin auf der [\`Meine Dienste\`](${myServicesHref}) Seite sehen, als ob er über die Benutzeroberfläche gestartet wurde.

Sie können die Befehlsleiste im [\`Mein Konto -> Benutzeroberfläche Einstellungen Tab\`](${interfacePreferenceHref}) deaktivieren.

Fühlen Sie sich frei, Ihre Kubernetes-Bereitstellungen zu erkunden und die Kontrolle zu übernehmen!
        `}</Markdown>
        ),
        form: "Formular",
        editor: "Texteditor"
    },
    AcknowledgeSharingOfConfigConfirmDialog: {
        "acknowledge sharing of config confirm dialog title":
            "Beachten Sie, Konfigurationen werden geteilt",
        "acknowledge sharing of config confirm dialog subtitle": ({
            groupProjectName
        }) => `Wenn Sie diese Konfiguration speichern,
        wird jedes Mitglied des Projekts ${groupProjectName} in der Lage sein, es zu starten.`,
        "acknowledge sharing of config confirm dialog body": `Obwohl keine persönlichen Informationen automatisch von Onyxia eingefügt wurden,
        achten Sie darauf, keine sensiblen Informationen in der wiederherstellbaren Konfiguration zu teilen.`,
        cancel: "Abbrechen",
        "i understand, proceed": "Ich verstehe, fortfahren"
    },
    AutoLaunchDisabledDialog: {
        ok: "Ok",
        "auto launch disabled dialog title": "Automatisches Starten deaktiviert",
        "auto launch disabled dialog body": (
            <>
                <b>WARNUNG</b>: Möglicherweise versucht jemand, Sie dazu zu verleiten, ein
                zu starten Dienst, der die Integrität Ihres Namespace gefährden könnte.{" "}
                <br />
                Bitte überprüfen Sie die Dienstkonfiguration sorgfältig, bevor Sie sie
                starten. <br />
                Im Zweifelsfall wenden Sie sich bitte an Ihren Administrator.
            </>
        )
    },
    FormFieldWrapper: {
        "reset to default": "Zurücksetzen auf Standardwert"
    },
    ConfigurationTopLevelGroup: {
        miscellaneous: "Verschiedenes",
        "Configuration that applies to all charts":
            "Konfiguration, die für alle Diagramme gilt",
        "Top level configuration values": "Konfigurationswerte auf oberster Ebene"
    },
    YamlCodeBlockFormField: {
        "not an array": "Ein Array wird erwartet",
        "not an object": "Ein Objekt wird erwartet",
        "not valid yaml": "Ungültiges YAML/JSON"
    },
    TextFormField: {
        "not matching pattern": ({ pattern }) => `Entspricht nicht dem Muster ${pattern}`,
        "toggle password visibility": "Passwortsichtbarkeit umschalten"
    },
    FormFieldGroupComponent: {
        add: "Hinzufügen"
    },
    AutoInjectSwitch: {
        tooltip: ({ isAutoInjected }) => (
            <>
                Wenn aktiviert, wird diese Konfiguration automatisch in Ihre Dienste
                injiziert. Sie können sie trotzdem manuell hinzufügen, wenn Sie einen
                Dienst starten – auch wenn diese Option deaktiviert ist.
                <br />
                <br />
                Aktueller Status:{" "}
                <strong>{isAutoInjected ? "aktiviert" : "deaktiviert"}</strong>
            </>
        )
    },
    NumberFormField: {
        "below minimum": ({ minimum }) => `Muss größer oder gleich ${minimum} sein`,
        "not a number": "Keine Zahl",
        "not an integer": "Keine ganze Zahl"
    },
    NoLongerBookmarkedDialog: {
        "no longer bookmarked dialog title": "Nicht gespeicherte Änderungen",
        "no longer bookmarked dialog body":
            "Klicken Sie erneut auf das Lesezeichensymbol, um Ihre gespeicherte Konfiguration zu aktualisieren.",
        ok: "Ok"
    },
    MyService: {
        "page title": ({ helmReleaseFriendlyName }) =>
            `${helmReleaseFriendlyName} Überwachung`
    },
    PodLogsTab: {
        "not necessarily first logs":
            "Dies sind nicht unbedingt die ersten Protokolle, ältere Protokolle könnten gelöscht worden sein",
        "new logs are displayed in realtime":
            "Neue Protokolle werden in Echtzeit angezeigt"
    },
    MyServiceButtonBar: {
        back: "Zurück",
        "external monitoring": "Externes Monitoring",
        "helm values": "Helm-Werte",
        reduce: "Reduzieren"
    },
    LauncherMainCard: {
        "friendly name": "Personalisierter Name",
        launch: "Starten",
        "problem with": "Problem mit:",
        cancel: "Abbrechen",
        "copy auto launch url": "URL für automatisches Starten kopieren",
        "copy auto launch url helper": ({
            chartName
        }) => `Kopieren Sie die URL, die es jedem Benutzer dieser Onyxia-Instanz ermöglicht, 
            ein ${chartName} in dieser Konfiguration in ihrem Namespace zu starten`,
        "share the service": "Den Dienst teilen",
        "share the service - explain":
            "Machen Sie den Dienst für Projektmitglieder zugänglich",
        "restore all default": "Konfigurationen zurücksetzen",
        "bookmark button": ({ isBookmarked }) =>
            `${isBookmarked ? "Entfernen" : "Speichern"} Konfiguration`,
        "bookmark button tooltip": ({ myServicesSavedConfigsExtendedLink }) => (
            <>
                Gespeicherte Konfigurationen können schnell von der Seite&nbsp;
                <MuiLink {...myServicesSavedConfigsExtendedLink} target="_blank">
                    Meine Dienste
                </MuiLink>{" "}
                neu gestartet werden
            </>
        ),
        "version select label": "Version",
        "version select helper text": ({
            helmCharName,
            helmRepositoryName,
            labeledHelmChartSourceUrls
        }) => (
            <>
                Version des Helm-Charts{" "}
                {
                    <MaybeLink href={labeledHelmChartSourceUrls.helmChartSourceUrl}>
                        {helmCharName}
                    </MaybeLink>
                }{" "}
                das zum Helm-Chart-Repository{" "}
                {
                    <MaybeLink
                        href={labeledHelmChartSourceUrls.helmChartRepositorySourceUrl}
                    >
                        {helmRepositoryName}
                    </MaybeLink>
                }{" "}
                gehört.
            </>
        ),
        "save changes": "Änderungen speichern",
        "copied to clipboard": "In die Zwischenablage kopiert!",
        "s3 configuration": "S3-Konfiguration",
        "s3 configuration - explain": ({ projectS3ConfigLink }) => (
            <>
                S3-Konfiguration, die für diesen Dienst verwendet werden soll.{" "}
                <MuiLink {...projectS3ConfigLink}>S3-Konfiguration</MuiLink>.
            </>
        )
    },
    Footer: {
        "terms of service": "Nutzungsbedingungen",
        "change language": "Sprache ändern",
        "dark mode switch": "Umschalter für den Dark Mode"
    },
    MyServices: {
        text1: "Meine Dienste",
        text2: "Starten, anzeigen und verwalten Sie schnell Ihre laufenden Dienste.",
        text3: "Es wird empfohlen, Ihre Dienste nach jeder Arbeitssitzung zu löschen.",
        "running services": "Laufende Dienste"
    },
    ClusterEventsDialog: {
        title: "Ereignisse",
        subtitle: (
            <>
                Ereignisse des Kubernetes-Namespace, es ist ein Echtzeit-Feed von{" "}
                <code>kubectl get events</code>
            </>
        )
    },
    MyServicesConfirmDeleteDialog: {
        "confirm delete title": "Sind Sie sicher?",
        "confirm delete subtitle":
            "Stellen Sie sicher, dass Ihre Dienste keine nicht gespeicherte Arbeit enthalten.",
        "confirm delete body":
            "Vergessen Sie nicht, Ihren Code auf GitHub oder GitLab zu pushen, bevor Sie fortfahren.",
        "confirm delete body shared services":
            "Achtung, einige Ihrer Dienste sind für andere Projektmitglieder freigegeben.",
        cancel: "Abbrechen",
        confirm: "Ja, löschen"
    },
    MyServicesButtonBar: {
        refresh: "Aktualisieren",
        launch: "Neuer Dienst",
        trash: "Alle löschen",
        "trash my own": "Alle meine Dienste löschen"
    },
    MyServicesCard: {
        service: "Dienst",
        "running since": "Gestartet: ",
        open: "öffnen",
        readme: "readme",
        "reminder to delete services":
            "Denken Sie daran, Ihre Dienste nach Gebrauch zu löschen.",
        status: "Status",
        "container starting": "Container wird gestartet",
        failed: "Fehlgeschlagen",
        "suspend service tooltip": "Den Dienst unterbrechen und Ressourcen freigeben",
        "resume service tooltip": "Den Dienst fortsetzen",
        suspended: "Ausgesetzt",
        suspending: "Aussetzend",
        "share tooltip - belong to someone else": ({
            projectName,
            ownerUsername,
            focusColor
        }) => (
            <>
                Dieser Dienst wird unter den Mitgliedern des Projekts{" "}
                <span style={{ color: focusColor }}>{projectName}</span>
                von <span style={{ color: focusColor }}>{ownerUsername}</span> geteilt.
            </>
        ),
        "share tooltip - belong to you, shared": ({ projectName, focusColor }) => (
            <>
                Dieser Dienst wird unter den Mitgliedern des Projekts{" "}
                <span style={{ color: focusColor }}>{projectName}</span> geteilt. Klicken
                Sie, um die Freigabe zu beenden.
            </>
        ),
        "share tooltip - belong to you, not shared": ({ projectName, focusColor }) => (
            <>
                Nur Sie können auf diesen Dienst zugreifen. Klicken Sie, um ihn mit den
                Mitgliedern des Projekts{" "}
                <span style={{ color: focusColor }}>{projectName}</span> zu teilen.
            </>
        )
    },
    MyServicesRestorableConfigOptions: {
        edit: "Bearbeiten",
        "copy link": "URL kopieren",
        "remove bookmark": "Lesezeichen entfernen",
        "move down": "Nach unten verschieben",
        "move up": "Nach oben verschieben",
        "move to top": "Ganz nach oben verschieben",
        "move to bottom": "Ganz nach unten verschieben"
    },
    MyServicesRestorableConfig: {
        edit: "Bearbeiten",
        launch: "Starten"
    },
    MyServicesRestorableConfigs: {
        saved: "Gespeichert",
        expand: "Erweitern"
    },
    ReadmeDialog: {
        ok: "Ok",
        return: "Zurück"
    },
    CopyOpenButton: {
        "first copy the password": "Klicken Sie, um das Passwort zu kopieren...",
        "open the service": "Dienst öffnen 🚀"
    },
    MyServicesCards: {
        "running services": "Laufende Dienste"
    },
    NoRunningService: {
        "launch one": "Klicken Sie hier, um einen zu starten",
        "no services running": "Sie haben derzeit keine laufenden Dienste"
    },
    CircularUsage: {
        max: "Max",
        used: "Verwendet",
        "quota card title": ({ what, isLimit }) => {
            const whatTranslated = (() => {
                switch (what) {
                    case "memory":
                        return "RAM";
                    case "cpu":
                        return "CPU";
                    case "storage":
                        return "Speicher";
                    case "count/pod":
                        return "Kubernetes-Pods";
                    case "nvidia.com/gpu":
                        return "Nvidia-GPUs";
                    default:
                        return capitalize(what);
                }
            })();

            return `${whatTranslated} - ${isLimit ? "Limit" : "Angefordert"}`;
        }
    },
    Quotas: {
        "show more": "Mehr anzeigen",
        "resource usage quotas": "Ressourcennutzungsquoten",
        "current resource usage is reasonable":
            "Ihre aktuelle Ressourcennutzung ist angemessen."
    },
    DataExplorer: {
        "page header title": "Daten-Explorer",
        "page header help title":
            "Vorschau Ihrer Parquet- und CSV-Dateien direkt in Ihrem Browser!",
        "page header help content": ({ demoParquetFileLink }) => (
            <>
                Geben Sie einfach die <code>https://</code> oder <code>s3://</code> URL
                einer Daten-Datei ein, um sie zu betrachten.
                <br />
                Die Datei wird nicht vollständig heruntergeladen; ihr Inhalt wird
                gestreamt, während Sie durch die Seiten navigieren.
                <br />
                Sie können einen Permalink zur Datei oder sogar zu einer bestimmten Zeile
                der Datei teilen, indem Sie die URL aus der Adressleiste kopieren.
                <br />
                Nicht sicher, wo Sie anfangen sollen? Probieren Sie diese{" "}
                <MuiLink {...demoParquetFileLink}>Demodatei</MuiLink>!
            </>
        ),
        column: "Spalte",
        density: "Dichte",
        "download file": "Datei herunterladen",
        "resize table": undefined,
        "unsupported file type": ({ supportedFileTypes }) =>
            `Nicht unterstütztes Datenformat. Unterstützte Typen sind: ${supportedFileTypes.join(", ")}.`,
        "no s3 client":
            "Kein S3-Client konfiguriert. Gehe zu den Einstellungen, um einen für den Explorer zu aktivieren.",
        "unsupported protocol":
            "Nicht unterstützte URL. Unterstützte Protokolle sind https:// und s3://.",
        "https fetch error": "HTTPS-Datei konnte nicht abgerufen werden.",
        "query error": "DuckDB-Abfragefehler."
    },
    UrlInput: {
        load: "Laden",
        reset: "Leeren"
    },
    CommandBar: {
        ok: "Ok"
    },
    formattedDate: {
        past1: ({ divisorKey }) => {
            switch (divisorKey) {
                case "now":
                    return "gerade eben";
                case "second":
                    return "vor einer Sekunde";
                case "minute":
                    return "vor einer Minute";
                case "hour":
                    return "vor einer Stunde";
                case "day":
                    return "gestern";
                case "week":
                    return "letzte Woche";
                case "month":
                    return "letzten Monat";
                case "year":
                    return "letztes Jahr";
            }
        },
        pastN: ({ divisorKey }) => {
            switch (divisorKey) {
                case "now":
                    return "gerade eben";
                case "second":
                    return "vor # Sekunden";
                case "minute":
                    return "vor # Minuten";
                case "hour":
                    return "vor # Stunden";
                case "day":
                    return "vor # Tagen";
                case "week":
                    return "vor # Wochen";
                case "month":
                    return "vor # Monaten";
                case "year":
                    return "vor # Jahren";
            }
        },
        future1: ({ divisorKey }) => {
            switch (divisorKey) {
                case "now":
                    return "gerade eben";
                case "second":
                    return "in einer Sekunde";
                case "minute":
                    return "in einer Minute";
                case "hour":
                    return "in einer Stunde";
                case "day":
                    return "morgen";
                case "week":
                    return "nächste Woche";
                case "month":
                    return "nächsten Monat";
                case "year":
                    return "nächstes Jahr";
            }
        },
        futureN: ({ divisorKey }) => {
            switch (divisorKey) {
                case "now":
                    return "gerade eben";
                case "second":
                    return "in # Sekunden";
                case "minute":
                    return "in # Minuten";
                case "hour":
                    return "in # Stunden";
                case "day":
                    return "in # Tagen";
                case "week":
                    return "in # Wochen";
                case "month":
                    return "in # Monaten";
                case "year":
                    return "in # Jahren";
            }
        },
        singular: ({ divisorKey }) => {
            switch (divisorKey) {
                case "second":
                    return "1 Sekunde";
                case "minute":
                    return "1 Minute";
                case "hour":
                    return "1 Stunde";
                case "day":
                    return "1 Tag";
                case "week":
                    return "1 Woche";
                case "month":
                    return "1 Monat";
                case "year":
                    return "1 Jahr";
            }
        },
        plural: ({ divisorKey }) => {
            switch (divisorKey) {
                case "second":
                    return "# Sekunden";
                case "minute":
                    return "# Minuten";
                case "hour":
                    return "# Stunden";
                case "day":
                    return "# Tage";
                case "week":
                    return "# Wochen";
                case "month":
                    return "# Monate";
                case "year":
                    return "# Jahre";
            }
        }
    },
    CopyToClipboardIconButton: {
        "copied to clipboard": "Kopiert!",
        "copy to clipboard": "In die Zwischenablage kopieren"
    },
    CustomDataGrid: {
        "empty directory": "Dieses Verzeichnis ist leer",
        "label rows count": ({ count }) => {
            const plural = count > 1 ? "n" : "";
            return `${count} Element${plural} ausgewählt`;
        },
        "label rows per page": "Elemente pro Seite"
    },
    CustomDataGridToolbarDensitySelector: {
        toolbarDensity: "Dichte",
        toolbarDensityStandard: "Standard",
        toolbarDensityComfortable: "Bequem",
        toolbarDensityCompact: "Kompakt"
    },
    CustomDataGridToolbarColumnsButton: {
        toolbarColumnsLabel: "Spalten"
    },
    DatasetCard: {
        publishedOn: "Veröffentlicht am",
        datasetPage: "Datensatzseite",
        license: "Lizenz:",
        format: "Format",
        size: "Größe",
        distributions: "Distributionen",
        visualize: "Visualisieren",
        unknown: "Unbekannt"
    },
    DataCollection: {
        "page header help title":
            "Geben Sie einfach die https://-URL Ihres DCAT JSON-LD-Schemas ein",
        "page header title": "Datenkatalog",
        "page header help content": ({ demoCatalogLink }) => (
            <>
                Geben Sie einfach die <code>https://</code>-URL eines Datenkatalogs ein,
                um ihn in der Vorschau anzuzeigen.
                <br />
                Sie wissen nicht, wo Sie anfangen sollen? Probieren Sie diesen{" "}
                <MuiLink {...demoCatalogLink}>Demokatalog</MuiLink>!
            </>
        ),
        "https fetch error": "Die HTTPS-Ressource konnte nicht abgerufen werden.",
        "invalid json response": "Die Antwort ist kein gültiges JSON.",
        "json-ld compact error":
            "Die JSON-LD-Antwort konnte nicht kompakt verarbeitet werden.",
        "json-ld frame error": "Die JSON-LD-Antwort konnte nicht gerahmt werden.",
        "datasets parsing error":
            "Die Datensätze des Katalogs konnten nicht analysiert werden."
    }
    /* spell-checker: enable */
};
