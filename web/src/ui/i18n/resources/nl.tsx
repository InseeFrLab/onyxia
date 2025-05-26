import type { Translations } from "../types";
import MuiLink from "@mui/material/Link";
import { Markdown } from "ui/shared/Markdown";
import { Icon } from "onyxia-ui/Icon";
import { getIconUrlByName } from "lazy-icons";
import { capitalize } from "tsafe/capitalize";
import { MaybeLink } from "ui/shared/MaybeLink";

export const translations: Translations<"nl"> = {
    /* spell-checker: disable */
    Account: {
        profile: "Profiel",
        git: undefined,
        storage: "Verbinding met opslag",
        k8sCodeSnippets: "Verbinding met Kubernetes",
        "user-interface": "Interfacemodi",
        text1: "Mijn account",
        text2: "Toegang tot uw accountgegevens.",
        text3: "Uw gebruikersnamen, e-mails, wachtwoorden en persoonlijke toegangstokens die direct verbonden zijn aan uw diensten configureren.",
        "personal tokens tooltip": 'Of "token" in het Engels.',
        vault: "Vault"
    },
    AccountProfileTab: {
        "user id": "Gebruikers-ID",
        "full name": "Naam",
        email: "E-mail",
        "account management": "Accountbeheer"
    },
    AccountGitTab: {
        gitName: "Gebruikersnaam voor Git",
        "gitName helper text": ({ gitName, focusClassName }) => (
            <>
                Dit commando zal je globale Git-gebruikersnaam instellen, uitgevoerd bij
                het opstarten van de service:&nbsp;
                <code className={focusClassName}>
                    git config --global user.name "{gitName || "<jouw_gebruikersnaam>"}"
                </code>
            </>
        ),
        gitEmail: "E-mail voor Git",
        "gitEmail helper text": ({ gitEmail, focusClassName }) => (
            <>
                Dit commando zal je globale Git-e-mailadres instellen, uitgevoerd bij het
                opstarten van de service:&nbsp;
                <code className={focusClassName}>
                    git config --global user.email "{gitEmail || "<jouw_email@domain.nl>"}
                    "
                </code>
            </>
        ),
        githubPersonalAccessToken: "Persoonlijke toegangstoken voor Git Forge",
        "githubPersonalAccessToken helper text": ({ focusClassName }) => (
            <>
                Door dit token te verstrekken, kun je zonder opnieuw je inloggegevens van
                je forge in te voeren, klonen en pushen naar je privé GitHub of GitLab
                repositories.
                <br />
                Dit token zal ook beschikbaar zijn als een omgevingsvariabele:&nbsp;
                <span className={focusClassName}>$GIT_PERSONAL_ACCESS_TOKEN</span>
            </>
        )
    },
    AccountStorageTab: {
        "credentials section title": "Uw gegevens verbinden met uw diensten",
        "credentials section helper":
            "Opslag object MinIO compatible Amazon (AWS S3). Deze informatie is al automatisch ingevuld.",
        "accessible as env": "Toegankelijk binnen uw diensten als omgevingsvariabele",
        "init script section title":
            "Om toegang te krijgen tot opslag buiten de diensten van het datalab",
        "init script section helper": `Download of kopieer het initialisatiescript in de programmeertaal van uw keuze.`,
        "expires in": ({ howMuchTime }) => `Vervalt binnen ${howMuchTime}`
    },
    AccountKubernetesTab: {
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
    AccountVaultTab: {
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
    ProjectSettings: {
        "page header title": "Projectinstellingen",
        "page header help title": ({ groupProjectName }) =>
            groupProjectName === undefined
                ? "Instellingen van uw persoonlijke project"
                : `Instellingen voor "${groupProjectName}"`,
        "page header help content": ({
            groupProjectName,
            doesUserBelongToSomeGroupProject
        }) => (
            <>
                Deze pagina stelt u in staat de instellingen te configureren die van
                toepassing zijn op
                {groupProjectName === undefined
                    ? " uw persoonlijke project"
                    : ` het ${groupProjectName} project`}
                .
                <br />
                {groupProjectName !== undefined && (
                    <>
                        Wees u ervan bewust dat {groupProjectName} een groepsproject is
                        gedeeld met andere gebruikers; de wijzigingen die u hier
                        aanbrengt, zijn van toepassing op alle leden van het project.
                        <br />
                    </>
                )}
                {doesUserBelongToSomeGroupProject && (
                    <>
                        U kunt tussen uw projecten wisselen via het dropdownmenu in de
                        kop.
                        <br />
                    </>
                )}
                Let op: alleen de beheerder van uw Onyxia instantie kan nieuwe projecten
                aanmaken.
            </>
        ),
        "security-info": "Veiligheidsinformatie",
        "s3-configs": "S3-configuraties"
    },
    ProjectSettingsS3ConfigTab: {
        "add custom config": "Voeg een aangepaste S3-configuratie toe"
    },
    S3ConfigCard: {
        "data source": "Gegevensbron",
        credentials: "Inloggegevens",
        "sts credentials": "Dynamisch aangevraagde tokens namens u door Onyxia (STS)",
        account: "Account",
        "use in services": "Gebruiken in diensten",
        "use in services helper": `Indien ingeschakeld, zal deze configuratie standaard worden gebruikt in uw diensten die een S3-integratie implementeren.`,
        "use for onyxia explorers": "Gebruiken voor Onyxia-verkenners",
        "use for onyxia explorers helper": `Indien ingeschakeld zal deze configuratie worden gebruikt
            door de bestandsverkenner en de gegevensverkenner.`,
        edit: "Bewerken",
        delete: "Verwijderen"
    },
    AddCustomS3ConfigDialog: {
        "dialog title": "Nieuwe aangepaste S3-configuratie",
        "dialog subtitle":
            "Specificeer een aangepast serviceaccount of verbind met een andere S3-compatibele service",
        cancel: "Annuleren",
        "save config": "Configuratie opslaan",
        "update config": "Configuratie bijwerken",
        "is required": "Dit veld is verplicht",
        "must be an url": "Geen geldige URL",
        "not a valid access key id": "Dit lijkt geen geldige toegangssleutel-ID te zijn",
        "url textField label": "URL",
        "url textField helper text": "URL van de S3-service",
        "region textField label": "AWS S3 Regio",
        "region textField helper text":
            "Voorbeeld: eu-west-1, laat leeg indien niet zeker",
        "workingDirectoryPath textField label": "Pad van werkdirectory",
        "workingDirectoryPath textField helper text": (
            <>
                Hiermee kunt u de bucket en het S3-objectprefix specificeren dat u bezit
                op de S3-service. <br />
                Voorbeeld: <code>mijn-bucket/mijn-prefix/</code> of{" "}
                <code>alleen mijn-bucket/</code> als u de hele bucket bezit.
            </>
        ),
        "account credentials": "Accountgegevens",
        "friendlyName textField label": "Configuratienaam",
        "friendlyName textField helper text":
            "Dit helpt je alleen om deze configuratie te identificeren. Voorbeeld: Mijn AWS-bucket",

        "isAnonymous switch label": "Anonieme toegang",
        "isAnonymous switch helper text":
            "Zet op AAN als er geen geheime toegangssleutel nodig is",

        "accessKeyId textField label": "Toegangssleutel-ID",
        "accessKeyId textField helper text": "Voorbeeld: 1A2B3C4D5E6F7G8H9I0J",
        "secretAccessKey textField label": "Geheime toegangssleutel",
        "sessionToken textField label": "Sessietoken",
        "sessionToken textField helper text":
            "Optioneel, laat leeg als u het niet zeker weet",
        "url style": "URL-stijl",
        "url style helper text": `Specificeer hoe uw S3-server de URL formatteert voor het downloaden van bestanden.`,
        "path style label": ({ example }) => (
            <>
                Padstijl
                {example !== undefined && (
                    <>
                        :&nbsp;
                        <code>{example}mijn-dataset.parquet</code>
                    </>
                )}
            </>
        ),
        "virtual-hosted style label": ({ example }) => (
            <>
                Virtueel-gehoste stijl
                {example !== undefined && (
                    <>
                        :&nbsp;
                        <code>{example}mijn-dataset.parquet</code>
                    </>
                )}
            </>
        )
    },
    TestS3ConnectionButton: {
        "test connection": "Verbinding testen",
        "test connection failed": ({ errorMessage }) => (
            <>
                Verbindingstest mislukt met fout: <br />
                {errorMessage}
            </>
        )
    },
    AccountUserInterfaceTab: {
        title: "De interfacemodus configureren",
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
    SettingField: {
        "copy tooltip": "Kopiëren naar klembord",
        language: "Taal wijzigen",
        "service password": "Standaard service wachtwoord",
        "service password helper text": ({ groupProjectName }) => (
            <>
                Dit is het standaardwachtwoord dat wordt gebruikt om uw draaiende diensten
                te beschermen. <br />
                Wanneer u een dienst start, wordt het wachtwoordveld in het
                beveiligingstabblad automatisch ingevuld met dit wachtwoord. <br />
                Door te klikken op het{" "}
                <Icon size="extra small" icon={getIconUrlByName("Refresh")} /> icoon wordt
                een nieuw willekeurig wachtwoord gegenereerd. Wees u er echter van bewust
                dat het niet het wachtwoord voor diensten die al draaien zal bijwerken.{" "}
                <br />
                Het service wachtwoord is wat Onyxia u laat kopiëren naar uw klembord
                voordat u toegang krijgt tot een draaiende dienst. <br />
                {groupProjectName !== undefined && (
                    <>
                        Let op: dit wachtwoord wordt gedeeld met alle leden van het
                        project ({groupProjectName}).
                    </>
                )}
            </>
        ),
        "not yet defined": "Niet gedefinieerd",
        "reset helper dialogs": "Instructievensters opnieuw initialiseren",
        reset: "Opnieuw initialiseren",
        "reset helper dialogs helper text":
            "De berichtvensters waarvan u heeft gevraagd ze niet meer weer te geven, opnieuw initialiseren"
    },
    FileExplorer: {
        "page title - my files": "Bestandsverkenner",
        "what this page is used for - my files": "Sla hier uw gegevensbestanden op.",
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
    MyFiles: {
        "page title - my files": "Mijn bestanden",
        "what this page is used for - my files": "Sla hier uw gegevensbestanden op.",
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
    MyFilesDisabledDialog: {
        "dialog title": "Geen S3-server geconfigureerd",
        "dialog body":
            "Er is geen S3-server geconfigureerd voor deze instantie. Je kunt er echter handmatig een toevoegen om de S3-bestandsverkenner in te schakelen.",
        cancel: "Annuleren",
        "go to settings": "Ga naar instellingen"
    },
    ShareDialog: {
        title: "Deel je gegevens",
        close: "Sluiten",
        "create and copy link": "Link maken en kopiëren",
        "paragraph current policy": ({ isPublic }) =>
            isPublic
                ? "Je bestand is openbaar, iedereen met de link kan het downloaden."
                : "Je bestand is momenteel privé.",

        "paragraph change policy": ({ isPublic }) =>
            isPublic
                ? "Om toegang te beperken, verander de deelstatus van je bestand."
                : "Om toegang te geven tot je bestand, verander de deelstatus of maak een tijdelijke toegangslink.",

        "hint link access": ({ isPublic, expiration }) =>
            isPublic
                ? "Je link is beschikbaar zolang het bestand openbaar is."
                : `Deze link geeft toegang tot je gegevens gedurende ${expiration}.`,
        "label input link": "Toegangslink"
    },
    SelectTime: {
        "validity duration label": "Geldigheidsduur"
    },
    MySecrets: {
        "page title - my secrets": "My Secrets",
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
                <MuiLink {...accountTabLink}>
                    Uw lokale Vault CLI instellen
                </MuiLink>.
            </>
        )
    },
    ExplorerItem: {
        description: "beschrijving"
    },
    SecretsExplorerItem: {
        description: "beschrijving"
    },
    ExplorerButtonBar: {
        file: "bestand",
        delete: "verwijderen",
        "upload file": "Een bestand uploaden",
        "copy path": "De naam van het S3-object kopiëren",
        "create directory": "Nieuwe map",
        refresh: "vernieuwen",
        "download directory": "Downloaden",
        new: "Nieuw",
        share: "Delen",
        "alt list view": "Toon lijst",
        "alt block view": "Toon blok"
    },
    ExplorerDownloadSnackbar: {
        "download preparation": "Voorbereiding van de download ..."
    },
    SecretsExplorerButtonBar: {
        secret: "geheim",
        rename: "hernoemen",
        delete: "verwijderen",
        "create secret": "Nieuw geheim",
        "copy path": "Gebruiken binnen de dienst",
        "create directory": "Nieuwe map",
        refresh: "vernieuwen",
        "create what": ({ what }) => `Nieuw ${what}`,
        new: "Nieuw"
    },
    Explorer: {
        file: "bestand",
        secret: "geheim",
        create: "creëren",
        cancel: "annuleren",
        delete: "verwijderen",
        "do not display again": "Niet meer weergeven",

        "untitled what": ({ what }) => `${what}_naamloos`,
        directory: "map",
        multiple: "items",
        "deletion dialog title": ({ deleteWhat, isPlural }) =>
            `${isPlural ? "Deze" : "Dit"} ${deleteWhat} verwijderen?`,
        "deletion dialog body": ({ deleteWhat, isPlural }) => `
        U staat op het punt om ${isPlural ? "deze" : "dit"} ${deleteWhat} te verwijderen.
        Deze actie kan leiden tot het verlies van gegevens die gekoppeld zijn aan ${isPlural ? "deze" : "dit"} ${deleteWhat}.
        `,
        "already a directory with this name": "Er bestaat al een map met deze naam",
        "can't be empty": "Kan niet leeg zijn",
        "new directory": "Nieuwe map"
    },
    ListExplorerItems: {
        "header name": "Naam",
        "header modified date": "Gewijzigd",
        "header size": "Grootte",
        "header policy": "Beleid"
    },
    SecretsExplorer: {
        file: "bestand",
        secret: "geheim",
        cancel: "annuleren",
        delete: "verwijderen",
        "do not display again": "Niet meer weergeven",
        "untitled what": ({ what }) => `${what}_naamloos`,
        directory: "map",
        "deletion dialog title": ({ deleteWhat }) => `Een ${deleteWhat} verwijderen ?`,
        "deletion dialog body": ({ deleteWhat }) => `
            Je staat op het punt om een ${deleteWhat} te verwijderen. 
            Deze actie zal resulteren in het mogelijke verlies van de gegevens gekoppeld aan deze ${deleteWhat}.
            `,
        "already a directory with this name": "Er bestaat al een map met deze naam",
        "can't be empty": "Kan niet leeg zijn",
        create: "Creëren",
        "new directory": "Nieuwe map"
    },
    ExplorerItems: {
        "empty directory": "Deze bestandenlijst is leeg"
    },

    SecretsExplorerItems: {
        "empty directory": "Deze bestandenlijst is leeg"
    },
    MySecretsEditor: {
        "do not display again": "Niet meer weergeven",
        "add an entry": "Een variabele toevoegen",
        "environnement variable default name": "NIEUWE_OMGVAR",
        "table of secret": "tabel met geheimen",

        "key column name": "Naam van de variabele",
        "value column name": "Waarde",
        "unavailable key": "Reeds gebruikt",
        "invalid key empty string": "Een naam is vereist",
        "invalid key _ not valid": "Kan niet juist zijn _",
        "invalid key start with digit": "Mag niet beginnen met een getal",
        "invalid key invalid character": "Ongeldig teken",
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
    MySecretsEditorRow: {
        "key input desc": "Naam van de omgevingsvariabele",
        "value input desc": "Waarde van de omgevingsvariabele"
    },
    ExplorerUploadModalDropArea: {
        "browse files": "uw bestanden raadplegen",
        "drag and drop or": "Slepen en neerzetten of"
    },
    ExplorerUploadProgress: {
        over: "op",
        importing: "importeren"
    },
    ExplorerUploadModal: {
        "import files": "Bestanden importeren",
        cancel: "Annuleren",
        minimize: "Minimaliseren"
    },
    Header: {
        login: "Inloggen",
        logout: "Uitloggen",
        project: "Project",
        region: "Regio"
    },
    LeftBar: {
        reduce: "Verkleinen",
        home: "Onthaal",
        account: "Mijn account",
        projectSettings: "Projectinstellingen",
        catalog: "Catalogus van de diensten",
        myServices: "Mijn diensten",
        mySecrets: "Mijn geheimen",
        myFiles: "Mijn bestanden",
        "divider: services features": "Functionaliteiten met betrekking tot de diensten",
        "divider: external services features":
            "Functionaliteiten met betrekking tot de externe diensten",
        "divider: onyxia instance specific features":
            "Functionaliteiten die specifiek zijn voor deze instantie van Onyxia",
        dataExplorer: "Data Verkenner",
        fileExplorer: "Bestanden Verkenner",
        sqlOlapShell: "SQL OLAP Shell"
    },
    AutoLogoutCountdown: {
        "are you still there": "Ben je er nog?",
        "you'll soon be automatically logged out":
            "Je wordt binnenkort automatisch uitgelogd."
    },
    Page404: {
        "not found": "Pagina niet gevonden"
    },
    PortraitModeUnsupported: {
        instructions:
            "Om deze applicatie op uw mobiele telefoon te gebruiken, activeert u de rotatiesensor en draait u uw telefoon."
    },
    MaybeAcknowledgeConfigVolatilityDialog: {
        "dialog title": "Wees ervan bewust, configuraties zijn vluchtig",
        "dialog body": `Deze Onyxia-instantie implementeert geen enkel persistentiemechanisme voor het opslaan van configuraties. 
            Alle configuraties worden opgeslagen in de lokale opslag van de browser. Dit betekent dat als u de lokale opslag van uw browser wist 
            of van browser wisselt, u al uw configuraties zult verliezen.`,
        "do not show next time": "Toon dit bericht niet meer",
        cancel: "Annuleren",
        "I understand": "Ik begrijp het"
    },
    Home: {
        "title authenticated": ({ userFirstname }) => `Welkom ${userFirstname}!`,
        title: "Welkom in het datalab",
        login: "Inloggen",
        "new user": "Nieuwe gebruiker van het datalab ?",
        subtitle: "Werk met Python of R en krijg de kracht die je nodig hebt !",
        cardTitle1: "Een ergonomische omgeving en diensten op aanvraag",
        cardTitle2: "Een actieve en enthousiaste gemeenschap die naar u luistert",
        cardTitle3: "Snelle, flexibele, online opslagplaats van gegevens",
        cardText1:
            "Analyseer gegevens, voer gedistribueerde berekeningen uit en geniet van een brede waaier aan diensten. Reserveer de rekencapaciteit die u nodig hebt.",
        cardText2:
            "Profiteer van de beschikbare bronnen en deel deze met anderen:  handleidingen, opleidingen en uitwisselingskanalen.",
        cardText3:
            "Om gemakkelijk toegang te krijgen tot uw gegevens en gegevens die u ter beschikking worden gesteld vanuit uw programma's - Implementatie API S3",
        cardButton1: "De catalogus raadplegen",
        cardButton2: "Lid worden van de gemeenschap",
        cardButton3: "Gegevens raadplegen"
    },
    Catalog: {
        header: "Catalogus van de diensten",
        "no result found": ({ forWhat }) => `Geen resultaat gevonden voor ${forWhat}`,
        "search results": "Resultaten van de zoekopdracht",
        search: "Zoeken",
        "title all catalog": "Alle"
    },
    CatalogChartCard: {
        launch: "Opstarten",
        "learn more": "Meer weten ?"
    },
    CatalogNoSearchMatches: {
        "no service found": "Dienst niet gevonden",
        "no result found": ({ forWhat }) => `Geen resultaat gevonden voor ${forWhat}`,
        "check spelling": `Controleer of de naam van de dienst correct is gespeld
            of probeer uw zoekopdracht uit te breiden.`,
        "go back": "Terug naar de voornaamste diensten"
    },
    Launcher: {
        sources: ({
            helmChartName,
            helmChartRepositoryName,
            labeledHelmChartSourceUrls
        }) => (
            <>
                De Helm-chart{" "}
                {
                    <MaybeLink href={labeledHelmChartSourceUrls.helmChartSourceUrl}>
                        {helmChartName}
                    </MaybeLink>
                }{" "}
                behoort tot de Helm-chart repository{" "}
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
                        Het is gebaseerd op de Docker-afbeelding{" "}
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
        "download as script": "Downloaden als script",
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
        ),
        form: "Formulier",
        editor: "Teksteditor"
    },
    AcknowledgeSharingOfConfigConfirmDialog: {
        "acknowledge sharing of config confirm dialog title":
            "Wees bewust, configuraties worden gedeeld",
        "acknowledge sharing of config confirm dialog subtitle": ({
            groupProjectName
        }) => `Als je
        deze configuratie opslaat, zal elk lid van het project ${groupProjectName} in staat zijn om het te starten.`,
        "acknowledge sharing of config confirm dialog body": `Hoewel er geen persoonlijke informatie automatisch is ingevoegd
        door Onyxia, wees voorzichtig om geen gevoelige informatie te delen in de herstelbare configuratie.`,
        cancel: "Annuleren",
        "i understand, proceed": "Ik begrijp het, ga verder"
    },
    AutoLaunchDisabledDialog: {
        ok: "Ok",
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
    FormFieldWrapper: {
        "reset to default": "Terugzetten naar standaardwaarden"
    },
    ConfigurationTopLevelGroup: {
        miscellaneous: "Diverse",
        "Configuration that applies to all charts":
            "Configuratie die op alle grafieken van toepassing is",
        "Top level configuration values": "Configuratiewaarden op het hoogste niveau"
    },
    YamlCodeBlockFormField: {
        "not an array": "Een array wordt verwacht",
        "not an object": "Een object wordt verwacht",
        "not valid yaml": "Ongeldige YAML/JSON"
    },
    TextFormField: {
        "not matching pattern": ({ pattern }) =>
            `Komt niet overeen met het patroon ${pattern}`,
        "toggle password visibility": "Wachtwoordzichtbaarheid wisselen"
    },
    FormFieldGroupComponent: {
        add: "Toevoegen"
    },
    NumberFormField: {
        "below minimum": ({ minimum }) => `Moet groter dan of gelijk aan ${minimum} zijn`,
        "not a number": "Geen getal",
        "not an integer": "Geen geheel getal"
    },
    NoLongerBookmarkedDialog: {
        "no longer bookmarked dialog title": "Niet opgeslagen wijzigingen",
        "no longer bookmarked dialog body":
            "Klik opnieuw op het symbool van de bladwijzer om de opgeslagen configuratie bij te werken.",
        ok: "Ok"
    },
    MyService: {
        "page title": ({ helmReleaseFriendlyName }) =>
            `${helmReleaseFriendlyName} Monitoring`
    },
    PodLogsTab: {
        "not necessarily first logs":
            "Dit zijn niet noodzakelijkerwijs de eerste logs, oudere logs kunnen zijn verwijderd",
        "new logs are displayed in realtime": "Nieuwe logs worden in realtime weergegeven"
    },
    MyServiceButtonBar: {
        back: "Terug",
        "external monitoring": "Externe monitoring",
        "helm values": "Helm waarden",
        reduce: "Verminderen"
    },
    LauncherMainCard: {
        "friendly name": "Gepersonaliseerde naam",
        launch: "Opstarten",
        "problem with": "Probleem met:",
        cancel: "Annuleren",
        "copy auto launch url": "URL voor automatisch starten kopiëren",
        "copy auto launch url helper": ({
            chartName
        }) => `Kopieer de URL waarmee elke gebruiker van deze Onyxia-instantie 
            een ${chartName} in deze configuratie in hun namespace kan starten`,
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
            helmCharName,
            helmRepositoryName,
            labeledHelmChartSourceUrls
        }) => (
            <>
                Versie van de helm-chart{" "}
                {
                    <MaybeLink href={labeledHelmChartSourceUrls.helmChartSourceUrl}>
                        {helmCharName}
                    </MaybeLink>
                }{" "}
                die behoort tot de helm-chart repository{" "}
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
        "save changes": "Wijzigingen opslaan",
        "copied to clipboard": "Gekopieerd naar klembord!",
        "s3 configuration": "S3-configuratie",
        "s3 configuration - explain": ({ projectS3ConfigLink }) => (
            <>
                S3-configuratie die voor deze dienst gebruikt wordt.{" "}
                <MuiLink {...projectS3ConfigLink}>S3-configuratie</MuiLink>.
            </>
        )
    },
    Footer: {
        "terms of service": "Gebruiksvoorwaarden",
        "change language": "Taal wijzigen",
        "dark mode switch": "Schakelaar voor donkere modus"
    },
    MyServices: {
        text1: "Mijn diensten",
        text2: "Snel uw verschillende diensten in uitvoering starten, bekijken en beheren.",
        text3: "We raden u aan uw diensten te verwijderen na elke werksessie.",
        "running services": "Diensten in uitvoering"
    },
    ClusterEventsDialog: {
        title: "Evenementen",
        subtitle: (
            <>
                Evenementen van de Kubernetes namespace, het is een realtime feed van{" "}
                <code>kubectl get events</code>
            </>
        )
    },
    MyServicesConfirmDeleteDialog: {
        "confirm delete title": "Bent u zeker?",
        "confirm delete subtitle":
            "Zorg ervoor dat uw diensten geen onopgeslagen werk bevatten.",
        "confirm delete body":
            "Vergeet niet om uw code naar GitHub of GitLab te pushen voordat u verder gaat.",
        "confirm delete body shared services":
            "Opgelet, sommige van uw diensten worden gedeeld met andere projectleden.",
        cancel: "Annuleren",
        confirm: "Ja, verwijderen"
    },
    MyServicesButtonBar: {
        refresh: "Vernieuwen",
        launch: "Nieuwe dienst",
        trash: "Alles verwijderen",
        "trash my own": "Al mijn diensten verwijderen"
    },
    MyServicesCard: {
        service: "Dienst",
        "running since": "Gestart: ",
        open: "openen",
        readme: "readme",
        "reminder to delete services":
            "Vergeet niet uw diensten te verwijderen na gebruik.",
        status: "Status",
        "container starting": "Container start",
        failed: "Mislukt",
        "suspend service tooltip": "Onderbreek de dienst en bevrijd de middelen",
        "resume service tooltip": "Hervat de dienst",
        suspended: "Opgeschort",
        suspending: "Opschorten",
        "share tooltip - belong to someone else": ({
            projectName,
            ownerUsername,
            focusColor
        }) => (
            <>
                Deze dienst wordt gedeeld onder de projectleden van{" "}
                <span style={{ color: focusColor }}>{projectName}</span>
                door <span style={{ color: focusColor }}>{ownerUsername}</span>.
            </>
        ),
        "share tooltip - belong to you, shared": ({ projectName, focusColor }) => (
            <>
                Deze dienst wordt gedeeld onder de projectleden van{" "}
                <span style={{ color: focusColor }}>{projectName}</span>. Klik om te
                stoppen met delen.
            </>
        ),
        "share tooltip - belong to you, not shared": ({ projectName, focusColor }) => (
            <>
                Alleen jij hebt toegang tot deze dienst. Klik om het te delen met de
                projectleden van <span style={{ color: focusColor }}>{projectName}</span>.
            </>
        )
    },
    MyServicesRestorableConfigOptions: {
        edit: "Wijzigen",
        "copy link": "URL kopiëren",
        "remove bookmark": "Verwijderen",
        "move down": "Verplaats omlaag",
        "move up": "Verplaats omhoog",
        "move to top": "Verplaats helemaal naar boven",
        "move to bottom": "Verplaats helemaal naar beneden"
    },
    MyServicesRestorableConfig: {
        edit: "Wijzigen",
        launch: "Opstarten"
    },
    MyServicesRestorableConfigs: {
        saved: "Opgeslagen",
        expand: "Uitbreiden"
    },
    ReadmeDialog: {
        ok: "ok",
        return: "Terug"
    },
    CopyOpenButton: {
        "first copy the password": "Klik om het wachtwoord te kopiëren...",
        "open the service": "De dienst openen 🚀"
    },
    MyServicesCards: {
        "running services": "Diensten in uitvoering"
    },
    NoRunningService: {
        "launch one": "Klik hier om er een te starten",
        "no services running": "You don't have any service running"
    },
    CircularUsage: {
        max: "Max",
        used: "Gebruikt",
        "quota card title": ({ what, isLimit }) => {
            const whatTranslated = (() => {
                switch (what) {
                    case "memory":
                        return "RAM";
                    case "cpu":
                        return "CPU";
                    case "storage":
                        return "Opslag";
                    case "count/pod":
                        return "Kubernetes pods";
                    case "nvidia.com/gpu":
                        return "Nvidia GPU's";
                    default:
                        return capitalize(what);
                }
            })();

            return `${whatTranslated} - ${isLimit ? "Limiet" : "Aangevraagd"}`;
        }
    },
    Quotas: {
        "show more": "Meer tonen",
        "resource usage quotas": "Quota's voor het gebruik van middelen",
        "current resource usage is reasonable":
            "Uw huidig gebruik van middelen is redelijk."
    },
    DataExplorer: {
        "page header title": "Data Verkenner",
        "page header help title":
            "Bekijk uw Parquet en CSV-bestanden direct vanuit uw browser!",
        "page header help content": ({ demoParquetFileLink }) => (
            <>
                Voer gewoon de <code>https://</code> of <code>s3://</code> URL van een
                databestand in om een voorvertoning te krijgen.
                <br />
                Het bestand wordt niet volledig gedownload; de inhoud ervan wordt
                gestreamd terwijl u door de pagina's navigeert.
                <br />
                U kunt een permanente link naar het bestand of zelfs naar een specifieke
                rij van het bestand delen door de URL uit de adresbalk te kopiëren.
                <br />
                Weet u niet waar u moet beginnen? Probeer dit{" "}
                <MuiLink {...demoParquetFileLink}>demobestand</MuiLink>!
            </>
        ),
        column: "kolom",
        density: "dichtheid",
        "download file": "bestand downloaden",
        "resize table": "Formaat wijzigen",
        "unsupported file type": ({ supportedFileTypes }) =>
            `Niet-ondersteund gegevensformaat. Ondersteunde typen zijn: ${supportedFileTypes.join(", ")}.`,
        "can't fetch file": "Kan gegevensbestand niet ophalen"
    },
    UrlInput: {
        load: "Laden",
        reset: "Leegmaken"
    },
    CommandBar: {
        ok: "ok"
    },
    formattedDate: {
        past1: ({ divisorKey }) => {
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
        pastN: ({ divisorKey }) => {
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
        future1: ({ divisorKey }) => {
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
        futureN: ({ divisorKey }) => {
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
        },
        singular: ({ divisorKey }) => {
            switch (divisorKey) {
                case "second":
                    return "1 seconde";
                case "minute":
                    return "1 minuut";
                case "hour":
                    return "1 uur";
                case "day":
                    return "1 dag";
                case "week":
                    return "1 week";
                case "month":
                    return "1 maand";
                case "year":
                    return "1 jaar";
            }
        },
        plural: ({ divisorKey }) => {
            switch (divisorKey) {
                case "second":
                    return "# seconden";
                case "minute":
                    return "# minuten";
                case "hour":
                    return "# uren";
                case "day":
                    return "# dagen";
                case "week":
                    return "# weken";
                case "month":
                    return "# maanden";
                case "year":
                    return "# jaren";
            }
        }
    },
    CopyToClipboardIconButton: {
        "copied to clipboard": "Gekopieerd!",
        "copy to clipboard": "Kopiëren naar klembord"
    },
    CustomDataGridToolbarDensitySelector: {
        toolbarDensity: "Dichtheid",
        toolbarDensityStandard: "Standaard",
        toolbarDensityComfortable: "Comfortabel",
        toolbarDensityCompact: "Compact"
    },
    CustomDataGridToolbarColumnsButton: {
        toolbarColumnsLabel: "Kolommen"
    },
    CustomDataGrid: {
        "empty directory": "Deze map is leeg",
        "label rows count": ({ count }) => {
            const plural = count > 1 ? "en" : "";
            return `${count} item${plural} geselecteerd`;
        },
        "label rows per page": "Items per pagina"
    }
    /* spell-checker: enable */
};
