import MuiLink from "@mui/material/Link";
import type { Translations } from "../types";
import { Markdown } from "ui/shared/Markdown";
import { Icon } from "onyxia-ui/Icon";
import { getIconUrlByName } from "lazy-icons";
import { capitalize } from "tsafe/capitalize";
import { MaybeLink } from "ui/shared/MaybeLink";

export const translations: Translations<"no"> = {
    /* spell-checker: disable */
    Account: {
        infos: "Kontoinformasjon",
        git: undefined,
        storage: "Koble til lagring",
        k8sCodeSnippets: "Kubernetes",
        "user-interface": "Grensesnittspreferanser",
        text1: "Min konto",
        text2: "Få tilgang til ulik kontoinformasjon.",
        text3: "Konfigurer brukernavn, e-postadresser, passord og personlige tilgangstokens direkte tilkoblet tjenestene dine.",
        "personal tokens tooltip":
            "Passord som genereres for deg og har en gitt gyldighetsperiode",
        vault: "Vault"
    },
    AccountInfoTab: {
        "general information": "Generell informasjon",
        "user id": "Bruker-ID (IDEP)",
        "full name": "Fullt navn",
        email: "E-postadresse",
        "instructions about how to change password":
            'For å endre passordet ditt, logg ut og klikk på lenken for "glemt passord"'
    },
    AccountGitTab: {
        gitName: "Brukernavn for Git",
        "gitName helper text": ({ gitName, focusClassName }) => (
            <>
                Denne kommandoen vil sette ditt globale Git-brukernavn, utført ved
                oppstart av tjenesten:&nbsp;
                <code className={focusClassName}>
                    git config --global user.name "{gitName || "<ditt_brukernavn>"}"
                </code>
            </>
        ),
        gitEmail: "E-post for Git",
        "gitEmail helper text": ({ gitEmail, focusClassName }) => (
            <>
                Denne kommandoen vil sette din globale Git-e-post, utført ved oppstart av
                tjenesten:&nbsp;
                <code className={focusClassName}>
                    git config --global user.email "{gitEmail || "<din_email@domene.no>"}"
                </code>
            </>
        ),
        githubPersonalAccessToken: "Personlig tilgangstoken for Git-tjeneste",
        "githubPersonalAccessToken helper text": ({ focusClassName }) => (
            <>
                Ved å oppgi dette tokenet, kan du klone og pushe til dine private GitHub-
                eller GitLab-repositorier uten å måtte skrive inn dine
                tjenestelegitimasjoner på nytt.
                <br />
                Dette tokenet vil også være tilgjengelig som en miljøvariabel:&nbsp;
                <span className={focusClassName}>$GIT_PERSONAL_ACCESS_TOKEN</span>
            </>
        )
    },
    AccountStorageTab: {
        "credentials section title": "Koble dataene dine til tjenestene dine",
        "credentials section helper":
            "Amazon-kompatibel MinIO-objektlagring (AWS S3). Denne informasjonen fylles allerede automatisk ut.",
        "accessible as env": "Tilgjengelig i tjenestene dine som en miljøvariabel:",
        "init script section title":
            "For å få tilgang til lagringen din utenfor datalabtjenestene",
        "init script section helper":
            "Last ned eller kopier initialiseringskriptet i programingsspråket du foretrekker.",
        "expires in": ({ howMuchTime }) => `Utløper om ${howMuchTime}`
    },
    AccountKubernetesTab: {
        "credentials section title": "Koble til Kubernetes-klusteret",
        "credentials section helper":
            "Legitimasjon for å direkte samhandle med Kubernetes API-serveren.",
        "init script section title": "Shell-skript",
        "init script section helper": ({ installKubectlUrl }) => (
            <>
                Dette skriptet gjør det mulig å bruke kubectl eller helm på din lokale
                maskin. <br />
                For å bruke det,{" "}
                <MuiLink href={installKubectlUrl} target="_blank">
                    installer kubectl på maskinen din
                </MuiLink>{" "}
                og kjør skriptet ved å kopiere og lime det inn i terminalen din.
                <br />
                Etter å ha gjort dette kan du bekrefte at det fungerer ved å kjøre
                kommandoen&nbsp;
                <code>kubectl get pods</code> eller <code>helm list</code>
            </>
        ),
        "expires in": ({ howMuchTime }) =>
            `Disse legitimasjonene er gyldige for de neste ${howMuchTime}`
    },
    AccountVaultTab: {
        "credentials section title": "Vault credentials",
        "credentials section helper": ({ vaultDocHref, mySecretLink }) => (
            <>
                <MuiLink href={vaultDocHref} target="_blank">
                    Vault
                </MuiLink>{" "}
                is the system where &nbsp;
                <MuiLink {...mySecretLink}>dine hemmeligheter</MuiLink> er lagret.
            </>
        ),
        "init script section title": "Bruk vault fra terminalen din",
        "init script section helper": ({ vaultCliDocLink }) => (
            <>
                Last ned eller kopier <code>ENV</code> variabler som konfigurerer din
                lokale{" "}
                <MuiLink href={vaultCliDocLink} target="_blank">
                    Vault CLI
                </MuiLink>
            </>
        ),
        "expires in": ({ howMuchTime }) => `Token går ut om ${howMuchTime}`
    },
    ProjectSettings: {
        "page header title": "Prosjektinnstillinger",
        "page header help title": ({ groupProjectName }) =>
            groupProjectName === undefined
                ? "Innstillinger for ditt personlige prosjekt"
                : `Innstillinger for "${groupProjectName}"`,
        "page header help content": ({
            groupProjectName,
            doesUserBelongToSomeGroupProject
        }) => (
            <>
                Denne siden lar deg konfigurere innstillingene som gjelder for
                {groupProjectName === undefined
                    ? " ditt personlige prosjekt"
                    : ` ${groupProjectName}-prosjektet`}
                .
                <br />
                {groupProjectName !== undefined && (
                    <>
                        Vær oppmerksom på at {groupProjectName} er et gruppeprosjekt delt
                        med andre brukere; endringene du gjør her vil gjelde for alle
                        medlemmer av prosjektet.
                        <br />
                    </>
                )}
                {doesUserBelongToSomeGroupProject && (
                    <>
                        Du kan bytte mellom dine prosjekter ved å bruke rullegardinmenyen
                        i overskriften.
                        <br />
                    </>
                )}
                Merk at bare administratoren for din Onyxia-instans kan opprette nye
                prosjekter.
            </>
        ),
        "security-info": "Sikkerhetsinformasjon",
        "s3-configs": "S3-konfigurasjoner"
    },
    ProjectSettingsS3ConfigTab: {
        "add custom config": "Legg til en tilpasset S3-konfigurasjon"
    },
    S3ConfigCard: {
        "data source": "Datakilde",
        credentials: "Legitimasjon",
        "sts credentials":
            "Token som dynamisk etterspørres på dine vegne av Onyxia (STS)",
        account: "Konto",
        "use in services": "Bruk i tjenester",
        "use in services helper": `Hvis aktivert, vil denne konfigurasjonen brukes som standard i dine tjenester som implementerer en S3-integrasjon.`,
        "use for onyxia explorers": "Bruk for Onyxia utforskere",
        "use for onyxia explorers helper": `Hvis aktivert, vil denne konfigurasjonen brukes
            av filutforskeren og datautforskeren.`,
        edit: "Rediger",
        delete: "Slett"
    },
    AddCustomS3ConfigDialog: {
        "dialog title": "Ny tilpasset S3-konfigurasjon",
        "dialog subtitle":
            "Angi en tilpasset tjenestekonto eller koble til en annen S3-kompatibel tjeneste",
        cancel: "Avbryt",
        "save config": "Lagre konfigurasjon",
        "update config": "Oppdater konfigurasjon",
        "is required": "Dette feltet er påkrevd",
        "must be an url": "Ikke en gyldig URL",
        "not a valid access key id": "Dette ser ikke ut som en gyldig tilgangsnøkkel-ID",
        "url textField label": "URL",
        "url textField helper text": "URL til S3-tjenesten",
        "region textField label": "AWS S3-region",
        "region textField helper text":
            "Eksempel: eu-west-1, hvis du er usikker, la det stå tomt",
        "workingDirectoryPath textField label": "Arbeidsmappesti",
        "workingDirectoryPath textField helper text": (
            <>
                Dette lar deg spesifisere bøtten og S3-objektprefikset du eier på
                S3-tjenesten. <br />
                Eksempel: <code>min-bøtte/mitt-prefiks/</code> eller{" "}
                <code>kun min-bøtte/</code> hvis du eier hele bøtten.
            </>
        ),
        "account credentials": "Kontoinformasjon",
        "friendlyName textField label": "Konfigurasjonsnavn",
        "friendlyName textField helper text":
            "Dette er bare for å hjelpe deg med å identifisere denne konfigurasjonen. Eksempel: Min AWS-bøtte",

        "isAnonymous switch label": "Anonym tilgang",
        "isAnonymous switch helper text":
            "Sett til PÅ hvis ingen hemmelig tilgangsnøkkel er nødvendig",

        "accessKeyId textField label": "Tilgangsnøkkel-ID",
        "accessKeyId textField helper text": "Eksempel: 1A2B3C4D5E6F7G8H9I0J",
        "secretAccessKey textField label": "Hemmelig tilgangsnøkkel",
        "sessionToken textField label": "Sesjonstoken",
        "sessionToken textField helper text": "Valgfritt, la være tom hvis usikker",
        "url style": "URL-stil",
        "url style helper text": `Spesifiser hvordan din S3-server formaterer URL-en for nedlasting av filer.`,
        "path style label": ({ example }) => (
            <>
                Sti-stil
                {example !== undefined && (
                    <>
                        :&nbsp;
                        <code>{example}mitt-datasett.parquet</code>
                    </>
                )}
            </>
        ),
        "virtual-hosted style label": ({ example }) => (
            <>
                Virtuelt-vertsbasert stil
                {example !== undefined && (
                    <>
                        :&nbsp;
                        <code>{example}mitt-datasett.parquet</code>
                    </>
                )}
            </>
        )
    },
    TestS3ConnectionButton: {
        "test connection": "Test forbindelse",
        "test connection failed": ({ errorMessage }) => (
            <>
                Test av forbindelse feilet med feil: <br />
                {errorMessage}
            </>
        )
    },
    AccountUserInterfaceTab: {
        title: "Grensesnittspreferanser",
        "enable dark mode": "Skru på mørk modus",
        "dark mode helper": "Lavlys-grensesnittstema med mørk bakgrunn.",
        "enable beta": "Aktiver beta-testmodus",
        "beta mode helper": "For avanserte plattformkonfigurasjoner og funksjoner.",
        "enable dev mode": "Aktiver utviklermodus",
        "dev mode helper": "Aktiver funksjoner som for øyeblikket er under utvikling",
        "Enable command bar": "Aktiver kommandolinjen",
        "Enable command bar helper": ({ imgUrl }) => (
            <>
                <MuiLink href={imgUrl} target="_blank">
                    Kommandolinjen
                </MuiLink>{" "}
                gir deg innsikt i kommandoene som kjøres på dine vegne når du samhandler
                med brukergrensesnittet.
            </>
        )
    },
    SettingField: {
        "copy tooltip": "Kopier til utklippstavlen",
        language: "Bytt språk",
        "service password": "Standard servicepassord",
        "service password helper text": ({ groupProjectName }) => (
            <>
                Dette er standardpassordet som brukes for å beskytte dine kjørende
                tjenester. <br />
                Når du starter en tjeneste, blir passordfeltet i sikkerhetsfanen
                forhåndsutfylt med dette passordet. <br />
                Ved å klikke på{" "}
                <Icon size="extra small" icon={getIconUrlByName("Refresh")} /> ikonet vil
                generere et nytt tilfeldig passord. Vær imidlertid oppmerksom på at det
                ikke vil oppdatere passordet for tjenester som allerede kjører. <br />
                Tjenestepassordet er det Onyxia får deg til å kopiere til utklippstavlen
                din før du får tilgang til en kjørende tjeneste. <br />
                {groupProjectName !== undefined && (
                    <>
                        Vær oppmerksom på at dette passordet deles blant alle medlemmer av
                        prosjektet ({groupProjectName}).
                    </>
                )}
            </>
        ),
        "not yet defined": "Ikke definert ennå",
        "reset helper dialogs": "Tilbakestill instruksjonsvinduer",
        reset: "Tilbakestill",
        "reset helper dialogs helper text":
            "Tilbakestill meldingsvinduer som er bedt om å ikke vises igjen"
    },
    MyFiles: {
        "page title - my files": "Mine filer",
        "what this page is used for - my files": "Her kan du bla gjennom S3-bøtter.",
        "help content": ({ accountTabLink, docHref }) => (
            <>
                Les{" "}
                <MuiLink href={docHref} target="_blank">
                    dokumentasjonen vår
                </MuiLink>
                . &nbsp;
                <MuiLink {...accountTabLink}>Konfigurer minio-klientene</MuiLink>.
            </>
        )
    },
    ShareDialog: {
        title: "Del dataene dine",
        close: "Lukk",
        "create and copy link": "Opprett og kopier lenke",
        "paragraph current policy": ({ isPublic }) =>
            isPublic
                ? "Filen din er offentlig, alle med lenken kan laste den ned."
                : "Filen din er for øyeblikket privat.",

        "paragraph change policy": ({ isPublic }) =>
            isPublic
                ? "For å begrense tilgangen, endre delingsstatusen til filen din."
                : "For å dele og gi tilgang til filen din, endre delingsstatusen eller opprett en midlertidig tilgangslenke.",

        "hint link access": ({ isPublic, expiration }) =>
            isPublic
                ? "Lenken din er tilgjengelig så lenge filen er offentlig."
                : `Denne lenken gir tilgang til dataene dine i ${expiration}.`,
        "label input link": "Tilgangslenke"
    },
    MySecrets: {
        "page title - my secrets": "Mine hemmeligheter",
        "what this page is used for - my secrets":
            "Her kan du definere variabler som vil være tilgjengelige i tjenestene dine som miljøvariabler.",
        "learn more - my files": "For å lære mer om filbehandling,",
        "help content": ({ accountTabLink, docHref }) => (
            <>
                Les{" "}
                <MuiLink href={docHref} target="_blank">
                    dokumentasjonen vår
                </MuiLink>
                . &nbsp;
                <MuiLink {...accountTabLink}>
                    Konfigurer den lokale Vault CLI-en din
                </MuiLink>
                .
            </>
        )
    },
    SecretsExplorerItem: {
        description: "beskrivelse"
    },
    ExplorerItem: {
        description: "beskrivelse"
    },
    SecretsExplorerButtonBar: {
        secret: "hemmelighet",
        rename: "gi nytt navn",
        delete: "slett",
        "create secret": "Opprett hemmelighet",
        "copy path": "Bruk i en tjeneste",
        "create directory": "Opprett katalog",
        refresh: "oppdater",
        "create what": ({ what }) => `Opprett ${what}`,
        new: "Ny"
    },
    ExplorerButtonBar: {
        file: "fil",
        delete: "slett",
        "upload file": "Last opp fil",
        "copy path": "Kopier S3-objektnavnet",
        "create directory": "Opprett katalog",
        refresh: "oppdater",
        new: "Ny",
        share: "Del",
        "alt list view": "Vis liste",
        "alt block view": "Vis blokk"
    },
    ExplorerItems: {
        "empty directory": "Denne katalogen er tom"
    },
    SecretsExplorerItems: {
        "empty directory": "Denne katalogen er tom"
    },
    SecretsExplorer: {
        file: "fil",
        secret: "hemmelighet",
        create: "opprett",
        cancel: "avbryt",
        delete: "slett",
        "do not display again": "Ikke vis igjen",

        "untitled what": ({ what }) => `uten_tittel_${what}`,
        directory: "mappe",
        "deletion dialog title": ({ deleteWhat }) => `Slett ${deleteWhat}?`,
        "deletion dialog body": ({ deleteWhat }) =>
            `Du er i ferd med å slette ${deleteWhat}.
      Denne handlingen kan ikke angres.`,
        "already a directory with this name":
            "Det finnes allerede en mappe med dette navnet",
        "can't be empty": "Kan ikke være tom",
        "new directory": "Ny katalog"
    },
    Explorer: {
        file: "fil",
        secret: "hemmelighet",
        create: "opprett",
        cancel: "avbryt",
        delete: "slett",
        "do not display again": "Ikke vis igjen",

        "untitled what": ({ what }) => `uten tittel_${what}`,
        directory: "mappe",
        multiple: "elementer",
        "deletion dialog title": ({ deleteWhat, isPlural }) =>
            `Slett ${isPlural ? "disse" : "denne"} ${deleteWhat}?`,
        "deletion dialog body": ({ deleteWhat, isPlural }) => `
        Du er i ferd med å slette ${isPlural ? "disse" : "denne"} ${deleteWhat}.
        Denne handlingen kan føre til tap av data knyttet til ${isPlural ? "disse" : "dette"} ${deleteWhat}.
        `,
        "already a directory with this name":
            "Det finnes allerede en mappe med dette navnet",
        "can't be empty": "Kan ikke være tom",
        "new directory": "Ny katalog"
    },
    ListExplorerItems: {
        "header name": "Navn",
        "header modified date": "Endret",
        "header size": "Størrelse",
        "header policy": "Retningslinje"
    },
    MySecretsEditor: {
        "do not display again": "Ikke vis igjen",
        "add an entry": "Legg til en ny variabel",
        "environnement variable default name": "NY_VAR",
        "table of secret": "hemmelighetstabell",

        "key column name": "Variabelnavn",
        "value column name": "Verdi",
        "unavailable key": "Allerede i bruk",
        "invalid key empty string": "Navn påkrevd",
        "invalid key _ not valid": "Kan ikke være bare _",
        "invalid key start with digit": "Kan ikke starte med et tall",
        "invalid key invalid character": "Ugyldig tegn",
        "use this secret": `Bruk i tjenester`,
        "use secret dialog title": "Bruk i en tjeneste",
        "use secret dialog subtitle": "Stien til hemmeligheten er kopiert",
        "use secret dialog body": `
      Når du starter en tjeneste (RStudio, Jupyter osv.), går du til
      hemmelighetsfanen og lim inn stien til hemmeligheten som er gitt for dette
      formålet.
      Verdiene blir injisert som miljøvariabler.
    `,
        "use secret dialog ok": "Forstått"
    },
    MySecretsEditorRow: {
        "key input desc": "Miljøvariabelnavn",
        "value input desc": "Miljøvariabelverdi"
    },
    ExplorerUploadModalDropArea: {
        "browse files": "Bla gjennom filer",
        "drag and drop or": "Dra og slipp eller"
    },
    ExplorerUploadProgress: {
        over: "over",
        importing: "Importerer"
    },
    ExplorerUploadModal: {
        "import files": "Importer filer",
        cancel: "Avbryt",
        minimize: "Minimer"
    },
    Header: {
        login: "Logg inn",
        logout: "Logg ut",
        project: "Prosjekt",
        region: "Region"
    },
    LeftBar: {
        reduce: "Reduser",
        home: "Hjem",
        account: "Min konto",
        projectSettings: "Prosjektinnstillinger",
        catalog: "Tjenestekatalog",
        myServices: "Mine tjenester",
        mySecrets: "Mine hemmeligheter",
        myFiles: "Mine filer",
        "divider: services features": "Tjenestefunksjoner",
        "divider: external services features": "Eksterne tjenestefunksjoner",
        "divider: onyxia instance specific features":
            "Onyxia-instansspesifikke funksjoner",
        dataExplorer: "Datautforsker",
        sqlOlapShell: "SQL OLAP-Skall"
    },
    AutoLogoutCountdown: {
        "are you still there": "Er du fortsatt der?",
        "you'll soon be automatically logged out":
            "Du vil snart bli logget ut automatisk."
    },
    Page404: {
        "not found": "Side ikke funnet"
    },
    PortraitModeUnsupported: {
        instructions:
            "For å bruke denne appen på telefonen din, må du aktivere rotasjonssensoren og snu telefonen."
    },
    MaybeAcknowledgeConfigVolatilityDialog: {
        "dialog title": "Vær oppmerksom, konfigurasjoner er flyktige",
        "dialog body": `Denne Onyxia-instansen implementerer ikke noen persistensmekanisme for lagring av konfigurasjoner. 
            Alle konfigurasjoner lagres i nettleserens lokale lagring. Dette betyr at hvis du tømmer nettleserens lokale 
            lagring eller bytter nettleser, vil du miste alle dine konfigurasjoner.`,
        "do not show next time": "Ikke vis denne meldingen igjen",
        cancel: "Avbryt",
        "I understand": "Jeg forstår"
    },
    Home: {
        "title authenticated": ({ userFirstname }) => `Velkommen ${userFirstname}!`,
        title: "Velkommen til Onyxia datalab",
        "new user": "Ny på datalaben?",
        login: "Logg inn",
        subtitle: "Arbeid med Python eller R, nyt all databehandlingskraften du trenger!",
        cardTitle1: "Et ergonomisk miljø og behovstilpassede tjenester",
        cardTitle2: "Et aktivt og entusiastisk fellesskap til din tjeneste",
        cardTitle3: "Rask, fleksibel og nettbasert dataoppbevaring",
        cardText1:
            "Analyser data, utfør distribuert databehandling og dra nytte av en stor katalog med tjenester. Reserver den databehandlingskraften du trenger.",
        cardText2:
            "Bruk og del tilgjengelige ressurser: opplæringsprogrammer, opplæring og utvekslingskanaler.",
        cardText3:
            "Få enkel tilgang til dataene dine og de som er tilgjengelige for deg fra programmene dine - implementering av S3 API",
        cardButton1: "Se gjennom katalogen",
        cardButton2: "Bli med i fellesskapet",
        cardButton3: "Se på dataene"
    },
    Catalog: {
        header: "Tjenestekatalog",
        "no result found": ({ forWhat }) => `Ingen resultater funnet for ${forWhat}`,
        "search results": "Søkeresultat",
        search: "Søk"
    },
    CatalogChartCard: {
        launch: "Start",
        "learn more": "Lær mer"
    },
    CatalogNoSearchMatches: {
        "no service found": "Ingen tjeneste funnet",
        "no result found": ({ forWhat }) => `Ingen resultater funnet for ${forWhat}`,
        "check spelling": "Vennligst kontroller stavemåten eller prøv å utvide søket.",
        "go back": "Tilbake til hovedtjenester"
    },
    Launcher: {
        sources: ({
            helmChartName,
            helmChartRepositoryName,
            labeledHelmChartSourceUrls
        }) => (
            <>
                Du er i ferd med å starte{" "}
                {
                    <MaybeLink href={labeledHelmChartSourceUrls.helmChartSourceUrl}>
                        {helmChartName}
                    </MaybeLink>
                }{" "}
                fra tjenestekatalogen{" "}
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
                        Den er basert på Docker-malen{" "}
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
        "download as script": "Last ned som skript",
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
            >{`Vi har designet kommandolinjen for å gi deg full kontroll over tjenestene du kjører på Kubernetes.
Her er det du trenger å vite:

#### Hva er disse Helm-kommandoene?

Disse kommandoene er de Helm-kommandoene som Onyxia API vil utføre på dine vegne i ditt Kubernetes-navnerom.
Dette gir deg innsikt i hva som skjer i kulissene når du jobber med brukergrensesnittet.

#### Sanntidsoppdateringer

Når du bruker grensesnittet, vil Helm-kommandoene automatisk oppdatere seg for å reflektere hva du gjør.

#### Hvorfor bør jeg bry meg?

- **Gjennomsiktighet:** Vi mener du har rett til å vite hvilke handlinger som utføres i ditt miljø.
- **Læring:** Å forstå disse kommandoene kan gi innsikt i Kubernetes og Helm, og gi bedre kunnskap.
- **Manuell utførelse:** Du kan kopiere og lime inn disse kommandoene i en terminal med skrivetilgang til Kubernetes, som lar deg starte tjenesten manuelt.

#### Hvordan kan jeg kjøre disse kommandoene manuelt?

${
    k8CredentialsHref === undefined
        ? ""
        : "Det er to måter å kjøre disse kommandoene på:  "
}

${
    k8CredentialsHref === undefined
        ? ""
        : `
- **Lokal terminal:** Gå til [\`Min konto -> Kubernetes-fanen\`](${k8CredentialsHref}).
  Her vil du finne legitimasjonen som lar deg kjøre kommandoer i ditt Kubernetes-navnerom fra din lokale terminal.
`
}

- Hvis denne Onyxia-instansen har tjenester som VSCode eller Jupyter, kan du åpne en terminal innenfor disse tjenestene og kjøre kommandoer der.
  For konstruktive eller destruktive kommandoer må du starte tjenesten din med Kubernetes-rolle \`admin\` eller \`edit\`.

Ved å kjøre kommandoen manuelt, vil du fortsatt kunne se tjenesten i [\`Mine tjenester\`](${myServicesHref}) siden som om den var startet via brukergrensesnittet.

Du kan deaktivere kommandolinjen i [\`Min konto -> Grensesnitt preferanse-fanen\`](${interfacePreferenceHref}).

Utforsk gjerne og ta kontroll over tjenestene du kjører på Kubernetes!
        `}</Markdown>
        )
    },
    AcknowledgeSharingOfConfigConfirmDialog: {
        "acknowledge sharing of config confirm dialog title":
            "Vær oppmerksom, konfigurasjoner deles",
        "acknowledge sharing of config confirm dialog subtitle": ({
            groupProjectName
        }) => `Hvis du lagrer
        denne konfigurasjonen, vil hvert medlem av prosjektet ${groupProjectName} være i stand til å starte det.`,
        "acknowledge sharing of config confirm dialog body": `Selv om ingen personlig informasjon har blitt automatisk injisert
        av Onyxia, vær forsiktig så du ikke deler sensitiv informasjon i den gjenopprettbare konfigurasjonen.`,
        cancel: "Avbryt",
        "i understand, proceed": "Jeg forstår, fortsett"
    },
    AutoLaunchDisabledDialog: {
        ok: "Ok",
        "auto launch disabled dialog title": "Tjenesten er ikke startet",
        "auto launch disabled dialog body": (
            <>
                <b>ADVARSEL</b>: Noen kan prøve å lure deg til å starte en tjeneste som
                kan kompromittere integriteten til ditt namespace.
                <br />
                Vennligst gjennomgå tjenestekonfigurasjonen nøye før du starter den.
                <br />
                Hvis du er i tvil, vennligst kontakt din administrator.
            </>
        )
    },
    FormFieldWrapper: {
        "reset to default": "Tilbakestill til standard"
    },
    YamlCodeBlockFormField: {
        "not an array": "En matrise forventes",
        "not an object": "Et objekt forventes",
        "not valid yaml": "Ugyldig YAML/JSON"
    },
    TextFormField: {
        "not matching pattern": ({ pattern }) => `Matcher ikke mønsteret ${pattern}`,
        "toggle password visibility": "Bytt synlighet for passord"
    },
    FormFieldGroupComponent: {
        add: "Legg til"
    },
    NumberFormField: {
        "below minimum": ({ minimum }) => `Må være større enn eller lik ${minimum}`,
        "not a number": "Ikke et tall",
        "not an integer": "Ikke et heltall"
    },
    NoLongerBookmarkedDialog: {
        "no longer bookmarked dialog title": "Endringene dine vil ikke bli lagret",
        "no longer bookmarked dialog body":
            "Klikk på bokmerkeikonet igjen for å oppdatere den lagrede konfigurasjonen din",
        ok: "Ok"
    },
    MyService: {
        "page title": ({ helmReleaseFriendlyName }) =>
            `${helmReleaseFriendlyName} Overvåking`
    },
    PodLogsTab: {
        "not necessarily first logs":
            "Dette er ikke nødvendigvis de første loggene, eldre logger kan ha blitt fjernet",
        "new logs are displayed in realtime": "Nye logger vises i sanntid"
    },
    MyServiceButtonBar: {
        back: "Tilbake",
        "external monitoring": "Ekstern overvåkning",
        "helm values": "Helm-verdier",
        reduce: "Reduser"
    },
    LauncherMainCard: {
        "friendly name": "Vennlig navn",
        launch: "Start",
        "problem with": "Problem med:",
        cancel: "Avbryt",
        "copy auto launch url": "Kopier URL for automatisk oppstart",
        "copy auto launch url helper": ({
            chartName
        }) => `Kopier URL-en som gjør at enhver bruker av denne Onyxia-instansen kan 
            starte en ${chartName} i denne konfigurasjonen i sitt namespace`,
        "share the service": "Del tjenesten",
        "share the service - explain":
            "Gjør tjenesten tilgjengelig for prosjektmedlemmene",
        "restore all default": "Gjenopprett standardkonfigurasjoner",
        "bookmark button": ({ isBookmarked }) =>
            `${isBookmarked ? "Fjern" : "Lagre"} konfigurasjon`,
        "bookmark button tooltip": ({ myServicesSavedConfigsExtendedLink }) => (
            <>
                Lagrede konfigurasjoner kan raskt startes på nytt fra siden&nbsp;
                <MuiLink {...myServicesSavedConfigsExtendedLink} target="_blank">
                    Mine Tjenester
                </MuiLink>
            </>
        ),
        "version select label": "Versjon",
        "version select helper text": ({
            helmCharName,
            helmRepositoryName,
            labeledHelmChartSourceUrls
        }) => (
            <>
                Versjon av Helm-malen{" "}
                {
                    <MaybeLink href={labeledHelmChartSourceUrls.helmChartSourceUrl}>
                        {helmCharName}
                    </MaybeLink>
                }{" "}
                som tilhører Helm-katalogen{" "}
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
        "save changes": "Lagre endringer",
        "copied to clipboard": "Kopiert til utklippstavlen!",
        "s3 configuration": "S3-konfigurasjon",
        "s3 configuration - explain": ({ projectS3ConfigLink }) => (
            <>
                S3-konfigurasjon som skal brukes for denne tjenesten.{" "}
                <MuiLink {...projectS3ConfigLink}>S3-konfigurasjon</MuiLink>.
            </>
        )
    },
    Footer: {
        contribute: "Bidra",
        "terms of service": "Vilkår for bruk",
        "change language": "Bytt språk",
        "dark mode switch": "Mørk modus"
    },
    MyServices: {
        text1: "Mine tjenester",
        text2: "Få tilgang til de kjørende tjenestene dine",
        text3: "Tjenestene skal avsluttes så snart du slutter å bruke dem aktivt.",
        "running services": "Kjørende tjenester"
    },
    ClusterEventsDialog: {
        title: "Hendelser",
        subtitle: (
            <>
                Hendelser i Kubernetes navneområde, det er en sanntidsstrøm av{" "}
                <code>kubectl get events</code>
            </>
        )
    },
    MyServicesConfirmDeleteDialog: {
        "confirm delete title": "Er du sikker?",
        "confirm delete subtitle":
            "Forsikre deg om at tjenestene dine er klare til å bli slettet",
        "confirm delete body shared services":
            "Vær oppmerksom på at noen av tjenestene dine deles med de andre prosjektmedlemmene.",
        "confirm delete body":
            "Ikke glem å laste opp koden din på GitHub eller GitLab før du avslutter tjenestene dine",
        cancel: "Avbryt",
        confirm: "Ja, slett"
    },
    MyServicesButtonBar: {
        refresh: "Oppdater",
        launch: "Ny tjeneste",
        trash: "Slett alt",
        "trash my own": "Slett alle mine tjenester"
    },
    MyServicesCard: {
        service: "Tjeneste",
        "running since": "Startet: ",
        open: "åpne",
        readme: "lesmeg",
        "reminder to delete services": "Husk å slette tjenestene dine.",
        status: "Status",
        "container starting": "Container starter",
        failed: "Mislyktes",
        "suspend service tooltip": "Pause tjenesten og frigjør ressurser",
        "resume service tooltip": "Gjenoppta tjenesten",
        suspended: "Pauset",
        suspending: "Pauser",
        "share tooltip - belong to someone else": ({
            projectName,
            ownerUsername,
            focusColor
        }) => (
            <>
                Denne tjenesten deles blant prosjektdeltakerne i{" "}
                <span style={{ color: focusColor }}>{projectName}</span>
                av <span style={{ color: focusColor }}>{ownerUsername}</span>.
            </>
        ),
        "share tooltip - belong to you, shared": ({ projectName, focusColor }) => (
            <>
                Denne tjenesten deles blant prosjektdeltakerne i{" "}
                <span style={{ color: focusColor }}>{projectName}</span>. Klikk for å
                slutte å dele.
            </>
        ),
        "share tooltip - belong to you, not shared": ({ projectName, focusColor }) => (
            <>
                Bare du har tilgang til denne tjenesten. Klikk for å dele den med
                prosjektdeltakerne i{" "}
                <span style={{ color: focusColor }}>{projectName}</span>.
            </>
        )
    },
    MyServicesRestorableConfigOptions: {
        edit: "Rediger",
        "copy link": "Kopier URL-lenke",
        "remove bookmark": "Slett"
    },
    MyServicesRestorableConfig: {
        edit: "Rediger",
        launch: "Start"
    },
    MyServicesRestorableConfigs: {
        saved: "Lagret",
        expand: "Utvid"
    },
    ReadmeDialog: {
        ok: "ok",
        return: "Gå tilbake"
    },
    CopyOpenButton: {
        "first copy the password": "Klikk for å kopiere passordet...",
        "open the service": "Åpne tjenesten 🚀"
    },
    MyServicesCards: {
        "running services": "Kjørende tjenester"
    },
    NoRunningService: {
        "launch one": "Klikk her for å starte en",
        "no services running": "Du har ingen kjørende tjenester"
    },
    CircularUsage: {
        max: "Maks",
        used: "Brukt",
        "quota card title": ({ what, isLimit }) => {
            const whatTranslated = (() => {
                switch (what) {
                    case "memory":
                        return "RAM";
                    case "cpu":
                        return "CPU";
                    case "storage":
                        return "Lagring";
                    case "count/pod":
                        return "Kubernetes-pods";
                    case "nvidia.com/gpu":
                        return "Nvidia GPU-er";
                    default:
                        return capitalize(what);
                }
            })();

            return `${whatTranslated} - ${isLimit ? "Grense" : "Anmodet"}`;
        }
    },
    Quotas: {
        "show more": "Vis mer",
        "resource usage quotas": "Kvoter for ressursbruk",
        "current resource usage is reasonable": "Ditt nåværende ressursbruk er rimelig."
    },
    DataExplorer: {
        "page header title": "Datautforsker",
        "page header help title":
            "Forhåndsvis dine Parquet og CSV-filer direkte fra nettleseren din!",
        "page header help content": ({ demoParquetFileLink }) => (
            <>
                Skriv inn URL-en <code>https://</code> eller <code>s3://</code> til en
                datafil for å forhåndsvise den.
                <br />
                Filen blir ikke lastet ned i sin helhet; innholdet blir strømmet etter
                hvert som du navigerer gjennom sidene.
                <br />
                Du kan dele en permanent lenke til filen, eller til og med til en
                spesifikk rad i filen, ved å kopiere URL-en fra adresselinjen.
                <br />
                Usikker på hvor du skal starte? Prøv denne{" "}
                <MuiLink {...demoParquetFileLink}>demofilen</MuiLink>!
            </>
        ),
        column: "kolonne",
        density: "tetthet",
        "download file": "last ned fil",
        "resize table": "Endre størrelse"
    },
    UrlInput: {
        load: "Last"
    },
    CommandBar: {
        ok: "ok"
    },
    formattedDate: {
        past1: ({ divisorKey }) => {
            switch (divisorKey) {
                case "now":
                    return "akkurat nå";
                case "second":
                    return "et sekund siden";
                case "minute":
                    return "et minutt siden";
                case "hour":
                    return "en time siden";
                case "day":
                    return "i går";
                case "week":
                    return "forrige uke";
                case "month":
                    return "forrige måned";
                case "year":
                    return "i fjor";
            }
        },
        pastN: ({ divisorKey }) => {
            switch (divisorKey) {
                case "now":
                    return "akkurat nå";
                case "second":
                    return "# sekunder siden";
                case "minute":
                    return "# minutter siden";
                case "hour":
                    return "# timer siden";
                case "day":
                    return "# dager siden";
                case "week":
                    return "# uker siden";
                case "month":
                    return "# måneder siden";
                case "year":
                    return "# år siden";
            }
        },
        future1: ({ divisorKey }) => {
            switch (divisorKey) {
                case "now":
                    return "akkurat nå";
                case "second":
                    return "om et sekund";
                case "minute":
                    return "om et minutt";
                case "hour":
                    return "om en time";
                case "day":
                    return "i morgen";
                case "week":
                    return "neste uke";
                case "month":
                    return "neste måned";
                case "year":
                    return "neste år";
            }
        },
        futureN: ({ divisorKey }) => {
            switch (divisorKey) {
                case "now":
                    return "akkurat nå";
                case "second":
                    return "om # sekunder";
                case "minute":
                    return "om # minutter";
                case "hour":
                    return "om # timer";
                case "day":
                    return "om # dager";
                case "week":
                    return "om # uker";
                case "month":
                    return "om # måneder";
                case "year":
                    return "om # år";
            }
        }
    },
    CopyToClipboardIconButton: {
        "copied to clipboard": "Kopiert!",
        "copy to clipboard": "Kopier til utklippstavlen"
    },
    CustomDataGrid: {
        "empty directory": "Denne mappen er tom",
        "label rows count": ({ count }) => {
            const plural = count > 1 ? "er" : "";
            return `${count} element${plural} valgt`;
        },
        "label rows per page": "Elementer per side"
    },
    CustomDataGridToolbarDensitySelector: {
        toolbarDensity: "Tetthet",
        toolbarDensityStandard: "Standard",
        toolbarDensityComfortable: "Komfortabel",
        toolbarDensityCompact: "Kompakt"
    },
    CustomDataGridToolbarColumnsButton: {
        toolbarColumnsLabel: "Kolonner"
    }
    /* spell-checker: enable */
};
