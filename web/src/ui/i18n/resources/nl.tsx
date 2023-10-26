import type { Translations } from "../types";
import MuiLink from "@mui/material/Link";
import { Markdown } from "onyxia-ui/Markdown";
import { elementsToSentence } from "ui/tools/elementsToSentence";

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
        "credentials section title": "Verbind met de Kubernetes-cluster",
        "credentials section helper":
            "Inloggegevens om direct te communiceren met de Kubernetes API-server.",
        "init script section title": "Shell-script",
        "init script section helper": ({ installKubectlUrl }) => (
            <>
                Dit script maakt het mogelijk om kubectl of helm op je lokale machine te
                gebruiken. <br />
                Om het te gebruiken,{" "}
                <MuiLink href={installKubectlUrl} target="_blank">
                    installeer gewoon kubectl op je machine
                </MuiLink>{" "}
                en voer het script uit door het te kopiëren en plakken in je terminal.
                <br />
                Nadat je dit hebt gedaan, kun je bevestigen dat het werkt door het
                commando&nbsp;
                <code>kubectl get pods</code> of <code>helm list</code> uit te voeren
            </>
        ),
        "expires in": ({ howMuchTime }) =>
            `Deze inloggegevens zijn geldig voor de komende ${howMuchTime}`
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
        "dev mode helper": "Functionaliteiten in ontwikkeling activeren",
        "Enable command bar": "Schakel opdrachtbalk in",
        "Enable command bar helper": ({ imgUrl }) => (
            <>
                De{" "}
                <MuiLink href={imgUrl} target="_blank">
                    opdrachtbalk
                </MuiLink>{" "}
                geeft je inzicht in de commando's die namens jou worden uitgevoerd wanneer
                je met de UI interageert.
            </>
        )
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
    "Catalog": {
        "header text1": "Catalogus van de diensten",
        "header text2":
            "Ontdek, start en configureer diensten in slechts een paar klikken.",
        "header help": ({ catalogName, catalogDescription, repositoryUrl }) => (
            <>
                Je bent het Helm Chart Repository aan het verkennen{" "}
                <MuiLink href={repositoryUrl} target="_blank">
                    {catalogName}: {catalogDescription}
                </MuiLink>
            </>
        ),
        "here": "hier",
        "show more": "Alles weergeven",
        "no service found": "Dienst niet gevonden",
        "no result found": ({ forWhat }) => `Geen resultaat gevonden voor ${forWhat}`,
        "check spelling": `Controleer of de naam van de dienst correct is gespeld
            of probeer uw zoekopdracht uit te breiden.`,
        "go back": "Terug naar de voornaamste diensten",
        "search results": "Resultaten van de zoekopdracht",
        "search": "Zoeken"
    },
    "CatalogChartCard": {
        "launch": "Opstarten",
        "learn more": "Meer weten ?"
    },
    "CatalogNoSearchMatches": {
        "no service found": "Dienst niet gevonden",
        "no result found": ({ forWhat }) => `Geen resultaat gevonden voor ${forWhat}`,
        "check spelling": `Controleer of de naam van de dienst correct is gespeld
            of probeer uw zoekopdracht uit te breiden.`,
        "go back": "Terug naar de voornaamste diensten"
    },
    "Launcher": {
        "header text1": "Catalogus van de diensten",
        "header text2":
            "Ontdek, start en configureer diensten in slechts een paar klikken.",
        "chart sources": ({ chartName, urls }) =>
            urls.length === 0 ? (
                <></>
            ) : (
                <>
                    Toegang tot de bron{urls.length === 1 ? "" : "nen"} van de grafiek{" "}
                    {chartName}:&nbsp;
                    {elementsToSentence({
                        "elements": urls.map(source => (
                            <MuiLink href={source} target="_blank" underline="hover">
                                hier
                            </MuiLink>
                        )),
                        "language": "nl"
                    })}
                </>
            ),
        "download as script": "Downloaden als script",
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
            >{`We hebben de commandobalk ontworpen om jou volledige controle te geven over je Kubernetes-implementaties.
Hier is wat je moet weten:

#### Wat zijn die Helm-opdrachten?

Deze opdrachten zijn de exacte Helm-opdrachten die de Onyxia API namens jou zal uitvoeren in je Kubernetes-namespace.
Dit stelt je in staat om te begrijpen wat er achter de schermen gebeurt wanneer je met de UI omgaat.

#### Real-time updates

Als je met de UI omgaat, zullen de Helm-opdrachten automatisch bijwerken om te weerspiegelen wat je doet.

#### Waarom zou ik hierom geven?

- **Transparantie:** We geloven dat je het recht hebt om te weten welke acties worden uitgevoerd in jouw omgeving.
- **Leren:** Inzicht in deze opdrachten kan je meer kennis geven over Kubernetes en Helm.
- **Handmatige uitvoering:** Je kunt deze opdrachten kopiëren en plakken in een terminal met schrijftoegang tot Kubernetes, zodat je de service handmatig kunt starten.

#### Hoe kan ik deze opdrachten handmatig uitvoeren?

${
    k8CredentialsHref === undefined
        ? ""
        : "Er zijn twee manieren om deze opdrachten uit te voeren:  "
}

${
    k8CredentialsHref === undefined
        ? ""
        : `
- **Lokale terminal:** Ga naar [\`Mijn account -> Kubernetes-tabblad\`](${k8CredentialsHref}).
  Hier vind je de inloggegevens waarmee je opdrachten in je Kubernetes-namespace kunt uitvoeren vanaf je lokale terminal.
`
}

- Als deze Onyxia-instantie diensten zoals VSCode of Jupyter aanbiedt, kun je een terminal openen binnen deze diensten en daar de opdrachten uitvoeren.
  Voor constructieve of destructieve opdrachten moet je jouw service starten met de Kubernetes-rol \`admin\` of \`edit\`.

Door de opdracht handmatig uit te voeren, kun je de service nog steeds zien op de [\`Mijn Diensten\`](${myServicesHref}) pagina alsof het via de UI was gestart.

Je kunt de commandobalk uitschakelen in het tabblad [\`Mijn Account -> Interface voorkeur\`](${interfacePreferenceHref}).

Voel je vrij om te verkennen en de controle over je Kubernetes-implementaties te nemen!
        `}</Markdown>
        )
    },
    "AcknowledgeSharingOfConfigConfirmDialog": {
        "acknowledge sharing of config confirm dialog title":
            "Wees bewust, configuraties worden gedeeld",
        "acknowledge sharing of config confirm dialog subtitle": ({
            groupProjectName
        }) => `Als je
        deze configuratie opslaat, zal elk lid van het project ${groupProjectName} in staat zijn om het te starten.`,
        "acknowledge sharing of config confirm dialog body": `Hoewel er geen persoonlijke informatie automatisch is ingevoegd
        door Onyxia, wees voorzichtig om geen gevoelige informatie te delen in de herstelbare configuratie.`,
        "cancel": "Annuleren",
        "i understand, proceed": "Ik begrijp het, ga verder"
    },
    "AutoLaunchDisabledDialog": {
        "ok": "Ok",
        "auto launch disabled dialog title": "Deze dienst uitvoeren kan gevaarlijk zijn",
        "auto launch disabled dialog body": (
            <>
                <b>WAARSCHUWING</b>: Iemand zou kunnen proberen je te misleiden om een
                dienst te starten die de integriteit van je namespace in gevaar kan
                brengen.
                <br />
                Controleer de configuratie van de dienst zorgvuldig voordat je deze start.
                <br />
                Als je twijfels hebt, neem dan contact op met je beheerder.
            </>
        )
    },
    "NoLongerBookmarkedDialog": {
        "no longer bookmarked dialog title": "Niet opgeslagen wijzigingen",
        "no longer bookmarked dialog body":
            "Klik opnieuw op het symbool van de bladwijzer om de opgeslagen configuratie bij te werken.",
        "ok": "Ok"
    },
    "SensitiveConfigurationDialog": {
        "cancel": "Annuleren",
        "sensitive configuration dialog title":
            "Deze dienst uitvoeren kan gevaarlijk zijn",
        "proceed to launch": "Bewust uitvoeren"
    },
    "LauncherMainCard": {
        "card title": "Uw eigen dienst aanmaken",
        "friendly name": "Gepersonaliseerde naam",
        "launch": "Opstarten",
        "cancel": "Annuleren",
        "copy url helper text": "URL kopiëren om deze configuratie te herstellen",
        "share the service": "De dienst delen",
        "share the service - explain":
            "De dienst beschikbaar maken voor de medewerkers van de groep",
        "restore all default": "Configuraties opnieuw initialiseren",
        "bookmark button": ({ isBookmarked }) =>
            `${isBookmarked ? "Verwijderen" : "Opslaan"} configuratie`,
        "bookmark button tooltip": ({ myServicesSavedConfigsExtendedLink }) => (
            <>
                Opgeslagen configuraties kunnen snel opnieuw worden gestart vanaf de
                pagina&nbsp;
                <MuiLink {...myServicesSavedConfigsExtendedLink} target="_blank">
                    Mijn Diensten
                </MuiLink>
            </>
        ),
        "version select label": "Versie",
        "version select helper text": ({
            chartName,
            catalogRepositoryUrl,
            catalogName
        }) => (
            <>
                Versie van de Chart {chartName} in de&nbsp;
                <MuiLink href={catalogRepositoryUrl}>
                    Helm repository {catalogName}
                </MuiLink>
            </>
        ),
        "save changes": "Wijzigingen opslaan"
    },
    "LauncherConfigurationCard": {
        "global config": "Globale configuraties",
        "configuration": ({ packageName }) => `Configuratie ${packageName}`,
        "dependency": ({ dependencyName }) => `Afhankelijkheid ${dependencyName}`,
        "launch of a service": ({ dependencyName }) =>
            `Een dienst starten ${dependencyName}`,
        "mismatching pattern": ({ pattern }) => `Moet ${pattern} naleven`,
        "Invalid YAML Object": "Ongeldig YAML-object",
        "Invalid YAML Array": "Ongeldige YAML-tabel"
    },
    "Footer": {
        "contribute": "Bijdragen aan het project",
        "terms of service": "Gebruiksvoorwaarden",
        "change language": "Taal wijzigen",
        "dark mode switch": "Schakelaar voor donkere modus"
    },
    "MyServices": {
        "text1": "Mijn diensten",
        "text2":
            "Snel uw verschillende diensten in uitvoering starten, bekijken en beheren.",
        "text3": "We raden u aan uw diensten te verwijderen na elke werksessie.",
        "running services": "Diensten in uitvoering"
    },
    "MyServicesConfirmDeleteDialog": {
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
    "MyServicesRestorableConfigOptions": {
        "edit": "Wijzigen",
        "copy link": "URL kopiëren",
        "remove bookmark": "Verwijderen"
    },
    "MyServicesRestorableConfig": {
        "edit": "Wijzigen",
        "launch": "Opstarten"
    },
    "MyServicesRestorableConfigs": {
        "saved": "Opgeslagen",
        "show all": "Alles weergeven"
    },
    "ReadmeAndEnvDialog": {
        "ok": "ok",
        "return": "Terug"
    },
    "CopyOpenButton": {
        "first copy the password": "Klik om het wachtwoord te kopiëren...",
        "open the service": "De dienst openen 🚀"
    },
    "MyServicesCards": {
        "running services": "Diensten in uitvoering"
    },
    "NoRunningService": {
        "launch one": "Klik hier om er een te starten",
        "no services running": "You don't have any service running"
    },
    "CommandBar": {
        "ok": "ok"
    },
    "moment": {
        "date format": ({ isSameYear }) =>
            `dddd, Do MMMM${isSameYear ? "" : " YYYY"}, HH:mm`,
        "past1": ({ divisorKey }) => {
            switch (divisorKey) {
                case "now":
                    return "zojuist";
                case "second":
                    return "een seconde geleden";
                case "minute":
                    return "een minuut geleden";
                case "hour":
                    return "een uur geleden";
                case "day":
                    return "gisteren";
                case "week":
                    return "vorige week";
                case "month":
                    return "vorige maand";
                case "year":
                    return "vorig jaar";
            }
        },
        "pastN": ({ divisorKey }) => {
            switch (divisorKey) {
                case "now":
                    return "zojuist";
                case "second":
                    return "# seconden geleden";
                case "minute":
                    return "# minuten geleden";
                case "hour":
                    return "# uren geleden";
                case "day":
                    return "# dagen geleden";
                case "week":
                    return "# weken geleden";
                case "month":
                    return "# maanden geleden";
                case "year":
                    return "# jaar geleden";
            }
        },
        "future1": ({ divisorKey }) => {
            switch (divisorKey) {
                case "now":
                    return "zojuist";
                case "second":
                    return "over een seconde";
                case "minute":
                    return "over een minuut";
                case "hour":
                    return "over een uur";
                case "day":
                    return "morgen";
                case "week":
                    return "volgende week";
                case "month":
                    return "volgende maand";
                case "year":
                    return "volgend jaar";
            }
        },
        "futureN": ({ divisorKey }) => {
            switch (divisorKey) {
                case "now":
                    return "zojuist";
                case "second":
                    return "over # seconden";
                case "minute":
                    return "over # minuten";
                case "hour":
                    return "over # uren";
                case "day":
                    return "over # dagen";
                case "week":
                    return "over # weken";
                case "month":
                    return "over # maanden";
                case "year":
                    return "over # jaar";
            }
        }
    }
    /* spell-checker: enable */
};
