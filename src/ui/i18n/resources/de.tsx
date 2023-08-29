import type { Translations } from "../types";
import MuiLink from "@mui/material/Link";

export const translations: Translations<"de"> = {
    /* spell-checker: disable */
    "Account": {
        "infos": "Kontoinformationen",
        "third-party-integration": "Externe Dienstleistungen",
        "storage": "Verbindung zum Speicher",
        "k8sCredentials": "Verbindung zu Kubernetes",
        "user-interface": "Konfiguration der Benutzeroberfläche",
        "text1": "Mein Konto",
        "text2": "Greifen Sie auf Ihre verschiedenen Kontoinformationen zu.",
        "text3":
            "Konfigurieren Sie Ihre persönlichen Logins, E-Mails, Passwörter und persönlichen Zugriffstoken, die direkt mit Ihren Diensten verbunden sind.",
        "personal tokens tooltip": 'Oder auf Englisch "Token".',
        "vault": "Vault"
    },
    "AccountInfoTab": {
        "general information": "Allgemeine Informationen",
        "user id": "User-ID",
        "full name": "Vollständiger Name",
        "email": "E-Mail-Adresse",
        "change account info":
            "Kontoinformationen ändern (z.B. Ihr Passwort)",
        "auth information": "Informationen zur Authentifizierung in Onyxia",
        "auth information helper": `Diese Informationen ermöglichen es Ihnen, sich innerhalb der Plattform und der verschiedenen Dienste zu identifizieren.`,
        "ip address": "IP-Adresse"
    },
    "AccountIntegrationsTab": {
        "git section title": "Git-Konfiguration",
        "git section helper": `Stellen Sie sicher, dass Sie in Ihren Diensten als Autor von Git commits erscheinen`,
        "gitName": "Benutzername für Git",
        "gitEmail": "E-Mail für Git",
        "third party tokens section title":
            "Verbinden Sie Ihre Gitlab-, Github- und Kaggle-Konten",
        "third party tokens section helper": `Verbinden Sie Ihre Dienste mit externen Konten mit Hilfe von persönlichen Zugriffstoken und Umgebungsvariablen.`,
        "personal token": ({ serviceName }) => `Persönlicher Zugriffstoken ${serviceName}`,
        "link for token creation": ({ serviceName }) =>
            `Erstellen Sie Ihren Token ${serviceName}.`,
        "accessible as env":
            "In Ihren Diensten als Umgebungsvariable verfügbar"
    },
    "AccountStorageTab": {
        "credentials section title": "Verbinden Sie Ihre Daten mit Ihren Diensten",
        "credentials section helper":
            "MinIO-objektbasierter Speicher, kompatibel mit Amazon (AWS S3). Diese Informationen sind bereits automatisch eingetragen.",
        "accessible as env":
            "In Ihren Diensten als Umgebungsvariable verfügbar",
        "init script section title":
            "Zugriff auf den Speicher außerhalb der Datalab-Dienste",
        "init script section helper": `Laden Sie das Initialisierungsskript in der Programmiersprache Ihrer Wahl herunter.`,
        "expires in": ({ howMuchTime }) => `Läuft in ${howMuchTime} ab`
    },
    "AccountKubernetesTab": {
        "credentials section title": "Verbindung zu Kubernetes",
        "credentials section helper":
            "Anmeldeinformationen zur direkten Interaktion mit dem Kubernetes-Cluster.",
        "init script section title":
            "Verbindung zum Kubernetes-Cluster über Ihr lokales kubectl",
        "init script section helper": `Laden Sie das Skript herunter oder kopieren Sie es.`,
        "expires in": ({ howMuchTime }) => `Das Token läuft in ${howMuchTime} ab`
    },
    "AccountVaultTab": {
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
                Laden Sie die <code>ENV</code>-Variablen herunter oder kopieren Sie sie, um ihre lokale{" "}
                <MuiLink href={vaultCliDocLink} target="_blank">
                    Vault CLI
                </MuiLink>{" "}
                zu konfigurieren.
            </>
        ),
        "expires in": ({ howMuchTime }) => `Das Token läuft in ${howMuchTime} ab`
    },
    "AccountUserInterfaceTab": {
        "title": "Konfiguration der Benutzeroberfläche",
        "enable dark mode": "Dunkelmodus aktivieren",
        "dark mode helper":
            "Benutzeroberfläche mit geringer Helligkeit und dunklem Hintergrund.",
        "enable beta": "Betatester-Modus aktivieren",
        "beta mode helper":
            "Für erweiterte Konfigurationen und Funktionen der Plattform.",
        "enable dev mode": "Entwickleroptionen aktivieren",
        "dev mode helper": "Aktivieren Sie die Funktionen, die sich noch in der Entwicklung befinden"
    },
    "AccountField": {
        "copy tooltip": "In die Zwischenablage kopieren",
        "language": "Sprache ändern",
        "service password": "Passwort für Ihre Dienste",
        "service password helper text": `Dieses Passwort ist erforderlich, um sich bei allen Ihren Diensten anzumelden. 
            Es wird automatisch generiert und regelmäßig erneuert.`,
        "not yet defined": "Noch nicht definiert",
        "reset helper dialogs": "Hilfsdialoge zurücksetzen",
        "reset": "Zurücksetzen",
        "reset helper dialogs helper text": "Die Hilfsdialoge zurücksetzen, die Sie aufgefordert haben, nicht mehr anzuzeigen"
    },
    "MyFiles": {
        "page title - my files": "Meine Dateien",
        "page title - my secrets": "Meine Geheimnisse",
        "what this page is used for - my files": "Speichern Sie hier Ihre Dateien.",
        "what this page is used for - my secrets": "Speichern Sie hier Geheimnisse, die in Form von Umgebungsvariablen in Ihren Diensten verfügbar sein werden.",
        "help content": ({ accountTabLink, docHref }) => (
            <>
                Lesen Sie
                <MuiLink href={docHref} target="_blank">
                    unsere Dokumentation
                </MuiLink>
                . &nbsp;
                <MuiLink {...accountTabLink}>MinIO-Clients konfigurieren</MuiLink>.
            </>
        )
    },
    "MySecrets": {
        "page title - my files": "Meine Dateien",
        "page title - my secrets": "Meine Geheimnisse",
        "what this page is used for - my files": "Speichern Sie hier Ihre Dateien.",
        "what this page is used for - my secrets": "Speichern Sie hier Geheimnisse, die in Form von Umgebungsvariablen in Ihren Diensten verfügbar sein werden.",
        "learn more - my files": "Erfahren Sie mehr über die Verwendung des S3-Speichers,",
        "help content": ({ accountTabLink, docHref }) => (
            <>
                Lesen Sie
                <MuiLink href={docHref} target="_blank">
                    unsere Dokumentation
                </MuiLink>
                . &nbsp;
                <MuiLink {...accountTabLink}>Ihren lokalen Vault CLI konfigurieren</MuiLink>.
            </>
        )
    },
    "ExplorerItem": {
        "description": "Beschreibung"
    },
    "SecretsExplorerItem": {
        "description": "Beschreibung"
    },
    "ExplorerButtonBar": {
        "file": "Datei",
        "secret": "Geheimnis",
        "delete": "löschen",
        "create secret": "Neues Geheimnis",
        "upload file": "Datei hochladen",
        "copy path": "Den S3-Objektnamen kopieren",
        "create directory": "Neues Verzeichnis",
        "refresh": "aktualisieren",
        "create what": ({ what }) => `Neu ${what}`,
        "new": "Neu"
    },
    "SecretsExplorerButtonBar": {
        "file": "Datei",
        "secret": "Geheimnis",
        "rename": "umbenennen",
        "delete": "löschen",
        "create secret": "Neues Geheimnis",
        "upload file": "Datei hochladen",
        "copy path": "Im Dienst verwenden",
        "create directory": "Neues Verzeichnis",
        "refresh": "aktualisieren",
        "create what": ({ what }) => `Neu ${what}`,
        "new": "Neu"
    },
    "Explorer": {
        "file": "Datei",
        "secret": "Geheimnis",
        "create": "erstellen",
        "cancel": "abbrechen",
        "delete": "löschen",
        "do not display again": "Nicht mehr anzeigen",
        "untitled what": ({ what }) => `${what}_namenlos`,
        "directory": "Verzeichnis",
        "deletion dialog title": ({ deleteWhat }) => `Einen ${deleteWhat} löschen?`,
        "deletion dialog body": ({ deleteWhat }) => `
            Sie sind dabei, einen ${deleteWhat} zu löschen. 
            Durch diese Aktion können Daten verloren gehen, die mit diesem ${deleteWhat} verknüpft sind.
            `,
        "already a directory with this name": "Es gibt bereits ein Verzeichnis mit diesem Namen",
        "can't be empty": "Darf nicht leer sein",
        "new directory": "Neues Verzeichnis"
    },
    "SecretsExplorer": {
        "file": "Datei",
        "secret": "Geheimnis",
        "cancel": "abbrechen",
        "delete": "löschen",
        "do not display again": "Nicht mehr anzeigen",
        "untitled what": ({ what }) => `${what}_namenlos`,
        "directory": "Verzeichnis",
        "deletion dialog title": ({ deleteWhat }) => `Einen ${deleteWhat} löschen?`,
        "deletion dialog body": ({ deleteWhat }) => `
            Sie sind dabei, einen ${deleteWhat} zu löschen.
            Dies kann den potentiellen Verlust von Daten, die mit diesem ${deleteWhat} verbunden sind, zur Folge haben.
            `,
        "already a directory with this name": "Es gibt bereits ein Verzeichnis mit diesem Namen",
        "can't be empty": "Darf nicht leer sein",
        "create": "Erstellen",
        "new directory": "Neues Verzeichnis"
    },
    "ExplorerItems": {
        "empty directory": "Dieses Verzeichnis ist leer"
    },
    "SecretsExplorerItems": {
        "empty directory": "Dieses Verzeichnis ist leer"
    },
    "MySecretsEditor": {
        "do not display again": "Nicht mehr anzeigen",
        "add an entry": "Einen Variable hinzufügen",
        "environment variable default name": "NEUE_UMGEBUNGSVAR",
        "table of secret": "Geheimliste",
        "key column name": "Variablenname",
        "value column name": "Variablenwert",
        "resolved value column name": "Aufgelöster Variablenwert",
        "what's a resolved value": `
            Eine Umgebungsvariable kann eine andere referenzieren, zum Beispiel wenn Sie
            die Variable VORNAME=Louis definiert haben, können Sie die Variable VOLLNAME="$VORNAME"-Dupon definieren,
            die den aufgelösten Wert "Louis-Dupon" haben wird.
            `,
        "unavailable key": "Bereits vergeben",
        "invalid key empty string": "Ein Name ist erforderlich",
        "invalid key _ not valid": "Darf nicht nur _ sein",
        "invalid key start with digit": "Darf nicht mit einer Zahl beginnen",
        "invalid key invalid character": "Ungültiges Zeichen",
        "invalid value cannot eval": "Ungültiger Shell-Ausdruck",
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
    "MySecretsEditorRow": {
        "key input desc": "Name der Umgebungsvariable",
        "value input desc": "Wert der Umgebungsvariable"
    },
    "ExplorerUploadModalDropArea": {
        "browse files": "Durchsuchen Sie Ihre Dateien",
        "drag and drop or": "Drag & Drop oder"
    },
    "ExplorerUploadProgress": {
        "over": "über",
        "importing": "derzeit importieren"
    },
    "ExplorerUploadModal": {
        "import files": "Dateien importieren",
        "cancel": "Abbrechen",
        "minimize": "Minimieren"
    },
    "Header": {
        "login": "Login",
        "logout": "Logout",
        "project": "Projekt"
    },
    "App": {
        "reduce": "Reduzieren",
        "home": "Startseite",
        "account": "Mein Konto",
        "catalog": "Servicekatalog",
        "myServices": "Meine Dienste",
        "mySecrets": "Meine Geheimnisse",
        "myFiles": "Meine Dateien",
        "divider: services features": "Funktionen im Zusammenhang mit Diensten",
        "divider: external services features": "Funktionen im Zusammenhang mit externen Diensten",
        "divider: onyxia instance specific features": "Funktionen spezifisch für diese Onyxia-Instanz"
    },
    "Page404": {
        "not found": "Seite nicht gefunden"
    },
    "PortraitModeUnsupported": {
        "portrait mode not supported": "Hochformat wird noch nicht unterstützt",
        "instructions": "Um diese App auf Ihrem Handy zu nutzen, aktivieren Sie bitte den Rotationssensor und drehen Sie Ihr Telefon."
    },
    "Home": {
            "welcome": ({ who }) => `Willkommen ${who}!`,
            "title": "Willkommen im Datalab",
            "login": "Login",
            "new user": "Neuer Datalab User?",
            "subtitle": "Arbeiten Sie mit Python oder R und haben Sie die benötigte Rechenleistung!",
            "cardTitle1": "Eine ergonomische Umgebung und Dienstleistungen auf Abruf",
            "cardTitle2": "Eine aktive und begeisterte Gemeinschaft steht Ihnen zur Verfügung",
            "cardTitle3": "Ein schneller, flexibler und online verfügbarer Datenspeicherbereich",
            "cardText1": "Analysieren Sie Daten, führen Sie verteilte Berechnungen durch und nutzen Sie einen umfangreichen Katalog von Diensten. Reservieren Sie die benötigte Rechenleistung.",
            "cardText2": "Nutzen und teilen Sie Ressourcen, die Ihnen zur Verfügung stehen: Tutorials, Trainings und Kommunikationskanäle.",
            "cardText3": "Greifen Sie leicht auf Ihre Daten und die Ihnen zur Verfügung gestellten Daten von Ihren Programmen aus zu - S3 API-Implementierung.",
            "cardButton1": "Katalog anschauen",
            "cardButton2": "Der Community beitreten",
            "cardButton3": "Daten anzeigen"
        },
        "CatalogExplorerCard": {
            "launch": "Starten",
            "learn more": "Mehr erfahren"
        },
        "CatalogExplorerCards": {
            "show more": "Alle anzeigen",
            "no service found": "Dienst nicht gefunden",
            "no result found": ({ forWhat }) => `Keine Ergebnisse gefunden für ${forWhat}`,
            "check spelling": `Überprüfen Sie die Schreibweise des Dienstnamens oder versuchen Sie, Ihre Suche zu erweitern.`,
            "go back": "Zurück zu den Hauptdiensten",
            "main services": "Hauptdienste",
            "all services": "Alle Dienste",
            "search results": "Suchergebnisse",
            "search": "Suchen"
        },
        "Catalog": {
            "header text1": "Dienstkatalog",
            "header text2": "Erkunden, starten und konfigurieren Sie Dienste mit nur wenigen Klicks.",
            "contribute to the catalog": ({ catalogName }) => (
                <>Beitragen zum Katalog {catalogName}</>
            ),
            "contribute to the package": ({ packageName }) =>
                `Zugriff auf den Quellcode des Pakets ${packageName} `,
            "here": "hier"
        },
        "CatalogLauncher": {
            "no longer bookmarked dialog title": "Nicht gespeicherte Änderungen",
            "no longer bookmarked dialog body": "Klicken Sie erneut auf das Lesezeichensymbol, um Ihre gespeicherte Konfiguration zu aktualisieren.",
            "ok": "Ok",
            "should overwrite configuration dialog title": "Möchten Sie es ersetzen?",
            "should overwrite configuration dialog subtitle": ({ friendlyName }) =>
                `„${friendlyName}“ ist bereits in Ihren Aufzeichnungen vorhanden.`,
            "should overwrite configuration dialog body": "Ein registrierter Dienst mit dem gleichen Namen existiert bereits. Wenn Sie ihn ersetzen, wird der ursprüngliche Inhalt verloren.",
            "cancel": "Abbrechen",
            "replace": "Ersetzen",
            "sensitive configuration dialog title": "Das Starten dieses Dienstes könnte gefährlich sein",
            "proceed to launch": "Bewusst starten"
        },
        "Footer": {
            "contribute": "Zum Projekt beitragen",
            "terms of service": "Nutzungsbedingungen",
            "change language": "Sprache ändern",
            "dark mode switch": "Umschalter für den Dark Mode"
        },
        "CatalogLauncherMainCard": {
            "card title": "Erstellen Sie Ihren eigenen Dienst",
            "friendly name": "Personalisierter Name",
            "launch": "Starten",
            "cancel": "Abbrechen",
            "copy url helper text": "Kopieren Sie die URL, um diese Konfiguration wiederherzustellen",
            "save configuration": "Diese Konfiguration speichern",
            "share the service": "Den Dienst teilen",
            "share the service - explain": "Machen Sie den Dienst für Projektmitglieder zugänglich",
            "restore all default": "Konfigurationen zurücksetzen"
        },
        "CatalogLauncherConfigurationCard": {
            "global config": "Globale Konfigurationen",
            "configuration": ({ packageName }) => `Konfiguration ${packageName}`,
            "dependency": ({ dependencyName }) => `Abhängigkeit ${dependencyName}`,
            "launch of a service": ({ dependencyName }) =>
                `Start eines Dienstes ${dependencyName}`,
            "mismatching pattern": ({ pattern }) => `Muss ${pattern} entsprechen`,
            "Invalid YAML Object": "Ungültiges YAML-Objekt",
            "Invalid YAML Array": "Ungültiges YAML-Array"
        },
        "MyServices": {
            "text1": "Meine Dienste",
            "text2": "Starten, anzeigen und verwalten Sie schnell Ihre laufenden Dienste.",
            "text3": "Es wird empfohlen, Ihre Dienste nach jeder Arbeitssitzung zu löschen.",
            "running services": "Laufende Dienste",
            "confirm delete title": "Sind Sie sicher?",
            "confirm delete subtitle": "Stellen Sie sicher, dass Ihre Dienste keine nicht gespeicherte Arbeit enthalten.",
            "confirm delete body": "Vergessen Sie nicht, Ihren Code auf GitHub oder GitLab zu pushen, bevor Sie fortfahren.",
            "confirm delete body shared services": "Achtung, einige Ihrer Dienste sind für andere Projektmitglieder freigegeben.",
            "cancel": "Abbrechen",
            "confirm": "Ja, löschen"
        },
        "MyServicesButtonBar": {
            "refresh": "Aktualisieren",
            "launch": "Neuer Dienst",
            "password": "Passwort kopieren",
            "trash": "Alle löschen",
            "trash my own": "Alle meine Dienste löschen"
        },
    "MyServicesCard": {
        "service": "Dienst",
        "running since": "In Betrieb seit: ",
        "open": "öffnen",
        "readme": "readme",
        "shared by you": "von Ihnen geteilt",
        "which token expire when": ({ which, howMuchTime }) =>
            `Das Token ${which} läuft in ${howMuchTime} ab.`,
        "which token expired": ({ which }) => `Das Token ${which} ist abgelaufen.`,
        "reminder to delete services":
            "Denken Sie daran, Ihre Dienste nach Gebrauch zu löschen.",
        "this is a shared service": "Dieser Dienst wird im Projekt geteilt"
    },
    "MyServicesRunningTime": {
        "launching": "In Arbeit..."
    },
    "MyServicesSavedConfigOptions": {
        "edit": "Bearbeiten",
        "copy link": "URL kopieren",
        "remove bookmark": "Lesezeichen entfernen"
    },
    "MyServicesSavedConfig": {
        "edit": "Bearbeiten",
        "launch": "Starten"
    },
    "MyServicesSavedConfigs": {
        "saved": "Gespeichert",
        "show all": "Alle anzeigen"
    },
    "MyServicesCards": {
        "running services": "Laufende Dienste",
        "no services running":
            "Sie haben derzeit keine laufenden Dienste",
        "launch one": "Klicken Sie hier, um einen zu starten",
        "ok": "ok",
        "need to copy": "Müssen Sie nicht abgeschnittene Werte kopieren?",
        "everything have been printed to the console": "Alles wurde in der Konsole protokolliert",
        "first copy the password": "Kopieren Sie zuerst das Passwort...",
        "open the service": "Dienst öffnen 🚀",
        "return": "Zurück"
    }
    /* spell-checker: enable */
    };
