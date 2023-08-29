import type { Translations } from "../types";
import MuiLink from "@mui/material/Link";

export const translations: Translations<"nl"> = {
    /* spell-checker: disable */
    "Account": {
        "infos": "Accountgegevens",
        "third-party-integration": "Externe diensten",
        "storage": "Verbinding met opslag",
        "k8sCredentials": "Verbinding met Kubernetes",
        "user-interface": "Interfacemodi",
        "text1": "Mijn account",
        "text2": "Toegang tot uw accountgegevens.",
        "text3":
            "Uw gebruikersnamen, e-mails, wachtwoorden en persoonlijke toegangstokens die direct verbonden zijn aan uw diensten configureren.",
        "personal tokens tooltip": 'Of "token" in het Engels.',
        "vault": "Vault"
    },
    "AccountInfoTab": {
        "general information": "Algemene informatie",
        "user id": "Gebruikersnaam (IDEP)",
        "full name": "Volledige naam",
        "email": "E-mailadres",
        "change account info": "Accountgegevens (zoals uw wachtwoord) wijzigen",
        "auth information": "Authenticatiegegevens Onyxia",
        "auth information helper": `Met deze informatie kunt u zich identificeren  
            binnen het platform en de verschillende diensten.`,
        "ip address": "IP-adres"
    },
    "AccountIntegrationsTab": {
        "git section title": "Git-configuraties",
        "git section helper": `Om ervoor te zorgen dat u vanuit uw diensten verschijnt
            als de auteur van de Git-bijdragen`,
        "gitName": "Gebruikersnaam voor Git",
        "gitEmail": "E-mailadres voor Git",
        "third party tokens section title":
            "Uw Gitlab-, Github- en Kaggle-accounts verbinden",
        "third party tokens section helper": `Verbind uw diensten met externe accounts met behulp van
            persoonlijke toegangstokens en omgevingsvariabelen.`,
        "personal token": ({ serviceName }) => `Persoonlijk toegangstoken ${serviceName}`,
        "link for token creation": ({ serviceName }) =>
            `Uw token aanmaken ${serviceName}.`,
        "accessible as env": "Toegankelijk binnen uw diensten als omgevingsvariabele"
    },
    "AccountStorageTab": {
        "credentials section title": "Uw gegevens verbinden met uw diensten",
        "credentials section helper":
            "Opslag object MinIO compatible Amazon (AWS S3). Deze informatie is al automatisch ingevuld.",
        "accessible as env": "Toegankelijk binnen uw diensten als omgevingsvariabele",
        "init script section title":
            "Om toegang te krijgen tot opslag buiten de diensten van het datalab",
        "init script section helper": `Download of kopieer het initialisatiescript in de programmeertaal van uw keuze.`,
        "expires in": ({ howMuchTime }) => `Vervalt binnen ${howMuchTime}`
    },
    "AccountKubernetesTab": {
        "credentials section title": "Verbinding met Kubernetes",
        "credentials section helper":
            "Gebruikersnaam voor directe interactie met het cluster Kubernetes.",
        "init script section title":
            "Om verbinding te maken met het cluster Kubernetes via uw lokale kubectl",
        "init script section helper": `Download of kopieer het script.`,
        "expires in": ({ howMuchTime }) => `Het token vervalt binnen ${howMuchTime}`
    },
    "AccountVaultTab": {
        "credentials section title": "Gebrukersnamen Vault",
        "credentials section helper": ({ vaultDocHref, mySecretLink }) => (
            <>
                <MuiLink href={vaultDocHref} target="_blank">
                    Vault
                </MuiLink>{" "}
                is het systeem waarin &nbsp;
                <MuiLink {...mySecretLink}>uw geheimen</MuiLink> worden opgeslagen.
            </>
        ),
        "init script section title": "Vault gebruiken vanuit uw terminal",
        "init script section helper": ({ vaultCliDocLink }) => (
            <>
                Download of kopieer de <code>ENV</code> -om uw{" "}
                <MuiLink href={vaultCliDocLink} target="_blank">
                    lokale Vault CLI
                </MuiLink>{" "}
                in te stellen.
            </>
        ),
        "expires in": ({ howMuchTime }) => `Het token vervalt in ${howMuchTime}`
    },
    "AccountUserInterfaceTab": {
        "title": "De interfacemodus configureren",
        "enable dark mode": "Donkere modus activeren",
        "dark mode helper":
            "Thema van de interface met weinig licht en donkere achtergrond.",
        "enable beta": "Modus beta-tester activeren",
        "beta mode helper":
            "Voor geavanceerde configuratie en functionaliteiten van het platform.",
        "enable dev mode": "Modus ontwikkelaar activeren",
        "dev mode helper": "Functionaliteiten in ontwikkeling activeren"
    },
    "AccountField": {
        "copy tooltip": "Kopiëren naar klembord",
        "language": "Taal wijzigen",
        "service password": "Wachtwoord voor uw diensten",
        "service password helper text": `Dit wachtwoord is nodig om in te loggen op al uw diensten.
            Het wordt automatisch gegenereerd en regelmatig vernieuwd.`,
        "not yet defined": "Niet gedefinieerd",
        "reset helper dialogs": "Instructievensters opnieuw initialiseren",
        "reset": "Opnieuw initialiseren",
        "reset helper dialogs helper text":
            "De berichtvensters waarvan u heeft gevraagd ze niet meer weer te geven, opnieuw initialiseren"
    },
    "MyFiles": {
        "page title - my files": "Mijn bestanden",
        "page title - my secrets": "My Secrets",
        "what this page is used for - my files": "Sla hier uw gegevensbestanden op.",
        "what this page is used for - my secrets":
            "Sla hier geheimen op die toegankelijk zullen zijn als omgevingsvariabelen in uw diensten.",
        "help content": ({ accountTabLink, docHref }) => (
            <>
                Lezen{" "}
                <MuiLink href={docHref} target="_blank">
                    onze documentatie
                </MuiLink>
                . &nbsp;
                <MuiLink {...accountTabLink}>Minio-clients instellen</MuiLink>.
            </>
        )
    },
    "MySecrets": {
        "page title - my files": "Mijn bestanden",
        "page title - my secrets": "My Secrets",
        "what this page is used for - my files": "Sla hier uw gegevensbestanden op.",
        "what this page is used for - my secrets":
            "Sla hier geheimen op die toegankelijk zullen zijn als omgevingsvariabelen in uw diensten.",
        "learn more - my files": "Voor meer informatie over het gebruik van opslag S3,",
        "help content": ({ accountTabLink, docHref }) => (
            <>
                Lezen{" "}
                <MuiLink href={docHref} target="_blank">
                    onze documentatie
                </MuiLink>
                . &nbsp;
                <MuiLink {...accountTabLink}>Uw lokale Vault CLI instellen</MuiLink>.
            </>
        )
    },
    "ExplorerItem": {
        "description": "beschrijving"
    },
    "SecretsExplorerItem": {
        "description": "beschrijving"
    },
    "ExplorerButtonBar": {
        "file": "bestand",
        "secret": "geheim",
        "delete": "verwijderen",
        "create secret": "Nieuw geheim",
        "upload file": "Een bestand uploaden",
        "copy path": "De naam van het S3-object kopiëren",
        "create directory": "Nieuwe map",
        "refresh": "vernieuwen",
        "create what": ({ what }) => `Nieuw ${what}`,
        "new": "Nieuw"
    },
    "SecretsExplorerButtonBar": {
        "file": "bestand",
        "secret": "geheim",
        "rename": "hernoemen",
        "delete": "verwijderen",

        "create secret": "Nieuw geheim",
        "upload file": "Een bestand uploaden",
        "copy path": "Gebruiken binnen de dienst",
        "create directory": "Nieuwe map",
        "refresh": "vernieuwen",
        "create what": ({ what }) => `Nieuw ${what}`,
        "new": "Nieuw"
    },
    "Explorer": {
        "file": "bestand",
        "secret": "geheim",
        "create": "creëren",
        "cancel": "annuleren",
        "delete": "verwijderen",
        "do not display again": "Niet meer weergeven",

        "untitled what": ({ what }) => `${what}_naamloos`,
        "directory": "map",
        "deletion dialog title": ({ deleteWhat }) => `Een ${deleteWhat} verwijderen ?`,
        "deletion dialog body": ({ deleteWhat }) => `
            Je staat op het punt om een ${deleteWhat} te verwijderen. 
            Deze actie zal resulteren in het mogelijke verlies van de gegevens gekoppeld aan deze ${deleteWhat}.
            `,
        "already a directory with this name": "Er bestaat al een map met deze naam",
        "can't be empty": "Kan niet leeg zijn",
        "new directory": "Nieuwe map"
    },
    "SecretsExplorer": {
        "file": "bestand",
        "secret": "geheim",
        "cancel": "annuleren",
        "delete": "verwijderen",
        "do not display again": "Niet meer weergeven",
        "untitled what": ({ what }) => `${what}_naamloos`,
        "directory": "map",
        "deletion dialog title": ({ deleteWhat }) => `Een ${deleteWhat} verwijderen ?`,
        "deletion dialog body": ({ deleteWhat }) => `
            Je staat op het punt om een ${deleteWhat} te verwijderen. 
            Deze actie zal resulteren in het mogelijke verlies van de gegevens gekoppeld aan deze ${deleteWhat}.
            `,
        "already a directory with this name": "Er bestaat al een map met deze naam",
        "can't be empty": "Kan niet leeg zijn",
        "create": "Creëren",
        "new directory": "Nieuwe map"
    },
    "ExplorerItems": {
        "empty directory": "Deze bestandenlijst is leeg"
    },
    "SecretsExplorerItems": {
        "empty directory": "Deze bestandenlijst is leeg"
    },
    "MySecretsEditor": {
        "do not display again": "Niet meer weergeven",
        "add an entry": "Een variabele toevoegen",
        "environnement variable default name": "NIEUWE_OMGVAR",
        "table of secret": "tabel met geheimen",

        "key column name": "Naam van de variabele",
        "value column name": "Waarde",
        "resolved value column name": "Opgeloste waarde",
        "what's a resolved value": `
            Een omgevingsvariabele kan naar een andere verwijzen, dus als je bijvoorbeeld
            de variabele FIRSTNAME=Louis hebt gedefinieerd, kun je de variabele LASTNAME_COMPLET="$FIRSTNAME"-Dupon definiëren
            die als de opgeloste waarde «Louis-Dupon» zal hebben
            `,
        "unavailable key": "Reeds gebruikt",
        "invalid key empty string": "Een naam is vereist",
        "invalid key _ not valid": "Kan niet juist zijn _",
        "invalid key start with digit": "Mag niet beginnen met een getal",
        "invalid key invalid character": "Ongeldig teken",
        "invalid value cannot eval": "Uitdrukking shell niet geldig",
        "use this secret": "Gebruiken binnen een dienst",

        "use secret dialog title": "Gebruiken binnen een dienst",
        "use secret dialog subtitle": "Het pad van het geheim werd gekopieerd.",
        "use secret dialog body": `
                Als u een dienst start (RStudio, Jupyter), gaat u 
                in het tabblad 'VAULT' en plakt u het pad van het geheim in het daarvoor bestemde veld.
                Uw sleutelwaarden zullen beschikbaar zijn als omgevingsvariabelen.
            `,
        "use secret dialog ok": "Ik heb het begrepen"
    },
    "MySecretsEditorRow": {
        "key input desc": "Naam van de omgevingsvariabele",
        "value input desc": "Waarde van de omgevingsvariabele"
    },
    "ExplorerUploadModalDropArea": {
        "browse files": "uw bestanden raadplegen",
        "drag and drop or": "Slepen en neerzetten of"
    },
    "ExplorerUploadProgress": {
        "over": "op",
        "importing": "importeren"
    },
    "ExplorerUploadModal": {
        "import files": "Bestanden importeren",
        "cancel": "Annuleren",
        "minimize": "Minimaliseren"
    },
    "Header": {
        "login": "Inloggen",
        "logout": "Uitloggen",
        "project": "Project",
        "region": "Regio"
    },
    "App": {
        "reduce": "Verkleinen",
        "home": "Onthaal",
        "account": "Mijn account",
        "catalog": "Catalogus van de diensten",
        "myServices": "Mijn diensten",
        "mySecrets": "Mijn geheimen",
        "myFiles": "Mijn bestanden",
        "divider: services features": "Functionaliteiten met betrekking tot de diensten",
        "divider: external services features":
            "Functionaliteiten met betrekking tot de externe diensten",
        "divider: onyxia instance specific features":
            "Functionaliteiten die specifiek zijn voor deze instantie van Onyxia"
    },
    "Page404": {
        "not found": "Pagina niet gevonden"
    },
    "PortraitModeUnsupported": {
        "portrait mode not supported": "Portretmodus nog niet ondersteund",
        "instructions":
            "Om deze applicatie op uw mobiele telefoon te gebruiken, activeert u de rotatiesensor en draait u uw telefoon."
    },
    "Home": {
        "welcome": ({ who }) => `Welkom ${who}!`,
        "title": "Welkom in het datalab",
        "login": "Inloggen",
        "new user": "Nieuwe gebruiker van het datalab ?",
        "subtitle": "Werk met Python of R en krijg de kracht die je nodig hebt !",
        "cardTitle1": "Een ergonomische omgeving en diensten op aanvraag",
        "cardTitle2": "Een actieve en enthousiaste gemeenschap die naar u luistert",
        "cardTitle3": "Snelle, flexibele, online opslagplaats van gegevens",
        "cardText1":
            "Analyseer gegevens, voer gedistribueerde berekeningen uit en geniet van een brede waaier aan diensten. Reserveer de rekencapaciteit die u nodig hebt.",
        "cardText2":
            "Profiteer van de beschikbare bronnen en deel deze met anderen:  handleidingen, opleidingen en uitwisselingskanalen.",
        "cardText3":
            "Om gemakkelijk toegang te krijgen tot uw gegevens en gegevens die u ter beschikking worden gesteld vanuit uw programma's - Implementatie API S3",
        "cardButton1": "De catalogus raadplegen",
        "cardButton2": "Lid worden van de gemeenschap",
        "cardButton3": "Gegevens raadplegen"
    },
    "CatalogExplorerCard": {
        "launch": "Opstarten",
        "learn more": "Meer weten ?"
    },
    "CatalogExplorerCards": {
        "show more": "Alles weergeven",
        "no service found": "Dienst niet gevonden",
        "no result found": ({ forWhat }) => `Geen resultaat gevonden voor ${forWhat}`,
        "check spelling": `Controleer of de naam van de dienst correct is gespeld
            of probeer uw zoekopdracht uit te breiden.`,
        "go back": "Terug naar de voornaamste diensten",
        "main services": "Voornaamste diensten",
        "all services": "Alle diensten",
        "search results": "Resultaten van de zoekopdracht",
        "search": "Zoeken"
    },
    "Catalog": {
        "header text1": "Catalogus van de diensten",
        "header text2":
            "Ontdek, start en configureer diensten in slechts een paar klikken.",
        "contribute to the catalog": ({ catalogName }) => (
            <>Bijdragen tot de catalogus {catalogName}</>
        ),
        "contribute to the package": ({ packageName }) =>
            `Toegang krijgen tot de packagebronnen ${packageName} `,
        "here": "hier"
    },
    "CatalogLauncher": {
        "no longer bookmarked dialog title": "Niet opgeslagen wijzigingen",
        "no longer bookmarked dialog body":
            "Klik opnieuw op het symbool van de bladwijzer om de opgeslagen configuratie bij te werken.",
        "ok": "Ok",
        "should overwrite configuration dialog title": "Wilt u het vervangen ?",
        "should overwrite configuration dialog subtitle": ({ friendlyName }) =>
            `«${friendlyName}» bestaat al in uw opgeslagen diensten.`,
        "should overwrite configuration dialog body":
            "Er bestaat al een geregistreerde dienst met dezelfde naam. Als u deze vervangt, gaat de oorspronkelijke inhoud verloren.",
        "cancel": "Annuleren",
        "replace": "Vervangen",
        "sensitive configuration dialog title":
            "Deze dienst uitvoeren kan gevaarlijk zijn",
        "proceed to launch": "Bewust uitvoeren",
        "auto launch disabled dialog title": "Deze dienst uitvoeren kan gevaarlijk zijn",
        "auto launch disabled dialog body": (
            <>
                <g>WAARSCHUWING</g>: Iemand zou kunnen proberen je te misleiden om een
                dienst te starten die de integriteit van je namespace in gevaar kan
                brengen.
                <br />
                Controleer de configuratie van de dienst zorgvuldig voordat je deze start.
                <br />
                Als je twijfels hebt, neem dan contact op met je beheerder.
            </>
        )
    },
    "Footer": {
        "contribute": "Bijdragen aan het project",
        "terms of service": "Gebruiksvoorwaarden",
        "change language": "Taal wijzigen",
        "dark mode switch": "Schakelaar voor donkere modus"
    },
    "CatalogLauncherMainCard": {
        "card title": "Uw eigen dienst aanmaken",
        "friendly name": "Gepersonaliseerde naam",
        "launch": "Opstarten",
        "cancel": "Annuleren",
        "copy url helper text": "URL kopiëren om deze configuratie te herstellen",
        "save configuration": "Deze configuratie opslaan",
        "share the service": "De dienst delen",
        "share the service - explain":
            "De dienst beschikbaar maken voor de medewerkers van de groep",
        "restore all default": "Configuraties opnieuw initialiseren"
    },
    "CatalogLauncherConfigurationCard": {
        "global config": "Globale configuraties",
        "configuration": ({ packageName }) => `Configuratie ${packageName}`,
        "dependency": ({ dependencyName }) => `Afhankelijkheid ${dependencyName}`,
        "launch of a service": ({ dependencyName }) =>
            `Een dienst starten ${dependencyName}`,
        "mismatching pattern": ({ pattern }) => `Moet ${pattern} naleven`,
        "Invalid YAML Object": "Ongeldig YAML-object",
        "Invalid YAML Array": "Ongeldige YAML-tabel"
    },
    "MyServices": {
        "text1": "Mijn diensten",
        "text2":
            "Snel uw verschillende diensten in uitvoering starten, bekijken en beheren.",
        "text3": "We raden u aan uw diensten te verwijderen na elke werksessie.",
        "running services": "Diensten in uitvoering",
        "confirm delete title": "Bent u zeker?",
        "confirm delete subtitle":
            "Zorg ervoor dat uw diensten geen onopgeslagen werk bevatten.",
        "confirm delete body":
            "Vergeet niet om uw code naar GitHub of GitLab te pushen voordat u verder gaat.",
        "confirm delete body shared services":
            "Opgelet, sommige van uw diensten worden gedeeld met andere projectleden.",
        "cancel": "Annuleren",
        "confirm": "Ja, verwijderen"
    },
    "MyServicesButtonBar": {
        "refresh": "Vernieuwen",
        "launch": "Nieuwe dienst",
        "password": "Wachtwoord kopiëren",
        "trash": "Alles verwijderen",
        "trash my own": "Al mijn diensten verwijderen"
    },
    "MyServicesCard": {
        "service": "Dienst",
        "running since": "In uitvoering sinds : ",
        "open": "openen",
        "readme": "readme",
        "shared by you": "gedeeld door u",
        "which token expire when": ({ which, howMuchTime }) =>
            `Het token ${which} vervalt ${howMuchTime}.`,
        "which token expired": ({ which }) => `Het token ${which} is vervallen.`,
        "reminder to delete services":
            "Vergeet niet uw diensten te verwijderen na gebruik.",
        "this is a shared service": "Deze dienst wordt gedeeld binnen het project"
    },
    "MyServicesRunningTime": {
        "launching": "In uitvoering..."
    },
    "MyServicesSavedConfigOptions": {
        "edit": "Wijzigen",
        "copy link": "URL kopiëren",
        "remove bookmark": "Verwijderen"
    },
    "MyServicesSavedConfig": {
        "edit": "Wijzigen",
        "launch": "Opstarten"
    },
    "MyServicesSavedConfigs": {
        "saved": "Opgeslagen",
        "show all": "Alles weergeven"
    },
    "MyServicesCards": {
        "running services": "Diensten in uitvoering",
        "no services running": "U heeft momenteel geen dienst in uitvoering",
        "launch one": "Klik hier om er een te starten",
        "ok": "ok",
        "need to copy": "Wilt u de niet-afgeknotte waarden kopiëren ?",
        "everything have been printed to the console": "Alles is gelogd in de terminal",
        "first copy the password": "Begin met het kopiëren van het wachtwoord...",
        "open the service": "De dienst openen 🚀",
        "return": "Terug"
    }
    /* spell-checker: enable */
};
