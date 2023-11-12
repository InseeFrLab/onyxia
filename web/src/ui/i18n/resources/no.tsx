import MuiLink from "@mui/material/Link";
import type { Translations } from "../types";
import { Markdown } from "ui/shared/Markdown";
import { elementsToSentence } from "ui/tools/elementsToSentence";

export const translations: Translations<"no"> = {
    "Account": {
        "infos": "Kontoinformasjon",
        "third-party-integration": "Eksterne tjenester",
        "storage": "Koble til lagring",
        "k8sCredentials": "Kubernetes",
        "user-interface": "Grensesnittspreferanser",
        "text1": "Min konto",
        "text2": "Få tilgang til ulik kontoinformasjon.",
        "text3":
            "Konfigurer brukernavn, e-postadresser, passord og personlige tilgangstokens direkte tilkoblet tjenestene dine.",
        "personal tokens tooltip":
            "Passord som genereres for deg og har en gitt gyldighetsperiode",
        "vault": "Vault"
    },
    "AccountInfoTab": {
        "general information": "Generell informasjon",
        "user id": "Bruker-ID (IDEP)",
        "full name": "Fullt navn",
        "email": "E-postadresse",
        "change account info": "Endre kontoinformasjon (f.eks. passord).",
        "auth information": "Onyxia-autentiseringsinformasjon",
        "auth information helper": `Denne informasjonen gjør at du kan identifisere deg
            innenfor plattformen og de ulike tjenestene.`,
        "ip address": "IP-adresse"
    },
    "AccountIntegrationsTab": {
        "git section title": "Git-konfigurasjon",
        "git section helper": `For å sikre at du vises som forfatter av Git-bidragene dine`,
        "gitName": "Brukernavn for Git",
        "gitEmail": "E-post for Git",
        "third party tokens section title":
            "Koble Gitlab-, Github- og Kaggle-kontoene dine",
        "third party tokens section helper": `
            Koble tjenestene dine til eksterne kontoer ved hjelp av
            personlige tilgangstokens og miljøvariabler
            `,
        "personal token": ({ serviceName }) => `${serviceName}-personlig tilgangstoken`,
        "link for token creation": ({ serviceName }) =>
            `Opprett ${serviceName}-tokenet ditt.`,
        "accessible as env": "Tilgjengelig i tjenestene dine som en miljøvariabel"
    },
    "AccountStorageTab": {
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
    "AccountKubernetesTab": {
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
    "AccountVaultTab": {
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
    "AccountUserInterfaceTab": {
        "title": "Grensesnittspreferanser",
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
    "AccountField": {
        "copy tooltip": "Kopier til utklippstavlen",
        "language": "Bytt språk",
        "service password": "Passord for tjenestene dine",
        "service password helper text": `Dette passordet kreves for å logge på alle tjenestene dine.
      Det genereres automatisk og fornyes jevnlig.`,
        "not yet defined": "Ikke definert ennå",
        "reset helper dialogs": "Tilbakestill instruksjonsvinduer",
        "reset": "Tilbakestill",
        "reset helper dialogs helper text":
            "Tilbakestill meldingsvinduer som er bedt om å ikke vises igjen"
    },
    "MyFiles": {
        "page title - my files": "Mine filer",
        "page title - my secrets": "Mine hemmeligheter",
        "what this page is used for - my files": "Her kan du bla gjennom S3-bøtter.",
        "what this page is used for - my secrets":
            "Her kan du definere variabler som vil være tilgjengelige i tjenestene dine som miljøvariabler.",
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
    "MySecrets": {
        "page title - my files": "Mine filer",
        "page title - my secrets": "Mine hemmeligheter",
        "what this page is used for - my files": "Her kan du bla gjennom S3-bøtter.",
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
    "SecretsExplorerItem": {
        "description": "beskrivelse"
    },
    "ExplorerItem": {
        "description": "beskrivelse"
    },
    "SecretsExplorerButtonBar": {
        "file": "fil",
        "secret": "hemmelighet",
        "rename": "gi nytt navn",
        "delete": "slett",
        "create secret": "Opprett hemmelighet",
        "upload file": "Last opp fil",
        "copy path": "Bruk i en tjeneste",
        "create directory": "Opprett katalog",
        "refresh": "oppdater",
        "create what": ({ what }) => `Opprett ${what}`,
        "new": "Ny"
    },
    "ExplorerButtonBar": {
        "file": "fil",
        "secret": "hemmelighet",
        "delete": "slett",
        "create secret": "Opprett hemmelighet",
        "upload file": "Last opp fil",
        "copy path": "Kopier S3-objektnavnet",
        "create directory": "Opprett katalog",
        "refresh": "oppdater",
        "create what": ({ what }) => `Opprett ${what}`,
        "new": "Ny"
    },
    "ExplorerItems": {
        "empty directory": "Denne katalogen er tom"
    },
    "SecretsExplorerItems": {
        "empty directory": "Denne katalogen er tom"
    },
    "SecretsExplorer": {
        "file": "fil",
        "secret": "hemmelighet",
        "create": "opprett",
        "cancel": "avbryt",
        "delete": "slett",
        "do not display again": "Ikke vis igjen",

        "untitled what": ({ what }) => `uten_tittel_${what}`,
        "directory": "mappe",
        "deletion dialog title": ({ deleteWhat }) => `Slett ${deleteWhat}?`,
        "deletion dialog body": ({ deleteWhat }) =>
            `Du er i ferd med å slette ${deleteWhat}.
      Denne handlingen kan ikke reverseres.`,
        "already a directory with this name":
            "Det finnes allerede en mappe med dette navnet",
        "can't be empty": "Kan ikke være tom",
        "new directory": "Ny katalog"
    },
    "Explorer": {
        "file": "fil",
        "secret": "hemmelighet",
        "create": "opprett",
        "cancel": "avbryt",
        "delete": "slett",
        "do not display again": "Ikke vis igjen",

        "untitled what": ({ what }) => `uten tittel_${what}`,
        "directory": "mappe",
        "deletion dialog title": ({ deleteWhat }) => `Slett ${deleteWhat}?`,
        "deletion dialog body": ({ deleteWhat }) =>
            `Du er i ferd med å slette ${deleteWhat}.
      Denne handlingen kan ikke reverseres.`,
        "already a directory with this name":
            "Det finnes allerede en mappe med dette navnet",
        "can't be empty": "Kan ikke være tom",
        "new directory": "Ny katalog"
    },
    "MySecretsEditor": {
        "do not display again": "Ikke vis igjen",
        "add an entry": "Legg til en ny variabel",
        "environnement variable default name": "NY_VAR",
        "table of secret": "hemmelighetstabell",

        "key column name": "Variabelnavn",
        "value column name": "Verdi",
        "resolved value column name": "Løst verdi",
        "what's a resolved value": `
      En miljøvariabel kan referere til en annen. Hvis du for eksempel har definert
      FIRST_NAME=John kan du sette FULL_NAME="$FIRST_NAME"-Doe, og den løste verdien av
      FILL_NAME vil være «John-Doe»
    `,
        "unavailable key": "Allerede i bruk",
        "invalid key empty string": "Navn påkrevd",
        "invalid key _ not valid": "Kan ikke være bare _",
        "invalid key start with digit": "Kan ikke starte med et tall",
        "invalid key invalid character": "Ugyldig tegn",
        "invalid value cannot eval": "Ugyldig shell-uttrykk",
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
    "MySecretsEditorRow": {
        "key input desc": "Miljøvariabelnavn",
        "value input desc": "Miljøvariabelverdi"
    },
    "ExplorerUploadModalDropArea": {
        "browse files": "Bla gjennom filer",
        "drag and drop or": "Dra og slipp eller"
    },
    "ExplorerUploadProgress": {
        "over": "over",
        "importing": "Importerer"
    },
    "ExplorerUploadModal": {
        "import files": "Importer filer",
        "cancel": "Avbryt",
        "minimize": "Minimer"
    },
    "Header": {
        "login": "Logg inn",
        "logout": "Logg ut",
        "project": "Prosjekt",
        "region": "Region"
    },
    "LeftBar": {
        "reduce": "Reduser",
        "home": "Hjem",
        "account": "Min konto",
        "catalog": "Tjenestekatalog",
        "myServices": "Mine tjenester",
        "mySecrets": "Mine hemmeligheter",
        "myFiles": "Mine filer",
        "divider: services features": "Tjenestefunksjoner",
        "divider: external services features": "Eksterne tjenestefunksjoner",
        "divider: onyxia instance specific features":
            "Onyxia-instansspesifikke funksjoner"
    },
    "Page404": {
        "not found": "Side ikke funnet"
    },
    "PortraitModeUnsupported": {
        "instructions":
            "For å bruke denne appen på telefonen din, må du aktivere rotasjonssensoren og snu telefonen."
    },
    "Home": {
        "title authenticated": ({ userFirstname }) => `Velkommen ${userFirstname}!`,
        "title": "Velkommen til Onyxia datalab",
        "new user": "Ny på datalaben?",
        "login": "Logg inn",
        "subtitle":
            "Arbeid med Python eller R, nyt all databehandlingskraften du trenger!",
        "cardTitle1": "Et ergonomisk miljø og behovstilpassede tjenester",
        "cardTitle2": "Et aktivt og entusiastisk fellesskap til din tjeneste",
        "cardTitle3": "Rask, fleksibel og nettbasert dataoppbevaring",
        "cardText1":
            "Analyser data, utfør distribuert databehandling og dra nytte av en stor katalog med tjenester. Reserver den databehandlingskraften du trenger.",
        "cardText2":
            "Bruk og del tilgjengelige ressurser: opplæringsprogrammer, opplæring og utvekslingskanaler.",
        "cardText3":
            "Få enkel tilgang til dataene dine og de som er tilgjengelige for deg fra programmene dine - implementering av S3 API",
        "cardButton1": "Se gjennom katalogen",
        "cardButton2": "Bli med i fellesskapet",
        "cardButton3": "Se på dataene"
    },
    "Catalog": {
        "header text1": "Tjenestekatalog",
        "header text2": "Utforsk, start og konfigurer tjenester med noen få klikk.",
        "header help": ({ catalogName, catalogDescription, repositoryUrl }) => (
            <>
                Du utforsker Helm Chart Repository{" "}
                <MuiLink href={repositoryUrl} target="_blank">
                    {catalogName}: {catalogDescription}
                </MuiLink>
            </>
        ),
        "here": "her",
        "show more": "Vis mer",
        "no service found": "Ingen tjeneste funnet",
        "no result found": ({ forWhat }) => `Ingen resultater funnet for ${forWhat}`,
        "check spelling": "Vennligst kontroller stavemåten eller prøv å utvide søket.",
        "go back": "Tilbake til hovedtjenester",
        "search results": "Søkeresultat",
        "search": "Søk"
    },
    "CatalogChartCard": {
        "launch": "Start",
        "learn more": "Lær mer"
    },
    "CatalogNoSearchMatches": {
        "no service found": "Ingen tjeneste funnet",
        "no result found": ({ forWhat }) => `Ingen resultater funnet for ${forWhat}`,
        "check spelling": "Vennligst kontroller stavemåten eller prøv å utvide søket.",
        "go back": "Tilbake til hovedtjenester"
    },
    "Launcher": {
        "header text1": "Tjenestekatalog",
        "header text2": "Utforsk, start og konfigurer tjenester med noen få klikk.",
        "chart sources": ({ chartName, urls }) =>
            urls.length === 0 ? (
                <></>
            ) : (
                <>
                    Tilgang til kild{urls.length === 1 ? "en" : "ene"} for diagrammet{" "}
                    {chartName}:&nbsp;
                    {elementsToSentence({
                        "elements": urls.map(source => (
                            <MuiLink href={source} target="_blank" underline="hover">
                                her
                            </MuiLink>
                        )),
                        "language": "no"
                    })}
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
                        ...(doOpensNewTab
                            ? { "target": "_blank", "onClick": undefined }
                            : {})
                    };
                }}
            >{`Vi har designet kommandolinjen for å gi deg full kontroll over dine Kubernetes-implementeringer.
Her er det du trenger å vite:

#### Hva er disse Helm-kommandoene?

Disse kommandoene er de eksakte Helm-kommandoene som Onyxia API vil utføre på dine vegne i ditt Kubernetes-navnerom.
Dette lar deg vite hva som skjer i kulissene når du interagerer med brukergrensesnittet.

#### Sanntidsoppdateringer

Når du interagerer med brukergrensesnittet, vil Helm-kommandoene automatisk oppdatere seg for å reflektere hva du gjør.

#### Hvorfor bør jeg bry meg?

- **Gjennomsiktighet:** Vi mener du har rett til å vite hvilke handlinger som utføres i ditt miljø.
- **Læring:** Å forstå disse kommandoene kan gi innsikt i Kubernetes og Helm, og dypere din kunnskap.
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

Føl deg fri til å utforske og ta kontroll over dine Kubernetes-implementeringer!
        `}</Markdown>
        )
    },
    "AcknowledgeSharingOfConfigConfirmDialog": {
        "acknowledge sharing of config confirm dialog title":
            "Vær oppmerksom, konfigurasjoner deles",
        "acknowledge sharing of config confirm dialog subtitle": ({
            groupProjectName
        }) => `Hvis du lagrer
        denne konfigurasjonen, vil hvert medlem av prosjektet ${groupProjectName} være i stand til å starte det.`,
        "acknowledge sharing of config confirm dialog body": `Selv om ingen personlig informasjon har blitt automatisk injisert
        av Onyxia, vær forsiktig så du ikke deler sensitiv informasjon i den gjenopprettbare konfigurasjonen.`,
        "cancel": "Avbryt",
        "i understand, proceed": "Jeg forstår, fortsett"
    },
    "AutoLaunchDisabledDialog": {
        "ok": "Ok",
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
    "NoLongerBookmarkedDialog": {
        "no longer bookmarked dialog title": "Endringene dine vil ikke bli lagret",
        "no longer bookmarked dialog body":
            "Klikk på bokmerkeikonet igjen for å oppdatere den lagrede konfigurasjonen din",
        "ok": "Ok"
    },
    "SensitiveConfigurationDialog": {
        "cancel": "Avbryt",
        "sensitive configuration dialog title":
            "Å starte denne tjenesten kan være farlig",
        "proceed to launch": "Fortsett til oppstart"
    },
    "LauncherMainCard": {
        "card title": "Opprett dine personlige tjenester",
        "friendly name": "Vennlig navn",
        "launch": "Start",
        "cancel": "Avbryt",
        "copy url helper text": "Kopier URL for å gjenopprette denne konfigurasjonen",
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
            chartName,
            catalogRepositoryUrl,
            catalogName
        }) => (
            <>
                Versjon av Chart {chartName} i&nbsp;
                <MuiLink href={catalogRepositoryUrl}>Helm depotet {catalogName}</MuiLink>
            </>
        ),
        "save changes": "Lagre endringer"
    },
    "LauncherConfigurationCard": {
        "global config": "Global konfigurasjon",
        "configuration": ({ packageName }) => `${packageName} konfigurasjoner`,
        "dependency": ({ dependencyName }) => `${dependencyName} avhengighet`,
        "launch of a service": ({ dependencyName }) =>
            `En ${dependencyName} tjeneste vil bli startet`,
        "mismatching pattern": ({ pattern }) => `Bør samsvare med ${pattern}`,
        "Invalid YAML Object": "Ugyldig YAML-objekt",
        "Invalid YAML Array": "Ugyldig YAML-array"
    },
    "Footer": {
        "contribute": "Bidra",
        "terms of service": "Vilkår for bruk",
        "change language": "Bytt språk",
        "dark mode switch": "Mørk modus"
    },
    "MyServices": {
        "text1": "Mine tjenester",
        "text2": "Få tilgang til de kjørende tjenestene dine",
        "text3": "Tjenestene skal avsluttes så snart du slutter å bruke dem aktivt.",
        "running services": "Kjørende tjenester"
    },
    "MyServicesConfirmDeleteDialog": {
        "confirm delete title": "Er du sikker?",
        "confirm delete subtitle":
            "Forsikre deg om at tjenestene dine er klare til å bli slettet",
        "confirm delete body shared services":
            "Vær oppmerksom på at noen av tjenestene dine deles med de andre prosjektmedlemmene.",
        "confirm delete body":
            "Ikke glem å laste opp koden din på GitHub eller GitLab før du avslutter tjenestene dine",
        "cancel": "Avbryt",
        "confirm": "Ja, slett"
    },
    "MyServicesButtonBar": {
        "refresh": "Oppdater",
        "launch": "Ny tjeneste",
        "trash": "Slett alt",
        "trash my own": "Slett alle mine tjenester"
    },
    "MyServicesCard": {
        "service": "Tjeneste",
        "running since": "Kjører siden: ",
        "open": "åpne",
        "readme": "lesmeg",
        "shared by you": "Delt av deg",
        "which token expire when": ({ which, howMuchTime }) =>
            `${which}-tokenet utløper ${howMuchTime}.`,
        "which token expired": ({ which }) => `${which}-tokenet er utløpt.`,
        "reminder to delete services": "Husk å slette tjenestene dine.",
        "this is a shared service": "Denne tjenesten deles blant prosjektets medlemmer"
    },
    "MyServicesRunningTime": {
        "launching": "Starter..."
    },
    "MyServicesRestorableConfigOptions": {
        "edit": "Rediger",
        "copy link": "Kopier URL-lenke",
        "remove bookmark": "Slett"
    },
    "MyServicesRestorableConfig": {
        "edit": "Rediger",
        "launch": "Start"
    },
    "MyServicesRestorableConfigs": {
        "saved": "Lagret",
        "show all": "Vis alle"
    },
    "ReadmeAndEnvDialog": {
        "ok": "ok",
        "return": "Gå tilbake"
    },
    "CopyOpenButton": {
        "first copy the password": "Klikk for å kopiere passordet...",
        "open the service": "Åpne tjenesten 🚀"
    },
    "MyServicesCards": {
        "running services": "Kjørende tjenester"
    },
    "NoRunningService": {
        "launch one": "Klikk her for å starte en",
        "no services running": "Du har ingen kjørende tjenester"
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
        "pastN": ({ divisorKey }) => {
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
        "future1": ({ divisorKey }) => {
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
        "futureN": ({ divisorKey }) => {
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
    }
};
