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
        profile: "Profil",
        git: "Git",
        k8sCodeSnippets: "Kubernetes",
        "user-interface": "Grensesnittspreferanser",
        text1: "Min konto",
        text2: "Få tilgang til ulik kontoinformasjon.",
        text3: "Konfigurer brukernavn, e-postadresser, passord og personlige tilgangstokens direkte tilkoblet tjenestene dine.",
        "personal tokens tooltip":
            "Passord som genereres for deg og har en gitt gyldighetsperiode",
        vault: "Vault"
    },
    AccountProfileTab: {
        "account id": "Kontoidentifikator",
        "account id helper":
            "Dine immaterielle identifikatorer knyttet til identiteten du bruker for å logge inn på plattformen",
        "user id": "Bruker-ID",
        email: "E-post",
        "account management": "Kontoadministrasjon"
    },
    UserProfileForm: {
        "customizable profile": "Tilpassbar profil",
        "customizable profile helper":
            "Nyttig informasjon for automatisk konfigurasjon av tjenestene dine",
        save: "Lagre",
        restore: "Gjenopprett"
    },
    ConfirmNavigationDialog: {
        "you have unsaved changes": "Du har ulagrede endringer!",
        cancel: "Avbryt",
        "continue without saving": "Fortsett uten å lagre"
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
    ConfirmBucketCreationAttemptDialog: {
        "bucket does not exist title": ({ bucket }) => `Bucket ${bucket} finnes ikke`,
        "bucket does not exist body": "Vil du prøve å opprette den nå?",
        no: "Nei",
        yes: "Ja",
        "success title": "Vellykket",
        "failed title": "Feilet",
        "success body": ({ bucket }) => `Bucket ${bucket} ble opprettet.`,
        "failed body": ({ bucket }) => `Kunne ikke opprette ${bucket}.`,
        ok: "Ok"
    },
    ConfirmOverwriteDialog: {
        "dialog title": "Filen finnes allerede",
        "dialog body": "Vil du overskrive den eksisterende filen?",
        "no, keep the existing file": "Nei, behold den eksisterende filen",
        "yes, overwrite": "Ja, overskriv"
    },
    ConfirmCustomS3ConfigDeletionDialog: {
        "dialog title": "Bekreft sletting av egendefinert S3-konfigurasjon?",
        cancel: "Avbryt",
        yes: "Ja"
    },
    DisplayErrorDialog: {
        error: "Feil",
        ok: "Ok"
    },
    S3Explorer: {
        "page header title": "Datalagring",
        "create profile": "Opprett profil",
        back: "Tilbake",
        upload: "Last opp",
        "create new prefix": "Opprett nytt prefiks"
    },
    S3ShareObjectDialogContainer: {
        "dialog title": "Del objekt"
    },
    S3BookmarksBar: {
        "s3 bookmarks aria label": "S3-bokmerker",
        "show more bookmarks": "Vis flere bokmerker"
    },
    S3BookmarkItem: {
        "open bookmark": "Åpne bokmerke",
        "open bucket": "Åpne bucket",
        "bookmark actions": "Bokmerkehandlinger",
        rename: "Gi nytt navn",
        delete: "Slett",
        "rename bookmark": "Gi bokmerke nytt navn",
        "delete bookmark": "Slett bokmerke"
    },
    S3BookmarksEntryPointList: {
        "s3 bookmark entry points aria label": "S3-bokmerkeinnganger",
        bookmarks: "Bokmerker",
        "no bookmarks yet": "Ingen bokmerker ennå.",
        "storage locations": "Lagringssteder"
    },
    S3DialogCopyField: {
        "generating url": "Genererer URL...",
        copy: "Kopier",
        copied: "Kopiert"
    },
    S3DialogItemSummary: {
        public: "Offentlig"
    },
    S3ProfileSelect: {
        "select s3 profile aria label": "Velg S3-profil",
        "profile settings aria label": "Profilinnstillinger",
        "s3 profiles aria label": "S3-profiler",
        "new s3 profile": "Ny S3-profil"
    },
    S3SelectionActionBar: {
        download: "Last ned",
        delete: "Slett",
        "copy s3 uri": "Kopier S3-URI",
        copied: "Kopiert",
        "copy s3 uri tooltip": ({ s3UriStr }) => `Kopier "${s3UriStr}"`,
        "add to bookmarks": "Legg til i bokmerker",
        "delete from bookmarks": "Fjern fra bokmerker",
        share: "Del",
        "make public": "Gjør offentlig",
        "make private": "Gjør privat",
        "one selected": "1 valgt",
        "many selected": ({ count }) => `${count} valgt`,
        "clear selection": "Fjern valg"
    },
    ConfirmAbortUploadDialog: {
        "dialog title": "Avbryte opplasting?",
        "dialog body": "Opplastingen er ikke fullført. Vil du avbryte opplastingen?",
        "continue upload": "Fortsett opplasting",
        "cancel upload": "Avbryt opplasting"
    },
    S3Uploads: {
        "uploading count": ({ count }) =>
            `Laster opp ${count} element${count === 1 ? "" : "er"}...`,
        "upload count": ({ count }) => `${count} opplasting${count === 1 ? "" : "er"}`,
        "expand uploads": "Utvid opplastinger",
        "collapse uploads": "Skjul opplastinger",
        "close uploads": "Lukk opplastinger",
        "uploading status": "Laster opp...",
        completed: "Fullført",
        error: "Feil",
        "uploaded size of total size": ({ uploadedSize, totalSize }) =>
            `${uploadedSize} av ${totalSize}`,
        of: "av",
        "open uploaded directory": "Åpne opplastet mappe",
        "cancel upload": "Avbryt opplasting",
        "retry upload": "Prøv opplasting på nytt"
    },
    CustomNoRowsOverlay: {
        "no rows": "Ingen rader"
    },
    DataTextEditor: {
        "not a valid format": ({ format }) => `Ikke gyldig format: ${format}`,
        format: "Format",
        "all defaults": "Alle standardverdier",
        schema: "Skjema"
    },
    JsonSchemaDialog: {
        "json schema": "JSON-skjema",
        ok: "Ok"
    },
    SelectFormField: {
        "empty string": "(Tom streng)"
    },
    CreateOrRenameBookmarkDialog: {
        "dialog title": "Bokmerkenavn",
        "add dialog title": "Legg denne plasseringen til i bokmerker",
        "rename dialog title": "Gi bokmerke nytt navn",
        "dialog subtitle":
            "Lagre denne S3-plasseringen slik at du finner den raskere senere.",
        "bookmarkName textField label": "Navn",
        "bookmarkName textField empty error": "Bokmerkenavnet kan ikke være tomt",
        "copy s3 path aria label": "Kopier S3-sti",
        cancel: "Avbryt",
        ok: "Ok",
        "add to bookmarks": "Legg til i bokmerker",
        "rename bookmark": "Gi bokmerke nytt navn"
    },
    DirectoryCreationDialog: {
        "dialog title": "Opprett katalog",
        "dialog subtitle":
            "Kataloger opprettes relativt til prefikset som vises akkurat nå.",
        "create prefix dialog title": "Opprett prefiks",
        "create prefix dialog subtitle":
            "Opprett et nytt prefiks i gjeldende S3-plassering.",
        "directoryName textField label": "Katalognavn",
        "prefixName textField label": "Prefiksnavn",
        "directoryName textField empty error": "Katalognavnet kan ikke være tomt",
        "directoryName textField duplicate error": "Katalognavnet finnes allerede",
        cancel: "Avbryt",
        create: "Opprett",
        "create prefix": "Opprett prefiks"
    },
    MakePrefixPublicDialog: {
        "dialog title": "Gjør prefikset offentlig",
        "make public dialog title": "Gjør dette prefikset offentlig?",
        "make private dialog title": "Gjør dette prefikset privat?",
        "make public dialog body main":
            "Alle filer i dette prefikset blir tilgjengelige for alle med en lenke, inkludert nåværende og fremtidig innhold.",
        "make public dialog body alternative":
            "Hvis du vil dele bestemte filer eller begrense tilgang over tid, kan du opprette en delingslenke i stedet.",
        "make private dialog body main":
            "Alle filer i dette prefikset er tilgjengelige for alle med en lenke, inkludert nåværende og fremtidig innhold. Når prefikset gjøres privat, fjernes offentlig tilgang.",
        "make private dialog body alternative":
            "Hvis du vil dele bestemte filer eller begrense tilgang over tid, kan du opprette en delingslenke i stedet.",
        "dialog body": ({ s3Uri, s3UriClassName }) => (
            <>
                Du er i ferd med å gjøre <span className={s3UriClassName}>{s3Uri}</span>{" "}
                offentlig. Alle kan liste opp og laste ned alle nåværende og fremtidige
                objekter i dette prefikset.
                <br />
                <br />
                Nedlastingslenker du deler for objekter i dette prefikset, utløper aldri.
            </>
        ),
        cancel: "Avbryt",
        "make public": "Gjør offentlig",
        "make private": "Gjør privat"
    },
    S3ExplorerMainView: {
        "create prefix dialog title": "Opprett prefiks",
        "create prefix dialog subtitle":
            "Opprett et nytt prefiks i gjeldende S3-plassering.",
        "prefix name field label": "Prefiksnavn",
        "prefix name empty error": "Prefiksnavnet kan ikke være tomt.",
        cancel: "Avbryt",
        "create prefix": "Opprett prefiks",
        "delete selection dialog title": "Slett utvalg",
        "delete selection dialog subtitle":
            "Denne handlingen sletter de valgte elementene permanent.",
        "delete selection dialog body": ({ count }) =>
            `Du er i ferd med å slette ${count} valgt${count > 1 ? "e elementer" : " element"}. Hvis du sletter et prefiks, slettes også alt innholdet i det.`,
        delete: "Slett",
        share: "Del",
        download: "Last ned",
        "copy s3 uri": "Kopier S3-URI",
        copied: "Kopiert",
        "copy s3 uri tooltip": ({ s3UriStr }) => `Kopier "${s3UriStr}"`,
        "add to bookmarks": "Legg til i bokmerker",
        "delete from bookmarks": "Slett fra bokmerker",
        "make public": "Gjør offentlig",
        "make private": "Gjør privat",
        folder: "Mappe",
        object: "Objekt",
        "folder is public": "Mappen er offentlig",
        "folder is private": "Mappen er privat",
        today: "I dag",
        yesterday: "I går",
        "access denied": "Tilgang nektet",
        "bucket not found": "Bucket ikke funnet",
        "access denied description":
            "Du har ikke tillatelse til å vise denne S3-plasseringen.",
        "bucket not found description":
            "Den forespurte bucket-en finnes ikke eller er ikke tilgjengelig med gjeldende profil.",
        "select item": ({ itemName }) => `Velg ${itemName}`,
        "select all items": "Velg alle elementer",
        public: "Offentlig",
        deleting: "Sletter...",
        uploading: "Laster opp",
        "drag and drop to import files": "Dra og slipp for å importere filer",
        "go back": "Gå tilbake",
        "no objects found": "Ingen objekter funnet",
        "no objects found description": ({ s3UriStr }) =>
            `Det finnes ingen objekter med nøkkel som starter med "${s3UriStr}".`,
        "this prefix is empty": "Dette prefikset er tomt",
        "empty prefix description":
            "Last opp filer eller opprett en mappe for å begynne å fylle denne plasseringen.",
        "empty prefix upload description":
            "Last opp filer her eller dra og slipp dem i dette området.",
        "upload files": "Last opp filer",
        "upload files here": "Last opp filer her",
        "drop files here hint":
            "Slipp filer hvor som helst i dette området for å laste dem opp.",
        "new folder": "Ny mappe",
        name: "Navn",
        "last modified": "Sist endret",
        size: "Størrelse"
    },
    S3ShareObjectDialog: {
        "generating public URL": "Genererer offentlig URL...",
        "copy public URL aria label": "Kopier offentlig URL",
        "signed link with time limit": "Signert lenke med tidsbegrensning",
        "signed link validity aria label": "Gyldighetsperiode for signert lenke",
        "generating signed URL": "Genererer signert URL...",
        "copy signed URL aria label": "Kopier signert URL",
        "public description":
            "Alle med URL-en kan få tilgang til dette objektet. Lenken utløper aldri fordi objektet ligger i et offentlig prefiks.",
        "signed description":
            "Opprett en signert URL med begrenset gyldighetsperiode. For å dele en URL som ikke utløper, gjør et av de overordnede prefiksene til dette objektet offentlig.",
        "validity duration one hour": "1 time",
        "validity duration one day": "1 dag",
        "validity duration one week": "1 uke",
        "selected duration": "den valgte varigheten"
    },
    S3ProfileDialog: {
        "detail title": "S3-profildetaljer",
        "create title": "Ny egendefinert S3-profil",
        "edit title": "Rediger egendefinert S3-profil",
        "close aria label": "Lukk S3-profildialog"
    },
    S3ProfileDetails: {
        "read only": "Skrivebeskyttet",
        custom: "Egendefinert",
        edit: "Rediger",
        delete: "Slett",
        "connection details title": "Tilkoblingsdetaljer",
        "connection details subtitle":
            "Bruk disse verdiene når du konfigurerer S3-klienter utenfor utforskeren.",
        "endpoint url label": "Endepunkt-URL",
        "default region label": "Standardregion",
        "access credentials title": "Tilgangslegitimasjon",
        "access credentials anonymous subtitle":
            "Denne profilen viser ikke legitimasjon. Bruk anonym S3-tilgang der målbøtten tillater det.",
        "access credentials subtitle":
            "Kopier verdien som kreves av klienten du konfigurerer.",
        "access key id label": "Tilgangsnøkkel-ID",
        "secret access key label": "Hemmelig tilgangsnøkkel",
        "session token label": "Økt-token",
        "environment variable": "Miljøvariabel",
        "no expiration": "Ingen utløpstid er annonsert for denne legitimasjonen.",
        expires: ({ expirationTime }) => `Utløper ${expirationTime}.`,
        renewing: "Fornyer...",
        "renew tokens": "Forny tokens",
        "init script title": "For å få tilgang til lagringen utenfor Datalab-tjenester",
        "init script subtitle":
            "Last ned eller kopier init-skriptet i programmeringsspråket du ønsker.",
        "technology aria label": "Teknologi",
        download: "Last ned",
        "select s3 profile aria label": "Velg S3-profil",
        "s3 profiles aria label": "S3-profiler",
        "new s3 profile": "Ny S3-profil",
        "copy aria label": ({ what }) => `Kopier ${what}`,
        copied: "Kopiert",
        copy: "Kopier"
    },
    S3ProfileForm: {
        "must be an url": "Skriv inn en gyldig URL.",
        "is required": "Dette feltet er obligatorisk.",
        "not a valid access key id": "Skriv inn en gyldig tilgangsnøkkel-ID.",
        "profile name already used": "Dette profilnavnet er allerede i bruk.",
        "connection details title": "Tilkoblingsdetaljer",
        "connection details subtitle":
            "Definer profilnavnet og S3-endepunktet som brukes av utforskeren.",
        "profile name label": "Profilnavn",
        "s3 service url label": "URL til S3-tjenesten",
        "s3 service url helper": "Eksempel: https://minio.lab.example.net",
        "default region label": "Standardregion",
        "default region helper": "Eksempel: eu-west-1, la stå tomt hvis du er usikker",
        "url style title": "URL-stil",
        "url style subtitle":
            "Angi hvordan S3-serveren formaterer URL-en for nedlasting av filer.",
        "path style": "Stistil",
        "virtual hosted style": "Virtual-hosted stil",
        example: "Eksempel",
        "account credentials title": "Kontolegitimasjon",
        "account credentials subtitle":
            "Velg om profilen bruker anonym tilgang eller eksplisitt legitimasjon.",
        "anonymous access": "Anonym tilgang",
        "access key id label": "Tilgangsnøkkel-ID",
        "access key id helper": "Eksempel: ASIAIOSFODNN7EXAMPLE",
        "secret access key label": "Hemmelig tilgangsnøkkel",
        "secret access key helper": "Eksempel: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
        "session token label": "Økt-token",
        "session token helper":
            "Valgfritt. La stå tomt når legitimasjonen ikke inneholder et økt-token.",
        cancel: "Avbryt",
        "save configuration": "Lagre konfigurasjon",
        "create profile": "Opprett profil"
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
    SecretsExplorerButtonBar: {
        secret: "hemmelighet",
        rename: "gi nytt navn",
        delete: "slett",
        "create secret": "Opprett hemmelighet",
        "copy path": "Bruk i en tjeneste",
        "create new empty directory": "Opprett katalog",
        refresh: "oppdater",
        "create what": ({ what }) => `Opprett ${what}`,
        new: "Ny"
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
    Header: {
        login: "Logg inn",
        logout: "Logg ut",
        region: "Region"
    },
    ProjectSelect: {
        project: "Prosjekt"
    },
    LeftBar: {
        reduce: "Reduser",
        home: "Hjem",
        account: "Min konto",
        catalog: "Tjenestekatalog",
        myServices: "Mine tjenester",
        mySecrets: "Mine hemmeligheter",
        "divider: services features": "Tjenestefunksjoner",
        "divider: external services features": "Eksterne tjenestefunksjoner",
        "divider: onyxia instance specific features":
            "Onyxia-instansspesifikke funksjoner",
        dataExplorer: "Datautforsker",
        dataCollection: "Samlingseksplorer",
        s3Explorer: "Datalagring",
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
        search: "Søk",
        "title all catalog": "Alle"
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
        ),
        form: "Skjema",
        editor: "Teksteditor"
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
    ConfigurationTopLevelGroup: {
        global: "global",
        miscellaneous: "Diverse",
        "Configuration that applies to all charts":
            "Konfigurasjon som gjelder for alle diagrammer",
        "Top level configuration values": "Konfigurasjonsverdier på toppnivå"
    },
    YamlCodeBlockFormField: {
        "not an array": "En matrise forventes",
        "not an object": "Et objekt forventes",
        "not valid yaml": "Ugyldig YAML/JSON"
    },
    TextFormField: {
        "not matching pattern": ({ pattern }) => `Matcher ikke mønsteret ${pattern}`,
        "toggle password visibility": "Bytt synlighet for passord",
        loading: "Laster..."
    },
    FormFieldGroupComponent: {
        add: "Legg til"
    },
    AutoInjectSwitch: {
        tooltip: ({ isAutoInjected }) => (
            <>
                Hvis aktivert, vil denne konfigurasjonen automatisk bli injisert i
                tjenestene dine. Du kan fortsatt legge den til manuelt når du starter en
                tjeneste, selv om dette er deaktivert.
                <br />
                <br />
                Nåværende status:{" "}
                <strong>{isAutoInjected ? "aktivert" : "deaktivert"}</strong>
            </>
        )
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
        "new logs are displayed in realtime": "Nye logger vises i sanntid",
        follow: "Følg"
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
        ),
        close: "Lukk"
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
        "trash my own": "Slett alle mine tjenester",
        events: "Hendelser"
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
        "remove bookmark": "Slett",
        "move down": "Flytt ned",
        "move up": "Flytt opp",
        "move to top": "Flytt helt til toppen",
        "move to bottom": "Flytt helt til bunnen"
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
        "resize table": "Endre størrelse",
        "unsupported file type": ({ supportedFileTypes }) =>
            `Ikke støttet dataformat. Støttede typer er: ${supportedFileTypes.join(", ")}.`,
        "no s3 client":
            "Ingen S3-klient konfigurert. Gå til innstillinger for å aktivere en for utforskeren.",
        "unsupported protocol":
            "URL støttes ikke. Støttede protokoller er https:// og s3://.",
        "https fetch error": "Kunne ikke hente HTTPS-fil.",
        "query error": "DuckDB-spørringsfeil."
    },
    UrlInput: {
        load: "Last",
        reset: "Tøm",
        "data source": "Datakilde"
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
        },
        singular: ({ divisorKey }) => {
            switch (divisorKey) {
                case "second":
                    return "1 sekund";
                case "minute":
                    return "1 minutt";
                case "hour":
                    return "1 time";
                case "day":
                    return "1 dag";
                case "week":
                    return "1 uke";
                case "month":
                    return "1 måned";
                case "year":
                    return "1 år";
            }
        },
        plural: ({ divisorKey }) => {
            switch (divisorKey) {
                case "second":
                    return "# sekunder";
                case "minute":
                    return "# minutter";
                case "hour":
                    return "# timer";
                case "day":
                    return "# dager";
                case "week":
                    return "# uker";
                case "month":
                    return "# måneder";
                case "year":
                    return "# år";
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
    },
    DatasetCard: {
        publishedOn: "Publisert",
        datasetPage: "Datasett-side",
        license: "Lisens:",
        format: "Format",
        size: "Størrelse",
        distributions: "Distribusjoner",
        visualize: "Visualiser",
        unknown: "Ukjent"
    },
    DataCollection: {
        "page header help title":
            "Skriv bare inn https://-URL-en til DCAT JSON-LD-skjemaet ditt",
        "page header title": "Datakatalog",
        "page header help content": ({ demoCatalogLink }) => (
            <>
                Skriv ganske enkelt inn <code>https://</code>-URL-en til en datakatalog
                for å forhåndsvise den.
                <br />
                Usikker på hvor du skal begynne? Prøv denne{" "}
                <MuiLink {...demoCatalogLink}>demokatalogen</MuiLink>!
            </>
        ),
        "https fetch error": "Kunne ikke hente HTTPS-ressursen.",
        "invalid json response": "Svaret er ikke gyldig JSON.",
        "json-ld compact error": "Klarte ikke å komprimere JSON-LD-responsen.",
        "json-ld frame error": "Klarte ikke å frame JSON-LD-responsen.",
        "datasets parsing error": "Kunne ikke tolke datasett fra katalogen."
    },
    S3UriBar: {
        explore: "Utforsk..",
        "copy s3 path": "Kopier S3-sti",
        copied: "Kopiert",
        "copied path": ({ s3Uri }) => `Kopiert sti: ${s3Uri}`,
        "add to bookmarks": "Legg til i bokmerker",
        "delete from bookmarks": "Slett fra bokmerker",
        "pinned storage location": "Festet lagringssted",
        bookmarked: "Bokmerket",
        "edit s3 uri": "Rediger S3-URI",
        prefix: "Prefiks",
        "admin bookmark": "Admin-bokmerke",
        bookmark: "Bokmerke",
        object: "Objekt",
        public: "Offentlig",
        "go to s3 uri": ({ s3Uri, isPublic }) =>
            `${isPublic ? "Offentlig. " : ""}Gå til ${s3Uri}`,
        "s3 uri": "S3 URI",
        "edit from s3 root": "Rediger fra S3-rot",
        "edit object key": "Rediger objektnøkkel",
        "object key": "Objektnøkkel",
        listing: "Lister..."
    }
};
