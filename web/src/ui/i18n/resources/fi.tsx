import MuiLink from "@mui/material/Link";
import type { Translations } from "../types";
import { Markdown } from "ui/shared/Markdown";
import { Icon } from "onyxia-ui/Icon";
import type { MuiIconComponentName } from "onyxia-ui/MuiIconComponentName";
import { id } from "tsafe/id";
import { capitalize } from "tsafe/capitalize";
import { MaybeLink } from "ui/shared/MaybeLink";

export const translations: Translations<"fi"> = {
    /* spell-checker: disable */
    "Account": {
        "infos": "Tilin tiedot",
        "git": undefined,
        "storage": "Yhdistä tallennustilaan",
        "k8sCodeSnippets": "Kubernetes",
        "user-interface": "Käyttöliittymän asetukset",
        "text1": "Oma tili",
        "text2": "Pääset käsiksi erilaisiin tilin tietoihin.",
        "text3":
            "Määritä käyttäjänimesi, sähköpostiosoitteesi, salasanat ja henkilökohtaiset pääsytunnukset, jotka ovat suoraan yhteydessä palveluihisi.",
        "personal tokens tooltip":
            "Sinulle generoidut salasanat, joilla on määritelty voimassaoloaika",
        "vault": "Vault"
    },
    "AccountInfoTab": {
        "general information": "Yleiset tiedot",
        "user id": "Käyttäjätunnus (IDEP)",
        "full name": "Koko nimi",
        "email": "Sähköpostiosoite",
        "instructions about how to change password":
            'Vaihtaaksesi salasanasi, kirjaudu vain ulos ja klikkaa "unohdin salasanani" -linkkiä.'
    },
    "AccountGitTab": {
        "gitName": "Käyttäjänimi Gitille",
        "gitName helper text": ({ gitName, focusClassName }) => (
            <>
                Tämä komento asettaa globaalin Git-käyttäjänimesi ja suoritetaan palvelun
                käynnistyessä:&nbsp;
                <code className={focusClassName}>
                    git config --global user.name "{gitName || "<käyttäjänimesi>"}"
                </code>
            </>
        ),
        "gitEmail": "Sähköposti Gitille",
        "gitEmail helper text": ({ gitEmail, focusClassName }) => (
            <>
                Tämä komento asettaa globaalin Git-sähköpostiosoitteesi ja suoritetaan
                palvelun käynnistyessä:&nbsp;
                <code className={focusClassName}>
                    git config --global user.email "
                    {gitEmail || "<sähköpostisi@domain.com>"}"
                </code>
            </>
        ),
        "githubPersonalAccessToken": "Henkilökohtainen pääsyavain Git-alustalle",
        "githubPersonalAccessToken helper text": ({ focusClassName }) => (
            <>
                Tämän avaimen antaminen mahdollistaa yksityisten GitHub- tai
                GitLab-repositorioidesi kloonaamisen ja päivittämisen ilman, että sinun
                tarvitsee syöttää alustan tunnistetietojasi uudelleen.
                <br />
                Tämä avain on myös saatavilla ympäristömuuttujana:&nbsp;
                <span className={focusClassName}>$GIT_PERSONAL_ACCESS_TOKEN</span>
            </>
        )
    },
    "AccountStorageTab": {
        "credentials section title": "Yhdistä datat palveluihisi",
        "credentials section helper":
            "Amazon-yhteensopiva MinIO-objektivarasto (AWS S3). Tämä tieto täytetään automaattisesti.",
        "accessible as env": "Käytettävissä palveluissasi ympäristömuuttujana:",
        "init script section title":
            "Pääsy tallennustilaan datalab-palveluiden ulkopuolelta",
        "init script section helper":
            "Lataa tai kopioi alustan tukemat aloituskomenskriptit valitsemallasi ohjelmointikielellä.",
        "expires in": ({ howMuchTime }) => `Vanhenee ${howMuchTime} kuluttua`
    },
    "AccountKubernetesTab": {
        "credentials section title": "Yhdistä Kubernetes-klusteriin",
        "credentials section helper":
            "Käyttöoikeudet suoraan yhteyteen Kubernetes API-palvelimen kanssa.",
        "init script section title": "Komentosarja",
        "init script section helper": ({ installKubectlUrl }) => (
            <>
                Tämä skripti mahdollistaa kubectlin tai helmin käytön paikallisella
                koneellasi. <br />
                Käyttääksesi sitä,{" "}
                <MuiLink href={installKubectlUrl} target="_blank">
                    asenna kubectl koneellesi
                </MuiLink>{" "}
                ja suorita skripti kopioimalla ja liittämällä se terminaaliisi.
                <br />
                Tämän jälkeen voit varmistaa, että se toimii ajamalla komennon&nbsp;
                <code>kubectl get pods</code> tai <code>helm list</code>
            </>
        ),
        "expires in": ({ howMuchTime }) =>
            `Nämä käyttöoikeudet ovat voimassa seuraavat ${howMuchTime}`
    },
    "AccountVaultTab": {
        "credentials section title": "Vault-todennustiedot",
        "credentials section helper": ({ vaultDocHref, mySecretLink }) => (
            <>
                <MuiLink href={vaultDocHref} target="_blank">
                    Vault
                </MuiLink>{" "}
                on järjestelmä, jossa säilytetään&nbsp;
                <MuiLink {...mySecretLink}>salaisuuksiasi</MuiLink>.
            </>
        ),
        "init script section title": "Käytä Vaultia terminaalista",
        "init script section helper": ({ vaultCliDocLink }) => (
            <>
                Lataa tai kopioi <code>ENV</code>-muuttujat, jotka määrittävät paikallisen{" "}
                <MuiLink href={vaultCliDocLink} target="_blank">
                    Vault CLI:n
                </MuiLink>
            </>
        ),
        "expires in": ({ howMuchTime }) => `Pääte vanhenee ${howMuchTime} kuluttua`
    },
    "ProjectSettings": {
        "page header title": "Projektiasetukset",
        "page header help title": ({ groupProjectName }) =>
            groupProjectName === undefined
                ? "Henkilökohtaisen projektisi asetukset"
                : `Asetukset "${groupProjectName}"`,
        "page header help content": ({
            groupProjectName,
            doesUserBelongToSomeGroupProject
        }) => (
            <>
                Tällä sivulla voit määrittää asetuksia, jotka koskevat
                {groupProjectName === undefined
                    ? " henkilökohtaista projektiasi"
                    : ` ${groupProjectName} projektia`}
                .
                <br />
                {groupProjectName !== undefined && (
                    <>
                        Huomaa, että {groupProjectName} on ryhmäprojekti, joka on jaettu
                        muiden käyttäjien kanssa; tällä sivulla tekemäsi muutokset
                        koskevat kaikkia projektin jäseniä.
                        <br />
                    </>
                )}
                {doesUserBelongToSomeGroupProject && (
                    <>
                        Voit vaihtaa projekteja käyttämällä pudotusvalikkoa
                        otsikkopalkissa.
                        <br />
                    </>
                )}
                Huomaa, että vain Onyxia-instanssisi ylläpitäjä voi luoda uusia
                projekteja.
            </>
        ),
        "security-info": "Turvallisuustiedot",
        "s3-configs": "S3-konfiguraatiot"
    },
    "ProjectSettingsS3ConfigTab": {
        "add custom config": "Lisää mukautettu S3-kokoonpano"
    },
    "S3ConfigCard": {
        "data source": "Tietolähde",
        "credentials": "Tunnistetiedot",
        "sts credentials":
            "Dynaamisesti pyydetyt tokenit puolestasi Onyxian toimesta (STS)",
        "account": "Tili",
        "use in services": "Käytä palveluissa",
        "use in services helper": `Jos otettu käyttöön, tätä konfiguraatiota käytetään
            oletusarvoisesti palveluissasi, jotka toteuttavat S3-integraation.`,
        "use for onyxia explorers": "Käytä Onyxia-tutkijoille",
        "use for onyxia explorers helper": `Jos otettu käyttöön, tätä konfiguraatiota käytetään
            tiedostonhallintaohjelmassa ja data-analysaattorissa.`,
        "edit": "Muokkaa",
        "delete": "Poista"
    },
    "AddCustomS3ConfigDialog": {
        "dialog title": "Uusi mukautettu S3-kokoonpano",
        "dialog subtitle":
            "Määritä mukautettu palvelutili tai yhdistä toiseen S3-yhteensopivaan palveluun",
        "cancel": "Peruuta",
        "save config": "Tallenna kokoonpano",
        "update config": "Päivitä kokoonpano",
        "is required": "Tämä kenttä on pakollinen",
        "must be an url": "Ei ole kelvollinen URL-osoite",
        "not a valid access key id": "Tämä ei näytä kelvolliselta pääsyavain-ID:ltä",
        "url textField label": "URL",
        "url textField helper text": "S3-palvelun URL-osoite",
        "region textField label": "AWS S3-alue",
        "region textField helper text":
            "Esimerkki: eu-west-1, jos epävarma, jätä tyhjäksi",
        "workingDirectoryPath textField label": "Työkansion polku",
        "workingDirectoryPath textField helper text": (
            <>
                Tämän avulla voit määrittää ämpärin ja S3-objektin etuliitteen, joka
                sinulla on S3-palvelussa. <br />
                Esimerkki: <code>minun-ämpäri/etuliitteeni/</code> tai{" "}
                <code>vain minun-ämpäri/</code> jos omistat koko ämpärin.
            </>
        ),
        "account credentials": "Tilin tunnistetiedot",
        "friendlyName textField label": "Konfiguraation nimi",
        "friendlyName textField helper text":
            "Tämä auttaa sinua tunnistamaan tämän konfiguraation. Esimerkki: Minun AWS-bucket",
        "isAnonymous switch label": "Anonyymi pääsy",
        "isAnonymous switch helper text":
            "Aseta PÄÄLLE, jos salainen pääsyavain ei ole tarpeen",

        "accessKeyId textField label": "Pääsyavaimen tunnus",
        "accessKeyId textField helper text": "Esimerkki: 1A2B3C4D5E6F7G8H9I0J",
        "secretAccessKey textField label": "Salainen pääsyavain",
        "sessionToken textField label": "Istuntotunnus",
        "sessionToken textField helper text": "Valinnainen, jätä tyhjäksi, jos epävarma",
        "url style": "URL-tyyli",
        "url style helper text": `Määritä, miten S3-palvelimesi muotoilee tiedostojen lataamisen URL-osoitteita.`,
        "path style label": ({ example }) => (
            <>
                Polkutyyli
                {example !== undefined && (
                    <>
                        :&nbsp;
                        <code>{example}tietoaineisto.parquet</code>
                    </>
                )}
            </>
        ),
        "virtual-hosted style label": ({ example }) => (
            <>
                Virtual-hosted tyyli
                {example !== undefined && (
                    <>
                        :&nbsp;
                        <code>{example}tietoaineisto.parquet</code>
                    </>
                )}
            </>
        )
    },
    "TestS3ConnectionButton": {
        "test connection": "Testaa yhteys",
        "test connection failed": ({ errorMessage }) => (
            <>
                Yhteystestaus epäonnistui virheellä: <br />
                {errorMessage}
            </>
        )
    },
    "AccountUserInterfaceTab": {
        "title": "Käyttöliittymän asetukset",
        "enable dark mode": "Ota tumma tila käyttöön",
        "dark mode helper": "Tumma teema, jossa on tumma tausta.",
        "enable beta": "Ota käyttöön beta-testitila",
        "beta mode helper":
            "Edistyneitä alustan konfigurointeja ja ominaisuuksia varten.",
        "enable dev mode": "Ota käyttöön kehittäjätila",
        "dev mode helper": "Ota käyttöön kehitteillä olevat ominaisuudet",
        "Enable command bar": "Ota komentopalkki käyttöön",
        "Enable command bar helper": ({ imgUrl }) => (
            <>
                <MuiLink href={imgUrl} target="_blank">
                    Komentopalkki
                </MuiLink>{" "}
                antaa sinulle käsityksen komennoista, jotka suoritetaan puolestasi, kun
                käytät käyttöliittymää.
            </>
        )
    },
    "SettingField": {
        "copy tooltip": "Kopioi leikepöydälle",
        "language": "Vaihda kieltä",
        "service password": "Oletuspalvelusalasana",
        "service password helper text": ({ groupProjectName }) => (
            <>
                Tämä on oletussalasana, jota käytetään suojaamaan käynnissä olevat
                palvelusi. <br />
                Kun käynnistät palvelun, turvallisuusvälilehden salasanakenttä täytetään
                automaattisesti tällä salasanalla. <br />
                Napsauttamalla{" "}
                <Icon
                    size="extra small"
                    icon={id<MuiIconComponentName>("Refresh")}
                />{" "}
                -kuvaketta luodaan uusi satunnainen salasana. Huomaa kuitenkin, että se ei
                päivitä salasanaa palveluille, jotka ovat parhaillaan käynnissä. <br />
                Palvelusalasana on se, jonka Onyxia pyytää sinua kopioimaan
                leikepöydällesi ennen käynnissä olevan palvelun käyttöä. <br />
                {groupProjectName !== undefined && (
                    <>
                        Huomaa, että tämä salasana jaetaan kaikkien projektin (
                        {groupProjectName}) jäsenten kesken.
                    </>
                )}
            </>
        ),
        "not yet defined": "Ei vielä määritelty",
        "reset helper dialogs": "Nollaa ohjeikkunat",
        "reset": "Nollaa",
        "reset helper dialogs helper text":
            "Nollaa ohjeviestit, joista on pyydetty, ettei niitä näytetä uudelleen"
    },
    "MyFiles": {
        "page title - my files": "Omat tiedostot",
        "what this page is used for - my files":
            "Täällä voit selata S3 Bucket -tiedostojasi.",
        "help content": ({ accountTabLink, docHref }) => (
            <>
                Lue{" "}
                <MuiLink href={docHref} target="_blank">
                    dokumentaatiomme
                </MuiLink>
                . &nbsp;
                <MuiLink {...accountTabLink}>Määritä Minio-asiakkaat</MuiLink>.
            </>
        )
    },
    "MyFilesDisabledDialog": {
        "dialog title": "S3-palvelinta ei ole määritetty",
        "dialog body":
            "Tälle instanssille ei ole määritetty S3-palvelinta. Voit kuitenkin lisätä sellaisen manuaalisesti ottaaksesi käyttöön S3-tiedostonhallinnan.",
        "cancel": "Peruuta",
        "go to settings": "Siirry asetuksiin"
    },
    "MyFilesShareDialog": {
        "cancel": "Peruuta",
        "create and copy link": "Luo ja kopioi linkki"
    },
    "MySecrets": {
        "page title - my secrets": "Omat salaisuudet",
        "what this page is used for - my secrets":
            "Täällä voit määrittää muuttujia, jotka ovat käytettävissä palveluissasi ympäristömuuttujina.",
        "learn more - my files": "Jos haluat lisätietoja tiedostonhallinnasta,",
        "help content": ({ accountTabLink, docHref }) => (
            <>
                Lue{" "}
                <MuiLink href={docHref} target="_blank">
                    dokumentaatiomme
                </MuiLink>
                . &nbsp;
                <MuiLink {...accountTabLink}>Määritä paikallinen Vault CLI</MuiLink>.
            </>
        )
    },
    "SecretsExplorerItem": {
        "description": "kuvaus"
    },
    "ExplorerItem": {
        "description": "kuvaus"
    },
    "SecretsExplorerButtonBar": {
        "secret": "salaisuus",
        "rename": "nimeä uudelleen",
        "delete": "poista",
        "create secret": "Luo salaisuus",
        "copy path": "Käytä palvelussa",
        "create directory": "Luo hakemisto",
        "refresh": "päivitä",
        "create what": ({ what }) => `Luo ${what}`,
        "new": "Uusi"
    },
    "ExplorerButtonBar": {
        "file": "tiedosto",
        "delete": "poista",
        "upload file": "Lataa tiedosto",
        "copy path": "Kopioi S3-objektin nimi",
        "create directory": "Luo hakemisto",
        "refresh": "päivitä",
        "new": "Uusi",
        "share": "Jaa",
        "alt list view": "Näytä lista",
        "alt block view": "Näytä lohko"
    },
    "ExplorerItems": {
        "empty directory": "Tämä hakemisto on tyhjä"
    },
    "SecretsExplorerItems": {
        "empty directory": "Tämä hakemisto on tyhjä"
    },
    "SecretsExplorer": {
        "file": "tiedosto",
        "secret": "salaisuus",
        "create": "luo",
        "cancel": "peruuta",
        "delete": "poista",
        "do not display again": "Älä näytä uudelleen",

        "untitled what": ({ what }) => `nimetön_${what}`,
        "directory": "hakemisto",
        "deletion dialog title": ({ deleteWhat }) => `Poista ${deleteWhat}?`,
        "deletion dialog body": ({ deleteWhat }) => `Olet poistamassa ${deleteWhat}.
            Tätä toimintoa ei voi peruuttaa.`,
        "already a directory with this name": "Tämän niminen hakemisto on jo olemassa",
        "can't be empty": "Ei voi olla tyhjä",
        "new directory": "Uusi hakemisto"
    },
    "Explorer": {
        "file": "tiedosto",
        "secret": "salaisuus",
        "create": "luo",
        "cancel": "peruuta",
        "delete": "poista",
        "do not display again": "Älä näytä uudelleen",

        "untitled what": ({ what }) => `nimetön_${what}`,
        "directory": "hakemisto",
        "deletion dialog title": ({ deleteWhat }) => `Poista ${deleteWhat}?`,
        "deletion dialog body": ({ deleteWhat }) => `Olet poistamassa ${deleteWhat}.
            Tätä toimintoa ei voi peruuttaa.`,
        "already a directory with this name": "Tämän niminen hakemisto on jo olemassa",
        "can't be empty": "Ei voi olla tyhjä",
        "new directory": "Uusi hakemisto"
    },
    "MySecretsEditor": {
        "do not display again": "Älä näytä uudelleen",
        "add an entry": "Lisää uusi muuttuja",
        "environnement variable default name": "UUSI_MUUTTUJA",
        "table of secret": "muuttujien taulukko",

        "key column name": "Muuttujan nimi",
        "value column name": "Arvo",
        "unavailable key": "On jo käytössä",
        "invalid key empty string": "Nimi vaaditaan",
        "invalid key _ not valid": "Ei voi olla pelkästään _",
        "invalid key start with digit": "Ei voi alkaa numerolla",
        "invalid key invalid character": "Virheellinen merkki",
        "use this secret": `Käytä palveluissa`,
        "use secret dialog title": "Käytä palvelussa",
        "use secret dialog subtitle": "Salaisuuden polku on kopioitu",
        "use secret dialog body": `
                Kun käynnistät palvelun (RStudio, Jupyter jne.), siirry 
                salaisuus-välilehteen ja liitä salaisuuden polku,
                joka on tarkoitettu tähän käyttöön.
                Arvot lisätään ympäristömuuttujina.
            `,
        "use secret dialog ok": "Selvä"
    },
    "MySecretsEditorRow": {
        "key input desc": "Ympäristömuuttujan nimi",
        "value input desc": "Ympäristömuuttujan arvo"
    },
    "ExplorerUploadModalDropArea": {
        "browse files": "Selaa tiedostoja",
        "drag and drop or": "Vedä ja pudota tai"
    },
    "ExplorerUploadProgress": {
        "over": "yli",
        "importing": "Tuodaan"
    },
    "ExplorerUploadModal": {
        "import files": "Tuo tiedostoja",
        "cancel": "Peruuta",
        "minimize": "Pienennä"
    },

    "Header": {
        "login": "Kirjaudu sisään",
        "logout": "Kirjaudu ulos",
        "project": "Projekti",
        "region": "Alue"
    },
    "LeftBar": {
        "reduce": "Pienennä",
        "home": "Koti",
        "account": "Oma tili",
        "projectSettings": "Projektin asetukset",
        "catalog": "Palvelukatalogi",
        "myServices": "Omat palvelut",
        "mySecrets": "Omat salaisuudet",
        "myFiles": "Omat tiedostot",
        "divider: services features": "Palvelun ominaisuudet",
        "divider: external services features": "Ulkoisten palveluiden ominaisuudet",
        "divider: onyxia instance specific features":
            "Onyxia-instanssin erityisominaisuudet",
        "dataExplorer": "Data Explorer",
        "sqlOlapShell": "SQL OLAP-kuori"
    },
    "AutoLogoutCountdown": {
        "are you still there": "Oletko vielä siellä?",
        "you'll soon be automatically logged out":
            "Sinut kirjataan pian automaattisesti ulos."
    },
    "Page404": {
        "not found": "Sivua ei löydy"
    },
    "PortraitModeUnsupported": {
        "instructions":
            "Voit käyttää tätä sovellusta puhelimellasi ottamalla käyttöön kääntöanturin ja kääntämällä puhelimesi."
    },
    "MaybeAcknowledgeConfigVolatilityDialog": {
        "dialog title": "Huomio, asetukset ovat epävakaita",
        "dialog body": `Tämä Onyxia-instanssi ei toteuta mitään pysyvyyteen liittyvää mekanismia asetusten tallentamiseksi. 
            Kaikki asetukset tallennetaan selaimen paikalliseen muistiin. Tämä tarkoittaa, että jos tyhjennät selaimesi paikallisen 
            muistin tai vaihdat selainta, menetät kaikki asetuksesi.`,
        "do not show next time": "Älä näytä tätä viestiä uudelleen",
        "cancel": "Peruuta",
        "I understand": "Ymmärrän"
    },
    "Home": {
        "title authenticated": ({ userFirstname }) => `Tervetuloa, ${userFirstname}!`,
        "title": "Tervetuloa Onyxia datalabiin",
        "new user": "Uusi käyttäjä?",
        "login": "Kirjaudu sisään",
        "subtitle":
            "Työskentele Pythonin tai R:n kanssa ja nauti tarvitsemastasi laskentatehosta!",
        "cardTitle1": "Ergonominen ympäristö ja tarvittaessa saatavilla olevat palvelut",
        "cardTitle2": "Aktiivinen ja innostunut yhteisö palveluksessasi",
        "cardTitle3": "Nopea, joustava ja verkkopohjainen tietovarasto",
        "cardText1":
            "Analysoi dataa, suorita hajautettua laskentaa ja hyödynnä laajaa palvelukatalogia. Varaa tarvitsemasi laskentateho.",
        "cardText2":
            "Käytä ja jaa käytettävissä olevia resursseja: opetusohjelmia, koulutuksia ja keskustelufoorumeita.",
        "cardText3":
            "Helppo tapa käyttää omia ja saatavilla olevia tietoja ohjelmissasi - S3-rajapinnan toteutus",
        "cardButton1": "Tutustu katalogiin",
        "cardButton2": "Liity yhteisöön",
        "cardButton3": "Selaa tietoja"
    },
    "Catalog": {
        "header": "Palvelukatalogi",
        "no result found": ({ forWhat }) => `Tuloksia ei löytynyt haulle ${forWhat}`,
        "search results": "Hakutulokset",
        "search": "Haku"
    },
    "CatalogChartCard": {
        "launch": "Käynnistä",
        "learn more": "Lisätietoja"
    },
    "CatalogNoSearchMatches": {
        "no service found": "Palvelua ei löytynyt",
        "no result found": ({ forWhat }) => `Tuloksia ei löytynyt haulle ${forWhat}`,
        "check spelling": "Tarkista kirjoitus tai laajenna hakua.",
        "go back": "Palaa pääpalveluihin"
    },
    "Launcher": {
        "header text1": "Palvelukatalogi",
        "sources": ({
            helmChartName,
            helmChartRepositoryName,
            labeledHelmChartSourceUrls
        }) => (
            <>
                Olet ottamassa käyttöön{" "}
                {
                    <MaybeLink href={labeledHelmChartSourceUrls.helmChartSourceUrl}>
                        {helmChartName} Helm Chartin
                    </MaybeLink>
                }
                {
                    <MaybeLink
                        href={labeledHelmChartSourceUrls.helmChartRepositorySourceUrl}
                    >
                        {helmChartRepositoryName} Helm Chart -arkistosta
                    </MaybeLink>
                }
                .
                {labeledHelmChartSourceUrls.dockerImageSourceUrl !== undefined && (
                    <>
                        {" "}
                        Se perustuu{" "}
                        {
                            <MuiLink
                                href={labeledHelmChartSourceUrls.dockerImageSourceUrl}
                                target="_blank"
                            >
                                {helmChartName} Docker-kuvaan
                            </MuiLink>
                        }
                        .
                    </>
                )}
            </>
        ),

        "download as script": "Lataa skriptinä",
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
            >{`Olemme suunnitelleet komentopalkin siten, että voit ottaa hallinnan Kubernetes-julkaisuistasi.
Tässä on mitä sinun tarvitsee tietää:

#### Mitä nuo Helm-komennot ovat?

Nämä komennot ovat tarkat Helm-komennot, jotka Onyxia API suorittaa puolestasi Kubernetes-nimiavaruudessasi.
Tämä antaa sinulle mahdollisuuden ymmärtää, mitä kulissien takana tapahtuu, kun toimit käyttöliittymän kanssa.

#### Reaaliaikaiset päivitykset

Kun toimit käyttöliittymän kanssa, Helm-komennot päivittyvät automaattisesti heijastamaan tekemiäsi toimintoja.

#### Miksi minun pitäisi välittää?

- **Läpinäkyvyys:** Uskomme, että sinulla on oikeus tietää, mitä toimintoja ympäristössäsi suoritetaan.
- **Oppiminen:** Näiden komentojen ymmärtäminen voi tarjota näkemyksiä Kubernetesiin ja Helmiin, syventäen tietämystäsi.
- **Manuaalinen suoritus:** Voit kopioida ja liittää nämä komennot terminaaliin, jolla on kirjoitusoikeus Kubernetesiin, jolloin voit käynnistää palvelun manuaalisesti.

#### Kuinka voin suorittaa nämä komennot manuaalisesti?

${k8CredentialsHref === undefined ? "" : "On kaksi tapaa suorittaa nämä komennot:  "}

${
    k8CredentialsHref === undefined
        ? ""
        : `
- **Paikallinen päätelaite:** Mene [\`Oma tili -> Kubernetes-välilehti\`](${k8CredentialsHref}).
  Täällä löydät tunnistetiedot, jotka mahdollistavat komentojen suorittamisen Kubernetes-nimiavaruudessasi paikallisesta päätelaitteestasi.
`
}

- Jos tämä Onyxia-instanssi tarjoaa palveluita kuten VSCode tai Jupyter, voit avata terminaalin näissä palveluissa ja suorittaa komentoja siellä.
  Konstruktiivisia tai destruktiivisia komentoja varten sinun on käynnistettävä palvelusi Kubernetes-roolilla \`admin\` tai \`edit\`.

Suorittamalla komennon manuaalisesti, palvelu näkyy edelleen [\`Omat Palvelut\`](${myServicesHref}) -sivulla ikään kuin se olisi käynnistetty käyttöliittymän kautta.

Voit poistaa komentopalkin käytöstä [\`Oma tili -> Käyttöliittymäasetukset-välilehti\`](${interfacePreferenceHref}).

Tutustu vapaasti ja ota hallintaan Kubernetes-julkaisusi!
        `}</Markdown>
        )
    },
    "AcknowledgeSharingOfConfigConfirmDialog": {
        "acknowledge sharing of config confirm dialog title":
            "Huomio, konfiguraatiot jaetaan",
        "acknowledge sharing of config confirm dialog subtitle": ({
            groupProjectName
        }) => `Jos tallennat
        tämän konfiguraation, jokainen projektin ${groupProjectName} jäsen pystyy käynnistämään sen.`,
        "acknowledge sharing of config confirm dialog body": `Vaikka Onyxia ei ole automaattisesti lisännyt henkilökohtaisia tietoja,
        ole varovainen, ettet jaa arkaluonteisia tietoja palautettavassa konfiguraatiossa.`,
        "cancel": "Peruuta",
        "i understand, proceed": "Ymmärrän, jatka"
    },
    "AutoLaunchDisabledDialog": {
        "auto launch disabled dialog title": "Käynnistäminen ei ole mahdollista",
        "auto launch disabled dialog body": (
            <>
                <b>VAROITUS</b>: Joku saattaa yrittää huijata sinua käynnistämään
                palvelun, joka saattaa vaarantaa namespace-integriteettisi.
                <br />
                Tarkista palvelun asetukset huolellisesti ennen sen käynnistämistä.
                <br />
                Jos olet epävarma, ota yhteyttä ylläpitäjääsi.
            </>
        ),
        "ok": "Ok"
    },
    "FormFieldWrapper": {
        "reset to default": "Palauta oletusarvoon"
    },
    "YamlCodeBlockFormField": {
        "not an array": "Taulukkoa odotetaan",
        "not an object": "Oliota odotetaan",
        "not valid yaml": "Virheellinen YAML/JSON"
    },
    "TextFormField": {
        "not matching pattern": ({ pattern }) => `Ei vastaa mallia ${pattern}`,
        "toggle password visibility": "Vaihda salasanan näkyvyyttä"
    },
    "FormFieldGroupComponent": {
        "add": "Lisää"
    },
    "NumberFormField": {
        "below minimum": ({ minimum }) =>
            `Täytyy olla suurempi tai yhtä suuri kuin ${minimum}`,
        "not a number": "Ei ole numero",
        "not an integer": "Ei ole kokonaisluku"
    },
    "NoLongerBookmarkedDialog": {
        "no longer bookmarked dialog title": "Muutokset eivät tallennu",
        "no longer bookmarked dialog body":
            "Päivitä tallennettu konfiguraatio napsauttamalla kirjanmerkkikuvaketta uudelleen.",
        "ok": "Ok"
    },
    "MyService": {
        "page title": ({ helmReleaseFriendlyName }) =>
            `${helmReleaseFriendlyName} Valvonta`
    },
    "PodLogsTab": {
        "not necessarily first logs":
            "Nämä eivät välttämättä ole ensimmäiset lokit, vanhemmat lokit saattavat olla poistettu",
        "new logs are displayed in realtime": "Uudet lokit näytetään reaaliajassa"
    },
    "MyServiceButtonBar": {
        "back": "Takaisin",
        "external monitoring": "Ulkoinen valvonta",
        "helm values": "Helm-arvot",
        "reduce": "Vähennä"
    },
    "LauncherMainCard": {
        "card title": "Luo omat palvelusi",
        "friendly name": "Käyttäjäystävällinen nimi",
        "launch": "Käynnistä",
        "cancel": "Peruuta",
        "copy auto launch url": "Kopioi automaattisen käynnistyksen URL",
        "copy auto launch url helper": ({
            chartName
        }) => `Kopioi URL, jonka avulla tämän Onyxia-instanssin käyttäjä voi 
            käynnistää ${chartName} tässä konfiguraatiossa omassa Namespace:ssaan`,
        "share the service": "Jaa palvelu",
        "share the service - explain": "Tee palvelu saataville ryhmän jäsenille",
        "restore all default": "Palauta oletuskonfiguraatiot",
        "bookmark button": ({ isBookmarked }) =>
            `${isBookmarked ? "Poista" : "Tallenna"} asetukset`,
        "bookmark button tooltip": ({ myServicesSavedConfigsExtendedLink }) => (
            <>
                Tallennetut asetukset voidaan käynnistää uudelleen nopeasti sivulta&nbsp;
                <MuiLink {...myServicesSavedConfigsExtendedLink} target="_blank">
                    Omat Palvelut
                </MuiLink>
            </>
        ),
        "version select label": "Versio",
        "version select helper text": ({
            helmCharName,
            helmRepositoryName,
            labeledHelmChartSourceUrls
        }) => (
            <>
                Version of the{" "}
                {
                    <MaybeLink href={labeledHelmChartSourceUrls.helmChartSourceUrl}>
                        {helmCharName}
                    </MaybeLink>
                }{" "}
                helm chart joka kuuluu helm-kaaviosäilöön{" "}
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
        "save changes": "Tallenna muutokset",
        "copied to clipboard": "Kopioitu leikepöydälle!",
        "s3 configuration": "S3-konfiguraatio",
        "s3 configuration - explain": ({ projectS3ConfigLink }) => (
            <>
                S3-konfiguraatio, jota käytetään tässä palvelussa.{" "}
                <MuiLink {...projectS3ConfigLink}>S3-konfiguraatio</MuiLink>.
            </>
        )
    },
    "Footer": {
        "contribute": "Osallistu",
        "terms of service": "Käyttöehdot",
        "change language": "Vaihda kieli",
        "dark mode switch": "Tumma tila"
    },
    "MyServices": {
        "text1": "Omat palvelut",
        "text2": "Käytettävissä olevat palvelusi",
        "text3":
            "Palveluiden odotetaan olevan sammutettuina, kun et enää käytä niitä aktiivisesti.",
        "running services": "Käynnissä olevat palvelut"
    },
    "ClusterEventsDialog": {
        "title": "Tapahtumat",
        "subtitle": (
            <>
                Kubernetes-nimiavaruuden tapahtumat, se on reaaliaikainen syöte komennosta{" "}
                <code>kubectl get events</code>
            </>
        )
    },
    "MyServicesConfirmDeleteDialog": {
        "confirm delete title": "Oletko varma?",
        "confirm delete subtitle":
            "Varmista, että palvelusi ovat valmiita poistettaviksi",
        "confirm delete body shared services":
            "Huomioi, että osa palveluistasi on jaettu muiden projektiin kuuluvien jäsenten kanssa.",
        "confirm delete body":
            "Muista tallentaa koodisi GitHubiin tai GitLabiin ennen palveluiden lopettamista",
        "cancel": "Peruuta",
        "confirm": "Kyllä, poista"
    },
    "MyServicesButtonBar": {
        "refresh": "Päivitä",
        "launch": "Uusi palvelu",
        "trash": "Tyhjennä kaikki",
        "trash my own": "Poista kaikki omat palvelut"
    },
    "MyServicesCard": {
        "service": "Palvelu",
        "running since": "Käynnistetty: ",
        "open": "avata",
        "readme": "lueminut",
        "reminder to delete services": "Muista poistaa palvelusi.",
        "status": "Tila",
        "container starting": "Säiliö käynnistyy",
        "failed": "Epäonnistui",
        "suspend service tooltip": "Keskeytä palvelu ja vapauta resurssit",
        "resume service tooltip": "Jatka palvelua",
        "suspended": "Keskeytetty",
        "suspending": "Keskeyttää",
        "share tooltip - belong to someone else": ({
            projectName,
            ownerUsername,
            focusColor
        }) => (
            <>
                Tämä palvelu on jaettu{" "}
                <span style={{ color: focusColor }}>{projectName}</span>
                projektin jäsenten kesken käyttäjän{" "}
                <span style={{ color: focusColor }}>{ownerUsername}</span> toimesta.
            </>
        ),
        "share tooltip - belong to you, shared": ({ projectName, focusColor }) => (
            <>
                Tämä palvelu on jaettu{" "}
                <span style={{ color: focusColor }}>{projectName}</span> projektin
                jäsenten kesken. Napsauta lopettaaksesi jakamisen.
            </>
        ),
        "share tooltip - belong to you, not shared": ({ projectName, focusColor }) => (
            <>
                Vain sinä voit käyttää tätä palvelua. Napsauta jakaaksesi sen{" "}
                <span style={{ color: focusColor }}>{projectName}</span> projektin
                jäsenten kanssa.
            </>
        )
    },
    "MyServicesRestorableConfigOptions": {
        "edit": "Muokkaa",
        "copy link": "Kopioi URL-osoite",
        "remove bookmark": "Poista"
    },
    "MyServicesRestorableConfig": {
        "edit": "Muokkaa",
        "launch": "Käynnistä"
    },
    "MyServicesRestorableConfigs": {
        "saved": "Tallennettu",
        "expand": "Laajenna"
    },
    "ReadmeDialog": {
        "ok": "ok",
        "return": "Palaa"
    },
    "CopyOpenButton": {
        "first copy the password": "Klikkaa kopioidaksesi salasanan...",
        "open the service": "Avaa palvelu 🚀"
    },
    "MyServicesCards": {
        "running services": "Käynnissä olevat palvelut"
    },
    "NoRunningService": {
        "launch one": "Käynnistä palvelu",
        "no services running": "Sinulla ei ole käynnissä olevia palveluita"
    },
    "CircularUsage": {
        "max": "Maksimi",
        "used": "Käytetty",
        "quota card title": ({ what, isLimit }) => {
            const whatTranslated = (() => {
                switch (what) {
                    case "memory":
                        return "RAM";
                    case "cpu":
                        return "CPU";
                    case "storage":
                        return "Tallennustila";
                    case "count/pod":
                        return "Kubernetes-podit";
                    case "nvidia.com/gpu":
                        return "Nvidia-GPU:t";
                    default:
                        return capitalize(what);
                }
            })();

            return `${whatTranslated} - ${isLimit ? "Raja" : "Pyydetty"}`;
        }
    },
    "Quotas": {
        "show more": "Näytä lisää",
        "resource usage quotas": "Resurssien käyttökiintiöt",
        "current resource usage is reasonable":
            "Nykyinen resurssien käyttösi on kohtuullista."
    },
    "DataExplorer": {
        "page header title": "Data Explorer",
        "page header help title":
            "Esikatsele Parquet- ja CSV-tiedostoja suoraan selaimessasi!",
        "page header help content": ({ demoParquetFileLink }) => (
            <>
                Syötä vain <code>https://</code> tai <code>s3://</code> URL tiedostoon
                päästäksesi esikatseluun.
                <br />
                Tiedostoa ei ladata kokonaan; sen sisältö virtaa, kun navigoit sivujen
                läpi.
                <br />
                Voit jakaa pysyvän linkin tiedostoon tai jopa tiettyyn tiedoston riviin
                kopioimalla URL:n osoitepalkista.
                <br />
                Etkö ole varma, mistä aloittaa? Kokeile tätä{" "}
                <MuiLink {...demoParquetFileLink}>demotiedostoa</MuiLink>!
            </>
        ),
        "column": "sarake",
        "density": "tiheys",
        "download file": "lataa tiedosto",
        "resize table": "Muuta taulukon kokoa"
    },
    "UrlInput": {
        "load": "Lataa"
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
                    return "juuri nyt";
                case "second":
                    return "sekunti sitten";
                case "minute":
                    return "minuutti sitten";
                case "hour":
                    return "tunti sitten";
                case "day":
                    return "eilen";
                case "week":
                    return "viime viikolla";
                case "month":
                    return "viime kuussa";
                case "year":
                    return "viime vuonna";
            }
        },
        "pastN": ({ divisorKey }) => {
            switch (divisorKey) {
                case "now":
                    return "juuri nyt";
                case "second":
                    return "# sekuntia sitten";
                case "minute":
                    return "# minuuttia sitten";
                case "hour":
                    return "# tuntia sitten";
                case "day":
                    return "# päivää sitten";
                case "week":
                    return "# viikkoa sitten";
                case "month":
                    return "# kuukautta sitten";
                case "year":
                    return "# vuotta sitten";
            }
        },
        "future1": ({ divisorKey }) => {
            switch (divisorKey) {
                case "now":
                    return "juuri nyt";
                case "second":
                    return "sekunnin kuluttua";
                case "minute":
                    return "minuutin kuluttua";
                case "hour":
                    return "tunnin kuluttua";
                case "day":
                    return "huomenna";
                case "week":
                    return "ensi viikolla";
                case "month":
                    return "ensi kuussa";
                case "year":
                    return "ensi vuonna";
            }
        },
        "futureN": ({ divisorKey }) => {
            switch (divisorKey) {
                case "now":
                    return "juuri nyt";
                case "second":
                    return "# sekunnin kuluttua";
                case "minute":
                    return "# minuutin kuluttua";
                case "hour":
                    return "# tunnin kuluttua";
                case "day":
                    return "# päivän kuluttua";
                case "week":
                    return "# viikon kuluttua";
                case "month":
                    return "# kuukauden kuluttua";
                case "year":
                    return "# vuoden kuluttua";
            }
        }
    },
    "CopyToClipboardIconButton": {
        "copied to clipboard": "Kopioitu!",
        "copy to clipboard": "Kopioi leikepöydälle"
    },
    "CustomDataGridToolbarDensitySelector": {
        "toolbarDensity": "Tiheys",
        "toolbarDensityStandard": "Normaali",
        "toolbarDensityComfortable": "Mukava",
        "toolbarDensityCompact": "Tiivis"
    },
    "CustomDataGridToolbarColumnsButton": {
        "toolbarColumnsLabel": "Sarakkeet"
    }
    /* spell-checker: enable */
};
