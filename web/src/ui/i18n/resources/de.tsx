import type { Translations } from "../types";
import MuiLink from "@mui/material/Link";
import { Markdown } from "ui/shared/Markdown";
import { elementsToSentence } from "ui/tools/elementsToSentence";

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
        "change account info": "Kontoinformationen ändern (z.B. Ihr Passwort)",
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
        "personal token": ({ serviceName }) =>
            `Persönlicher Zugriffstoken ${serviceName}`,
        "link for token creation": ({ serviceName }) =>
            `Erstellen Sie Ihren Token ${serviceName}.`,
        "accessible as env": "In Ihren Diensten als Umgebungsvariable verfügbar"
    },
    "AccountStorageTab": {
        "credentials section title": "Verbinden Sie Ihre Daten mit Ihren Diensten",
        "credentials section helper":
            "MinIO-objektbasierter Speicher, kompatibel mit Amazon (AWS S3). Diese Informationen sind bereits automatisch eingetragen.",
        "accessible as env": "In Ihren Diensten als Umgebungsvariable verfügbar",
        "init script section title":
            "Zugriff auf den Speicher außerhalb der Datalab-Dienste",
        "init script section helper": `Laden Sie das Initialisierungsskript in der Programmiersprache Ihrer Wahl herunter.`,
        "expires in": ({ howMuchTime }) => `Läuft in ${howMuchTime} ab`
    },
    "AccountKubernetesTab": {
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
    "AccountUserInterfaceTab": {
        "title": "Konfiguration der Benutzeroberfläche",
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
    "AccountField": {
        "copy tooltip": "In die Zwischenablage kopieren",
        "language": "Sprache ändern",
        "service password": "Passwort für Ihre Dienste",
        "service password helper text": `Dieses Passwort ist erforderlich, um sich bei allen Ihren Diensten anzumelden. 
            Es wird automatisch generiert und regelmäßig erneuert.`,
        "not yet defined": "Noch nicht definiert",
        "reset helper dialogs": "Hilfsdialoge zurücksetzen",
        "reset": "Zurücksetzen",
        "reset helper dialogs helper text":
            "Die Hilfsdialoge zurücksetzen, die Sie aufgefordert haben, nicht mehr anzuzeigen"
    },
    "MyFiles": {
        "page title - my files": "Meine Dateien",
        "page title - my secrets": "Meine Geheimnisse",
        "what this page is used for - my files": "Speichern Sie hier Ihre Dateien.",
        "what this page is used for - my secrets":
            "Speichern Sie hier Geheimnisse, die in Form von Umgebungsvariablen in Ihren Diensten verfügbar sein werden.",
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
        "already a directory with this name":
            "Es gibt bereits ein Verzeichnis mit diesem Namen",
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
        "already a directory with this name":
            "Es gibt bereits ein Verzeichnis mit diesem Namen",
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
        "environnement variable default name": "NEUE_UMGEBUNGSVAR",
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
        "project": "Projekt",
        "region": "Region"
    },
    "LeftBar": {
        "reduce": "Reduzieren",
        "home": "Startseite",
        "account": "Mein Konto",
        "catalog": "Servicekatalog",
        "myServices": "Meine Dienste",
        "mySecrets": "Meine Geheimnisse",
        "myFiles": "Meine Dateien",
        "divider: services features": "Funktionen im Zusammenhang mit Diensten",
        "divider: external services features":
            "Funktionen im Zusammenhang mit externen Diensten",
        "divider: onyxia instance specific features":
            "Funktionen spezifisch für diese Onyxia-Instanz"
    },
    "Page404": {
        "not found": "Seite nicht gefunden"
    },
    "PortraitModeUnsupported": {
        "instructions":
            "Um diese App auf Ihrem Handy zu nutzen, aktivieren Sie bitte den Rotationssensor und drehen Sie Ihr Telefon."
    },
    "Home": {
        "title authenticated": ({ userFirstname }) => `Willkommen ${userFirstname}!`,
        "title": "Willkommen im Datalab",
        "login": "Login",
        "new user": "Neuer Datalab User?",
        "subtitle":
            "Arbeiten Sie mit Python oder R und haben Sie die benötigte Rechenleistung!",
        "cardTitle1": "Eine ergonomische Umgebung und Dienstleistungen auf Abruf",
        "cardTitle2":
            "Eine aktive und begeisterte Gemeinschaft steht Ihnen zur Verfügung",
        "cardTitle3":
            "Ein schneller, flexibler und online verfügbarer Datenspeicherbereich",
        "cardText1":
            "Analysieren Sie Daten, führen Sie verteilte Berechnungen durch und nutzen Sie einen umfangreichen Katalog von Diensten. Reservieren Sie die benötigte Rechenleistung.",
        "cardText2":
            "Nutzen und teilen Sie Ressourcen, die Ihnen zur Verfügung stehen: Tutorials, Trainings und Kommunikationskanäle.",
        "cardText3":
            "Greifen Sie leicht auf Ihre Daten und die Ihnen zur Verfügung gestellten Daten von Ihren Programmen aus zu - S3 API-Implementierung.",
        "cardButton1": "Katalog anschauen",
        "cardButton2": "Der Community beitreten",
        "cardButton3": "Daten anzeigen"
    },
    "Catalog": {
        "header text1": "Dienstkatalog",
        "header text2":
            "Erkunden, starten und konfigurieren Sie Dienste mit nur wenigen Klicks.",
        "header help": ({ catalogName, catalogDescription, repositoryUrl }) => (
            <>
                Sie erforschen das Helm Chart Repository{" "}
                <MuiLink href={repositoryUrl} target="_blank">
                    {catalogName}: {catalogDescription}
                </MuiLink>
            </>
        ),
        "here": "hier",
        "show more": "Alle anzeigen",
        "no service found": "Dienst nicht gefunden",
        "no result found": ({ forWhat }) => `Keine Ergebnisse gefunden für ${forWhat}`,
        "check spelling": `Überprüfen Sie die Schreibweise des Dienstnamens oder versuchen Sie, Ihre Suche zu erweitern.`,
        "go back": "Zurück zu den Hauptdiensten",
        "search results": "Suchergebnisse",
        "search": "Suchen"
    },
    "CatalogChartCard": {
        "launch": "Starten",
        "learn more": "Mehr erfahren"
    },
    "CatalogNoSearchMatches": {
        "no service found": "Dienst nicht gefunden",
        "no result found": ({ forWhat }) => `Keine Ergebnisse gefunden für ${forWhat}`,
        "check spelling": `Überprüfen Sie die Schreibweise des Dienstnamens oder versuchen Sie, Ihre Suche zu erweitern.`,
        "go back": "Zurück zu den Hauptdiensten"
    },
    "Launcher": {
        "header text1": "Dienstkatalog",
        "header text2":
            "Erkunden, starten und konfigurieren Sie Dienste mit nur wenigen Klicks.",
        "chart sources": ({ chartName, urls }) =>
            urls.length === 0 ? (
                <></>
            ) : (
                <>
                    Auf die Quelle{urls.length === 1 ? "" : "n"} des Charts {chartName}{" "}
                    zugreifen:&nbsp;
                    {elementsToSentence({
                        "elements": urls.map(source => (
                            <MuiLink href={source} target="_blank" underline="hover">
                                hier
                            </MuiLink>
                        )),
                        "language": "de"
                    })}
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
                        ...(doOpensNewTab
                            ? { "target": "_blank", "onClick": undefined }
                            : {})
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
        )
    },
    "AcknowledgeSharingOfConfigConfirmDialog": {
        "acknowledge sharing of config confirm dialog title":
            "Beachten Sie, Konfigurationen werden geteilt",
        "acknowledge sharing of config confirm dialog subtitle": ({
            groupProjectName
        }) => `Wenn Sie diese Konfiguration speichern,
        wird jedes Mitglied des Projekts ${groupProjectName} in der Lage sein, es zu starten.`,
        "acknowledge sharing of config confirm dialog body": `Obwohl keine persönlichen Informationen automatisch von Onyxia eingefügt wurden,
        achten Sie darauf, keine sensiblen Informationen in der wiederherstellbaren Konfiguration zu teilen.`,
        "cancel": "Abbrechen",
        "i understand, proceed": "Ich verstehe, fortfahren"
    },
    "AutoLaunchDisabledDialog": {
        "ok": "Ok",
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
    "NoLongerBookmarkedDialog": {
        "no longer bookmarked dialog title": "Nicht gespeicherte Änderungen",
        "no longer bookmarked dialog body":
            "Klicken Sie erneut auf das Lesezeichensymbol, um Ihre gespeicherte Konfiguration zu aktualisieren.",
        "ok": "Ok"
    },
    "SensitiveConfigurationDialog": {
        "sensitive configuration dialog title":
            "Das Starten dieses Dienstes könnte gefährlich sein",
        "cancel": "Abbrechen",
        "proceed to launch": "Bewusst starten"
    },
    "LauncherMainCard": {
        "card title": "Erstellen Sie Ihren eigenen Dienst",
        "friendly name": "Personalisierter Name",
        "launch": "Starten",
        "cancel": "Abbrechen",
        "copy url helper text":
            "Kopieren Sie die URL, um diese Konfiguration wiederherzustellen",
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
            chartName,
            catalogRepositoryUrl,
            catalogName
        }) => (
            <>
                Version des {chartName} Charts im&nbsp;
                <MuiLink href={catalogRepositoryUrl}>
                    {catalogName} Helm Repository
                </MuiLink>
            </>
        ),
        "save changes": "Änderungen speichern"
    },
    "LauncherConfigurationCard": {
        "global config": "Globale Konfigurationen",
        "configuration": ({ packageName }) => `Konfiguration ${packageName}`,
        "dependency": ({ dependencyName }) => `Abhängigkeit ${dependencyName}`,
        "launch of a service": ({ dependencyName }) =>
            `Start eines Dienstes ${dependencyName}`,
        "mismatching pattern": ({ pattern }) => `Muss ${pattern} entsprechen`,
        "Invalid YAML Object": "Ungültiges YAML-Objekt",
        "Invalid YAML Array": "Ungültiges YAML-Array"
    },
    "Footer": {
        "contribute": "Zum Projekt beitragen",
        "terms of service": "Nutzungsbedingungen",
        "change language": "Sprache ändern",
        "dark mode switch": "Umschalter für den Dark Mode"
    },
    "MyServices": {
        "text1": "Meine Dienste",
        "text2": "Starten, anzeigen und verwalten Sie schnell Ihre laufenden Dienste.",
        "text3": "Es wird empfohlen, Ihre Dienste nach jeder Arbeitssitzung zu löschen.",
        "running services": "Laufende Dienste"
    },
    "MyServicesConfirmDeleteDialog": {
        "confirm delete title": "Sind Sie sicher?",
        "confirm delete subtitle":
            "Stellen Sie sicher, dass Ihre Dienste keine nicht gespeicherte Arbeit enthalten.",
        "confirm delete body":
            "Vergessen Sie nicht, Ihren Code auf GitHub oder GitLab zu pushen, bevor Sie fortfahren.",
        "confirm delete body shared services":
            "Achtung, einige Ihrer Dienste sind für andere Projektmitglieder freigegeben.",
        "cancel": "Abbrechen",
        "confirm": "Ja, löschen"
    },
    "MyServicesButtonBar": {
        "refresh": "Aktualisieren",
        "launch": "Neuer Dienst",
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
    "MyServicesRestorableConfigOptions": {
        "edit": "Bearbeiten",
        "copy link": "URL kopieren",
        "remove bookmark": "Lesezeichen entfernen"
    },
    "MyServicesRestorableConfig": {
        "edit": "Bearbeiten",
        "launch": "Starten"
    },
    "MyServicesRestorableConfigs": {
        "saved": "Gespeichert",
        "show all": "Alle anzeigen"
    },
    "ReadmeAndEnvDialog": {
        "ok": "Ok",
        "return": "Zurück"
    },
    "CopyOpenButton": {
        "first copy the password": "Klicken Sie, um das Passwort zu kopieren...",
        "open the service": "Dienst öffnen 🚀"
    },
    "MyServicesCards": {
        "running services": "Laufende Dienste"
    },
    "NoRunningService": {
        "launch one": "Klicken Sie hier, um einen zu starten",
        "no services running": "Sie haben derzeit keine laufenden Dienste"
    },
    "CommandBar": {
        "ok": "Ok"
    },
    "moment": {
        "date format": ({ isSameYear }) =>
            `dddd, Do MMMM${isSameYear ? "" : " YYYY"}, HH:mm`,
        "past1": ({ divisorKey }) => {
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
        "pastN": ({ divisorKey }) => {
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
        "future1": ({ divisorKey }) => {
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
        "futureN": ({ divisorKey }) => {
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
        }
    }
    /* spell-checker: enable */
};
