import MuiLink from "@mui/material/Link";
import type { Translations } from "../types";

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
        "credentials section title": "Koble til Kubernetes-klyngen",
        "credentials section helper": "Credentials to manage the Kubernetes cluster",
        "init script section title":
            "To connect to the Kubernetes cluster via your local kubectl",
        "init script section helper": "Download or copy the script",
        "expires in": ({ howMuchTime }) => `The token expires in ${howMuchTime}`
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
        "dev mode helper": "Aktiver funksjoner som for øyeblikket er under utvikling"
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
    "App": {
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
        "portrait mode not supported": "Portrettmodus støttes ikke ennå",
        "instructions":
            "For å bruke denne appen på telefonen din, må du aktivere rotasjonssensoren og snu telefonen."
    },
    "Home": {
        "welcome": ({ who }) => `Velkommen ${who}!`,
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
    "CatalogExplorerCard": {
        "launch": "Start",
        "learn more": "Lær mer"
    },
    "CatalogExplorerCards": {
        "show more": "Vis mer",
        "no service found": "Ingen tjeneste funnet",
        "no result found": ({ forWhat }) => `Ingen resultater funnet for ${forWhat}`,
        "check spelling": "Vennligst kontroller stavemåten eller prøv å utvide søket.",
        "go back": "Tilbake til hovedtjenester",
        "main services": "Hovedtjenester",
        "all services": "Alle tjenester",
        "search results": "Søkeresultat",
        "search": "Søk"
    },
    "Catalog": {
        "header text1": "Tjenestekatalog",
        "header text2": "Utforsk, start og konfigurer tjenester med noen få klikk.",
        "contribute to the catalog": ({ catalogName }) => (
            <>Bidra til {catalogName} katalogen</>
        ),
        "contribute to the package": ({ packageName }) =>
            `Finn kildekoden for ${packageName} pakken `,
        "here": "her"
    },
    "CatalogLauncher": {
        "no longer bookmarked dialog title": "Endringene dine vil ikke bli lagret",
        "no longer bookmarked dialog body":
            "Klikk på bokmerkeikonet igjen for å oppdatere den lagrede konfigurasjonen din",
        "ok": "Ok",
        "should overwrite configuration dialog title": "Ønsker du å erstatte den?",
        "should overwrite configuration dialog subtitle": ({ friendlyName }) =>
            `«${friendlyName}» finnes allerede i lagringen din.`,
        "should overwrite configuration dialog body":
            "Du har allerede en lagret tjeneste med dette navnet. Hvis du erstatter den, vil den forrige konfigurasjonen gå tapt",
        "cancel": "Avbryt",
        "replace": "Erstatt den",
        "sensitive configuration dialog title":
            "Å starte denne tjenesten kan være farlig",
        "proceed to launch": "Fortsett til oppstart",
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
        ),
        "download as script": "Last ned som skript",
        "api logs help body": `Velkommen til vår Helm Kommando Forklaring Dialog!  
Vi har designet dette grensesnittet for å gi deg full kontroll over dine Kubernetes-implementeringer.  
Her er det du trenger å vite:  

#### Hva er denne Helm Kommandoen?  

Kommandoen som vises på skjermen er den eksakte Helm-kommandoen som vår applikasjon vil kjøre på dine vegne i din Kubernetes-navnerom.  
Dette gir deg innsikt i hva som skjer i bakgrunnen når du klikker på 'start'-knappen.  

#### Sanntidsoppdateringer  

Når du endrer alternativer i brukergrensesnittet, vil Helm-kommandoen automatisk oppdatere for å gjenspeile disse endringene.  
På denne måten kan du se hvordan dine valg påvirker det underliggende systemet.  

#### Hvorfor bør jeg bry meg?  

- **Gjennomsiktighet:** Vi mener at du har rett til å vite hvilke handlinger som utføres i ditt miljø.  
- **Læring:** Å forstå disse kommandoene kan gi innsikt i Kubernetes og Helm, og utdype din kunnskap.  
- **Manuell Kjøring:** Du kan kopiere og lime inn dette kommandoen i en terminal med skrivetilgang til Kubernetes, noe som lar deg manuelt starte tjenesten.  

#### Hvordan kan jeg kjøre denne kommandoen manuelt?  

Det er to måter å kjøre disse kommandoene på:  

- **Lokal Terminal:** Gå til \`Min Konto -> Kubernetes-fanen\`.  
  Her vil du finne legitimasjonen som tillater deg å kjøre kommandoer i din Kubernetes-navnerom fra din lokale terminal.  

- **VSCode-Python Terminal:** Du kan også starte en VSCode-Python instans med Kubernetes-rollen satt til \`write\`.  
  Åpne en terminal i VSCode, og du vil være i stand til å utføre kommandoen.  

Ved å kjøre kommandoen manuelt, vil du fortsatt kunne se tjenesten på \`Mine Tjenester\`-siden som om den var lansert via brukergrensesnittet.  

Føl deg fri til å utforske og ta kontroll over dine Kubernetes-implementeringer!

        `
    },
    "Footer": {
        "contribute": "Bidra",
        "terms of service": "Vilkår for bruk",
        "change language": "Bytt språk",
        "dark mode switch": "Mørk modus"
    },
    "CatalogLauncherMainCard": {
        "card title": "Opprett dine personlige tjenester",
        "friendly name": "Vennlig navn",
        "launch": "Start",
        "cancel": "Avbryt",
        "copy url helper text": "Kopier URL for å gjenopprette denne konfigurasjonen",
        "save configuration": "Lagre denne konfigurasjonen",
        "share the service": "Del tjenesten",
        "share the service - explain":
            "Gjør tjenesten tilgjengelig for prosjektmedlemmene",
        "restore all default": "Gjenopprett standardkonfigurasjoner"
    },
    "CatalogLauncherConfigurationCard": {
        "global config": "Global konfigurasjon",
        "configuration": ({ packageName }) => `${packageName} konfigurasjoner`,
        "dependency": ({ dependencyName }) => `${dependencyName} avhengighet`,
        "launch of a service": ({ dependencyName }) =>
            `En ${dependencyName} tjeneste vil bli startet`,
        "mismatching pattern": ({ pattern }) => `Bør samsvare med ${pattern}`,
        "Invalid YAML Object": "Ugyldig YAML-objekt",
        "Invalid YAML Array": "Ugyldig YAML-array"
    },
    "MyServices": {
        "text1": "Mine tjenester",
        "text2": "Få tilgang til de kjørende tjenestene dine",
        "text3": "Tjenestene skal avsluttes så snart du slutter å bruke dem aktivt.",
        "running services": "Kjørende tjenester",
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
        "password": "Kopier passordet til tjenestene",
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
    "MyServicesSavedConfigOptions": {
        "edit": "Rediger",
        "copy link": "Kopier URL-lenke",
        "remove bookmark": "Slett"
    },
    "MyServicesSavedConfig": {
        "edit": "Rediger",
        "launch": "Start"
    },
    "MyServicesSavedConfigs": {
        "saved": "Lagret",
        "show all": "Vis alle"
    },
    "MyServicesCards": {
        "running services": "Kjørende tjenester",
        "no services running": "Du har ingen kjørende tjenester",
        "launch one": "Klikk her for å starte en",
        "ok": "ok",
        "need to copy": "Trenger du å kopiere ukuttet verdi?",
        "everything have been printed to the console":
            "Alt er blitt skrevet ut i konsollen",
        "first copy the password": "Først, kopier tjeneste...",
        "open the service": "Åpne tjenesten 🚀",
        "return": "Gå tilbake"
    },
    "ApiLogsBar": {
        "ok": "ok"
    }
};
