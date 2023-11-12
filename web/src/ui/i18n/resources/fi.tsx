import MuiLink from "@mui/material/Link";
import type { Translations } from "../types";
import { Markdown } from "ui/shared/Markdown";
import { elementsToSentence } from "ui/tools/elementsToSentence";

export const translations: Translations<"fi"> = {
    "Account": {
        "infos": "Tilin tiedot",
        "third-party-integration": "Kolmannen osapuolen integraatio",
        "storage": "Yhdistä tallennustilaan",
        "k8sCredentials": "Kubernetes",
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
        "change account info": "Muuta tilin tietoja (esim. salasanaa).",
        "auth information": "Onyxia-autentikointitiedot",
        "auth information helper": `Nämä tiedot mahdollistavat sinun tunnistautumisen
            alustalla ja eri palveluissa.`,
        "ip address": "IP-osoite"
    },
    "AccountIntegrationsTab": {
        "git section title": "Git-konfiguraatio",
        "git section helper": `Varmistaaksesi, että näyt olevan Git-kontribuutioidesi tekijä`,
        "gitName": "Git-käyttäjänimi",
        "gitEmail": "Git-sähköposti",
        "third party tokens section title": "Yhdistä Gitlab-, Github- ja Kaggle-tilisi",
        "third party tokens section helper": `
                Yhdistä palvelusi ulkoisiin tileihin käyttämällä henkilökohtaisia pääsykoodeja ja ympäristömuuttujia
            `,
        "personal token": ({ serviceName }) =>
            `${serviceName}-henkilökohtainen pääsykoodi`,
        "link for token creation": ({ serviceName }) =>
            `Luo ${serviceName}-pääsykoodejasi.`,
        "accessible as env": "Käytettävissä palveluissasi ympäristömuuttujana"
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
    "AccountField": {
        "copy tooltip": "Kopioi leikepöydälle",
        "language": "Vaihda kieltä",
        "service password": "Salasana palveluillesi",
        "service password helper text": `Tämä salasana vaaditaan kirjautumiseen kaikkiin palveluihisi.
            Se generoidaan automaattisesti ja uusiutuu säännöllisesti.`,
        "not yet defined": "Ei vielä määritelty",
        "reset helper dialogs": "Nollaa ohjeikkunat",
        "reset": "Nollaa",
        "reset helper dialogs helper text":
            "Nollaa ohjeviestit, joista on pyydetty, ettei niitä näytetä uudelleen"
    },
    "MyFiles": {
        "page title - my files": "Omat tiedostot",
        "page title - my secrets": "Omat salaisuudet",
        "what this page is used for - my files":
            "Täällä voit selata S3 Bucket -tiedostojasi.",
        "what this page is used for - my secrets":
            "Täällä voit määrittää muuttujia, jotka ovat käytettävissä palveluissasi ympäristömuuttujina.",
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
    "MySecrets": {
        "page title - my files": "Omat tiedostot",
        "page title - my secrets": "Omat salaisuudet",
        "what this page is used for - my files":
            "Täällä voit selata S3 Bucket -tiedostojasi.",
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
        "file": "tiedosto",
        "secret": "salaisuus",
        "rename": "nimeä uudelleen",
        "delete": "poista",
        "create secret": "Luo salaisuus",
        "upload file": "Lataa tiedosto",
        "copy path": "Käytä palvelussa",
        "create directory": "Luo hakemisto",
        "refresh": "päivitä",
        "create what": ({ what }) => `Luo ${what}`,
        "new": "Uusi"
    },
    "ExplorerButtonBar": {
        "file": "tiedosto",
        "secret": "salaisuus",
        "delete": "poista",
        "create secret": "Luo salaisuus",
        "upload file": "Lataa tiedosto",
        "copy path": "Kopioi S3-objektin nimi",
        "create directory": "Luo hakemisto",
        "refresh": "päivitä",
        "create what": ({ what }) => `Luo ${what}`,
        "new": "Uusi"
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
        "resolved value column name": "Ratkaisun arvo",
        "what's a resolved value": `
            Ympäristömuuttuja voi viitata toiseen muuttujaan. Jos olet määritellyt 
            FIRST_NAME=John, voit asettaa FULL_NAME="$FIRST_NAME"-Doe. Tällöin 
            FILL_NAME:n ratkaistu arvo on "John-Doe"
            `,
        "unavailable key": "On jo käytössä",
        "invalid key empty string": "Nimi vaaditaan",
        "invalid key _ not valid": "Ei voi olla pelkästään _",
        "invalid key start with digit": "Ei voi alkaa numerolla",
        "invalid key invalid character": "Virheellinen merkki",
        "invalid value cannot eval": "Virheellinen komentorivin lauseke",
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
        "catalog": "Palvelukatalogi",
        "myServices": "Omat palvelut",
        "mySecrets": "Omat salaisuudet",
        "myFiles": "Omat tiedostot",
        "divider: services features": "Palvelun ominaisuudet",
        "divider: external services features": "Ulkoisten palveluiden ominaisuudet",
        "divider: onyxia instance specific features":
            "Onyxia-instanssin erityisominaisuudet"
    },
    "Page404": {
        "not found": "Sivua ei löydy"
    },
    "PortraitModeUnsupported": {
        "instructions":
            "Voit käyttää tätä sovellusta puhelimellasi ottamalla käyttöön kääntöanturin ja kääntämällä puhelimesi."
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
        "header text1": "Palvelukatalogi",
        "header text2":
            "Selaa, käynnistä ja määritä palveluita muutamalla napsautuksella.",
        "header help": ({ catalogName, catalogDescription, repositoryUrl }) => (
            <>
                Olet tutkimassa Helm Chart Repositorya{" "}
                <MuiLink href={repositoryUrl} target="_blank">
                    {catalogName}: {catalogDescription}
                </MuiLink>
            </>
        ),
        "here": "täältä",
        "show more": "Näytä enemmän",
        "no service found": "Palvelua ei löytynyt",
        "no result found": ({ forWhat }) => `Tuloksia ei löytynyt haulle ${forWhat}`,
        "check spelling": "Tarkista kirjoitus tai laajenna hakua.",
        "go back": "Palaa pääpalveluihin",
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
        "header text2":
            "Selaa, käynnistä ja määritä palveluita muutamalla napsautuksella.",
        "chart sources": ({ chartName, urls }) =>
            urls.length === 0 ? (
                <></>
            ) : (
                <>
                    Pääsy kaavion {chartName} lähteese{urls.length === 1 ? "en" : "isiin"}
                    :&nbsp;
                    {elementsToSentence({
                        "elements": urls.map(source => (
                            <MuiLink href={source} target="_blank" underline="hover">
                                täällä
                            </MuiLink>
                        )),
                        "language": "fi"
                    })}
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
    "NoLongerBookmarkedDialog": {
        "no longer bookmarked dialog title": "Muutokset eivät tallennu",
        "no longer bookmarked dialog body":
            "Päivitä tallennettu konfiguraatio napsauttamalla kirjanmerkkikuvaketta uudelleen.",
        "ok": "Ok"
    },
    "SensitiveConfigurationDialog": {
        "sensitive configuration dialog title":
            "Palvelun käynnistäminen voi olla vaarallista",
        "cancel": "Peruuta",
        "proceed to launch": "Jatka käynnistämistä"
    },
    "LauncherMainCard": {
        "card title": "Luo omat palvelusi",
        "friendly name": "Käyttäjäystävällinen nimi",
        "launch": "Käynnistä",
        "cancel": "Peruuta",
        "copy url helper text": "Kopioi URL-osoite palauttaaksesi tämän konfiguraation",
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
            chartName,
            catalogRepositoryUrl,
            catalogName
        }) => (
            <>
                {chartName} kaavion versio&nbsp;
                <MuiLink href={catalogRepositoryUrl}>
                    {catalogName} Helm Repository
                </MuiLink>
            </>
        ),
        "save changes": "Tallenna muutokset"
    },
    "LauncherConfigurationCard": {
        "global config": "Yleinen konfiguraatio",
        "configuration": ({ packageName }) => `${packageName} -konfiguraatiot`,
        "dependency": ({ dependencyName }) => `${dependencyName} -riippuvuus`,
        "launch of a service": ({ dependencyName }) =>
            `Käynnistetään ${dependencyName} -palvelu`,
        "mismatching pattern": ({ pattern }) => `Täsmätä ${pattern}`,
        "Invalid YAML Object": "Virheellinen YAML-objekti",
        "Invalid YAML Array": "Virheellinen YAML-taulukko"
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
        "running since": "Käynnissä alkaen: ",
        "open": "avata",
        "readme": "lueminut",
        "shared by you": "Jaettu sinun kanssasi",
        "which token expire when": ({ which, howMuchTime }) =>
            `The ${which} token expires ${howMuchTime}.`,
        "which token expired": ({ which }) => `The ${which} token is expired.`,
        "reminder to delete services": "Muista poistaa palvelusi.",
        "this is a shared service": "Tämä palvelu on jaettu projektin jäsenten kesken"
    },
    "MyServicesRunningTime": {
        "launching": "Käynnistetään..."
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
        "show all": "Näytä kaikki"
    },
    "ReadmeAndEnvDialog": {
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
    }
};
