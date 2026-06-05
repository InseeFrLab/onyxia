import MuiLink from "@mui/material/Link";
import type { Translations } from "../types";
import { Markdown } from "ui/shared/Markdown";
import { Icon } from "onyxia-ui/Icon";
import { getIconUrlByName } from "lazy-icons";
import { capitalize } from "tsafe/capitalize";
import { MaybeLink } from "ui/shared/MaybeLink";

export const translations: Translations<"fi"> = {
    /* spell-checker: disable */
    Account: {
        profile: "Profiili",
        git: "Git",
        k8sCodeSnippets: "Kubernetes",
        "user-interface": "Käyttöliittymän asetukset",
        text1: "Oma tili",
        text2: "Pääset käsiksi erilaisiin tilin tietoihin.",
        text3: "Määritä käyttäjänimesi, sähköpostiosoitteesi, salasanat ja henkilökohtaiset pääsytunnukset, jotka ovat suoraan yhteydessä palveluihisi.",
        "personal tokens tooltip":
            "Sinulle generoidut salasanat, joilla on määritelty voimassaoloaika",
        vault: "Vault"
    },
    AccountProfileTab: {
        "account id": "Tilin tunniste",
        "account id helper":
            "Aineettomat tunnisteesi, jotka liittyvät siihen henkilöllisyyteen, jolla kirjaudut alustalle",
        "user id": "Käyttäjätunnus",
        email: "Sähköposti",
        "account management": "Tilinhallinta"
    },
    UserProfileForm: {
        "customizable profile": "Mukautettava profiili",
        "customizable profile helper":
            "Hyödyllistä tietoa palvelujen automaattista konfigurointia varten",
        save: "Tallenna",
        restore: "Palauta"
    },
    ConfirmNavigationDialog: {
        "you have unsaved changes": "Sinulla on tallentamattomia muutoksia!",
        cancel: "Peruuta",
        "continue without saving": "Jatka tallentamatta"
    },
    AccountGitTab: {
        gitName: "Käyttäjänimi Gitille",
        "gitName helper text": ({ gitName, focusClassName }) => (
            <>
                Tämä komento asettaa globaalin Git-käyttäjänimesi ja suoritetaan palvelun
                käynnistyessä:&nbsp;
                <code className={focusClassName}>
                    git config --global user.name "{gitName || "<käyttäjänimesi>"}"
                </code>
            </>
        ),
        gitEmail: "Sähköposti Gitille",
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
        githubPersonalAccessToken: "Henkilökohtainen pääsyavain Git-alustalle",
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
    AccountKubernetesTab: {
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
    AccountVaultTab: {
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
    AccountUserInterfaceTab: {
        title: "Käyttöliittymän asetukset",
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
    SettingField: {
        "copy tooltip": "Kopioi leikepöydälle",
        language: "Vaihda kieltä",
        "service password": "Oletuspalvelusalasana",
        "service password helper text": ({ groupProjectName }) => (
            <>
                Tämä on oletussalasana, jota käytetään suojaamaan käynnissä olevat
                palvelusi. <br />
                Kun käynnistät palvelun, turvallisuusvälilehden salasanakenttä täytetään
                automaattisesti tällä salasanalla. <br />
                Napsauttamalla{" "}
                <Icon size="extra small" icon={getIconUrlByName("Refresh")} /> -kuvaketta
                luodaan uusi satunnainen salasana. Huomaa kuitenkin, että se ei päivitä
                salasanaa palveluille, jotka ovat parhaillaan käynnissä. <br />
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
        reset: "Nollaa",
        "reset helper dialogs helper text":
            "Nollaa ohjeviestit, joista on pyydetty, ettei niitä näytetä uudelleen"
    },
    ConfirmBucketCreationAttemptDialog: {
        "bucket does not exist title": ({ bucket }) => `Bucket ${bucket} ei ole olemassa`,
        "bucket does not exist body": "Haluatko yrittää luoda sen nyt?",
        no: "Ei",
        yes: "Kyllä",
        "success title": "Onnistui",
        "failed title": "Epäonnistui",
        "success body": ({ bucket }) => `Bucket ${bucket} luotiin onnistuneesti.`,
        "failed body": ({ bucket }) => `Kohteen ${bucket} luonti epäonnistui.`,
        ok: "Ok"
    },
    ConfirmOverwriteDialog: {
        "dialog title": "Tiedosto on jo olemassa",
        "dialog body": "Haluatko korvata olemassa olevan tiedoston?",
        "no, keep the existing file": "Ei, säilytä olemassa oleva tiedosto",
        "yes, overwrite": "Kyllä, korvaa"
    },
    ConfirmCustomS3ConfigDeletionDialog: {
        "dialog title": "Vahvistetaanko mukautetun S3-määrityksen poistaminen?",
        cancel: "Peruuta",
        yes: "Kyllä"
    },
    DisplayErrorDialog: {
        error: "Virhe",
        ok: "Ok"
    },
    S3Explorer: {
        "page header title": "Tietojen tallennus",
        "create profile": "Luo profiili",
        back: "Takaisin",
        upload: "Lataa palvelimelle",
        "create new folder": "Luo uusi kansio",
        "download file": "lataa tiedosto"
    },
    S3ShareObjectDialogContainer: {
        "dialog title": "Jaa objekti"
    },
    S3BookmarksBar: {
        "s3 bookmarks aria label": "S3-kirjanmerkit",
        "show more bookmarks": "Näytä lisää kirjanmerkkejä"
    },
    S3BookmarkItem: {
        "open bookmark": "Avaa kirjanmerkki",
        "open bucket": "Avaa bucket",
        "bookmark actions": "Kirjanmerkin toiminnot",
        rename: "Nimeä uudelleen",
        delete: "Poista",
        "rename bookmark": "Nimeä kirjanmerkki uudelleen",
        "delete bookmark": "Poista kirjanmerkki"
    },
    S3BookmarksEntryPointList: {
        "s3 bookmark entry points aria label": "S3-kirjanmerkkien aloituspisteet",
        bookmarks: "Kirjanmerkit",
        "no bookmarks yet": "Ei vielä kirjanmerkkejä.",
        "storage locations": "Tallennussijainnit"
    },
    S3DialogCopyField: {
        "generating url": "URL-osoitetta luodaan...",
        copy: "Kopioi",
        copied: "Kopioitu"
    },
    S3DialogItemSummary: {
        public: "Julkinen"
    },
    S3ProfileSelect: {
        "select s3 profile aria label": "Valitse S3-profiili",
        "profile settings aria label": "Profiilin asetukset",
        "s3 profiles aria label": "S3-profiilit",
        "new s3 profile": "Uusi S3-profiili"
    },
    S3SelectionActionBar: {
        download: "Lataa",
        delete: "Poista",
        "copy s3 uri": "Kopioi S3-URI",
        copied: "Kopioitu",
        "copy s3 uri tooltip": ({ s3UriStr }) => `Kopioi "${s3UriStr}"`,
        "add to bookmarks": "Lisää kirjanmerkkeihin",
        "delete from bookmarks": "Poista kirjanmerkeistä",
        share: "Jaa",
        "make public": "Tee julkiseksi",
        "make private": "Tee yksityiseksi",
        "one selected": "1 valittu",
        "many selected": ({ count }) => `${count} valittu`,
        "clear selection": "Tyhjennä valinta"
    },
    ConfirmAbortUploadDialog: {
        "dialog title": "Peruutetaanko lataus?",
        "dialog body": "Lataus ei ole valmis. Haluatko peruuttaa latauksen?",
        "continue upload": "Jatka latausta",
        "cancel upload": "Peruuta lataus"
    },
    S3Uploads: {
        "uploading count": ({ count }) => `Ladataan ${count} kohdetta...`,
        "upload count": ({ count }) => `${count} lataus${count === 1 ? "" : "ta"}`,
        "expand uploads": "Laajenna lataukset",
        "collapse uploads": "Supista lataukset",
        "close uploads": "Sulje lataukset",
        "uploading status": "Ladataan...",
        completed: "Valmis",
        error: "Virhe",
        "uploaded size of total size": ({ uploadedSize, totalSize }) =>
            `${uploadedSize} / ${totalSize}`,
        of: "/",
        "open uploaded directory": "Avaa ladattu hakemisto",
        "cancel upload": "Peruuta lataus",
        "retry upload": "Yritä latausta uudelleen"
    },
    CustomNoRowsOverlay: {
        "no rows": "Ei rivejä"
    },
    DataTextEditor: {
        "not a valid format": ({ format }) => `Ei kelvollinen muoto: ${format}`,
        format: "Muoto",
        "all defaults": "Kaikki oletukset",
        schema: "Skeema"
    },
    JsonSchemaDialog: {
        "json schema": "JSON-skeema",
        ok: "Ok"
    },
    SelectFormField: {
        "empty string": "(Tyhjä merkkijono)"
    },
    CreateOrRenameBookmarkDialog: {
        "dialog title": "Kirjanmerkin nimi",
        "add dialog title": "Lisää tämä sijainti kirjanmerkkeihin",
        "rename dialog title": "Nimeä kirjanmerkki uudelleen",
        "dialog subtitle":
            "Tallenna tämä S3-sijainti, jotta löydät sen myöhemmin nopeammin.",
        "bookmarkName textField label": "Nimi",
        "bookmarkName textField empty error": "Kirjanmerkin nimi ei voi olla tyhjä",
        "copy s3 path aria label": "Kopioi S3-polku",
        cancel: "Peruuta",
        ok: "Ok",
        "add to bookmarks": "Lisää kirjanmerkkeihin",
        "rename bookmark": "Nimeä kirjanmerkki uudelleen"
    },
    DirectoryCreationDialog: {
        "dialog title": "Luo kansio",
        "dialog subtitle": "Luo kansiota vastaava etuliite tähän sijaintiin",
        "dialog body":
            "S3 ei tallenna kansioita varsinaisina objekteina. Tämä toiminto avaa vain uuden etuliitesegmentin nykyisestä sijainnista, jotta voit ladata objekteja sen alle. Kansio tulee näkyviin, kun vähintään yksi objekti käyttää tätä etuliitettä; tyhjiä kansioita ei ole S3:ssa.",
        "folderName textField label": "Kansion nimi",
        "folderName textField empty error": "Kansion nimi ei voi olla tyhjä",
        "folderName textField duplicate error": "Kansion nimi on jo olemassa",
        cancel: "Peruuta",
        "create folder": "Luo kansio"
    },
    MakePrefixPublicDialog: {
        "dialog title": "Tee etuliitteestä julkinen",
        "make public dialog title": "Tehdäänkö tästä etuliitteestä julkinen?",
        "make private dialog title": "Tehdäänkö tästä etuliitteestä yksityinen?",
        "make public dialog body main":
            "Kaikki tämän etuliitteen tiedostot ovat kaikkien linkin saaneiden käytettävissä, mukaan lukien nykyinen ja tuleva sisältö.",
        "make public dialog body alternative":
            "Jos haluat jakaa vain tietyt tiedostot tai rajata pääsyn ajallisesti, luo sen sijaan jakolinkki.",
        "make private dialog body main":
            "Kaikki tämän etuliitteen tiedostot ovat kaikkien linkin saaneiden käytettävissä, mukaan lukien nykyinen ja tuleva sisältö. Etuliitteen tekeminen yksityiseksi poistaa julkisen pääsyn.",
        "make private dialog body alternative":
            "Jos haluat jakaa vain tietyt tiedostot tai rajata pääsyn ajallisesti, luo sen sijaan jakolinkki.",
        "dialog body": ({ s3Uri, s3UriClassName }) => (
            <>
                Olet tekemässä etuliitteestä{" "}
                <span className={s3UriClassName}>{s3Uri}</span> julkisen. Kuka tahansa voi
                listata ja ladata kaikki tämän etuliitteen nykyiset ja tulevat objektit.
                <br />
                <br />
                Tämän etuliitteen objekteille jakamasi latauslinkit eivät koskaan vanhene.
            </>
        ),
        cancel: "Peruuta",
        "make public": "Tee julkiseksi",
        "make private": "Tee yksityiseksi"
    },
    S3ExplorerMainView: {
        "create prefix dialog title": "Luo etuliite",
        "create prefix dialog subtitle": "Luo uusi etuliite nykyiseen S3-sijaintiin.",
        "prefix name field label": "Etuliitteen nimi",
        "prefix name empty error": "Etuliitteen nimi ei voi olla tyhjä.",
        cancel: "Peruuta",
        "create prefix": "Luo etuliite",
        "delete selection dialog title": "Poista valinta",
        "delete selection dialog subtitle":
            "Tämä toiminto poistaa valitut kohteet pysyvästi.",
        "delete selection dialog body": ({ count }) =>
            `Olet poistamassa ${count} valittua kohdetta. Etuliitteen poistaminen poistaa myös kaiken sen sisältä.`,
        delete: "Poista",
        share: "Jaa",
        download: "Lataa",
        "copy s3 uri": "Kopioi S3-URI",
        copied: "Kopioitu",
        "copy s3 uri tooltip": ({ s3UriStr }) => `Kopioi "${s3UriStr}"`,
        "add to bookmarks": "Lisää kirjanmerkkeihin",
        "delete from bookmarks": "Poista kirjanmerkeistä",
        "make public": "Tee julkiseksi",
        "make private": "Tee yksityiseksi",
        folder: "Kansio",
        object: "Objekti",
        "folder is public": "Kansio on julkinen",
        "folder is private": "Kansio on yksityinen",
        today: "Tänään",
        yesterday: "Eilen",
        "access denied": "Pääsy evätty",
        "bucket not found": "Bucketia ei löydy",
        "access denied description": "Sinulla ei ole oikeutta listata tätä S3-sijaintia.",
        "bucket not found description":
            "Pyydettyä bucketia ei ole olemassa tai sitä ei voi käyttää nykyisellä profiililla.",
        "select item": ({ itemName }) => `Valitse ${itemName}`,
        "select all items": "Valitse kaikki kohteet",
        public: "Julkinen",
        deleting: "Poistetaan...",
        uploading: "Ladataan",
        "drag and drop to import files": "Vedä ja pudota tiedostoja tuodaksesi ne",
        "go back": "Takaisin",
        "no objects found": "Objekteja ei löytynyt",
        "no objects found description": ({ s3UriStr }) =>
            `Ei objekteja, joiden avain alkaa merkkijonolla "${s3UriStr}".`,
        "this prefix is empty": "Tämä etuliite on tyhjä",
        "empty prefix description":
            "Lataa tiedostoja tai luo kansio aloittaaksesi tämän sijainnin täyttämisen.",
        "empty prefix upload description":
            "Lataa tiedostoja tähän tai vedä ja pudota ne tälle alueelle.",
        "upload files": "Lataa tiedostoja",
        "upload files here": "Lataa tiedostoja tähän",
        "drop files here hint":
            "Pudota tiedostoja mihin tahansa tälle alueelle ladataksesi ne.",
        "new folder": "Uusi kansio",
        name: "Nimi",
        "last modified": "Viimeksi muokattu",
        size: "Koko"
    },
    S3ShareObjectDialog: {
        "generating public URL": "Luodaan julkista URL-osoitetta...",
        "copy public URL aria label": "Kopioi julkinen URL",
        "signed URL with limited validity period":
            "Allekirjoitettu URL rajatulla voimassaoloajalla",
        "signed link validity aria label": "Allekirjoitetun linkin voimassaoloaika",
        "generating signed URL": "Luodaan allekirjoitettua URL-osoitetta...",
        "copy signed URL aria label": "Kopioi allekirjoitettu URL",
        "public sharing note":
            "Kuka tahansa URL-osoitteen saanut voi käyttää tätä objektia. Linkki ei vanhene, koska objekti on julkisessa etuliitteessä.",
        "signed URL expiration note":
            "Jos haluat jakaa vanhentumattoman URL-osoitteen, tee jokin tämän objektin yläetuliitteistä julkiseksi.",
        "validity duration one hour": "1 tunti",
        "validity duration one day": "1 päivä",
        "validity duration one week": "1 viikko",
        "selected duration": "valittu kesto"
    },
    S3ProfileDialog: {
        "detail title": "S3-profiilin tiedot",
        "create title": "Uusi mukautettu S3-profiili",
        "edit title": "Muokkaa mukautettua S3-profiilia",
        "close aria label": "Sulje S3-profiili-ikkuna"
    },
    S3ProfileDetails: {
        "read only": "Vain luku",
        custom: "Mukautettu",
        edit: "Muokkaa",
        delete: "Poista",
        "connection details title": "Yhteystiedot",
        "connection details subtitle":
            "Käytä näitä arvoja, kun määrität S3-asiakkaita selaimen ulkopuolella.",
        "endpoint url label": "Päätepisteen URL",
        "default region label": "Oletusalue",
        "access credentials title": "Käyttöoikeustiedot",
        "access credentials anonymous subtitle":
            "Tämä profiili ei paljasta käyttöoikeustietoja. Käytä anonyymiä S3-käyttöä, kun kohdebucket sallii sen.",
        "access credentials subtitle":
            "Kopioi arvo, jota määrittämäsi asiakas tarvitsee.",
        "access key id label": "Käyttöavaimen tunnus",
        "secret access key label": "Salainen käyttöavain",
        "session token label": "Istuntotunnus",
        "environment variable": "Ympäristömuuttuja",
        "no expiration": "Näille tunnuksille ei ole ilmoitettu vanhenemisaikaa.",
        expires: ({ expirationTime }) => `Vanhenee ${expirationTime}.`,
        renewing: "Uudistetaan...",
        "renew tokens": "Uudista tunnukset",
        "init script title": "Käytä tallennustilaasi Datalab-palveluiden ulkopuolella",
        "init script subtitle":
            "Lataa tai kopioi alustusskripti valitsemallasi ohjelmointikielellä.",
        "technology aria label": "Teknologia",
        download: "Lataa",
        "select s3 profile aria label": "Valitse S3-profiili",
        "s3 profiles aria label": "S3-profiilit",
        "new s3 profile": "Uusi S3-profiili",
        "copy aria label": ({ what }) => `Kopioi ${what}`,
        copied: "Kopioitu",
        copy: "Kopioi"
    },
    S3ProfileForm: {
        "must be an url": "Anna kelvollinen URL.",
        "is required": "Tämä kenttä on pakollinen.",
        "not a valid access key id": "Anna kelvollinen käyttöavaimen tunnus.",
        "profile name already used": "Tämä profiilin nimi on jo käytössä.",
        "connection details title": "Yhteystiedot",
        "connection details subtitle":
            "Määritä profiilin nimi ja S3-päätepiste, joita selain käyttää.",
        "profile name label": "Profiilin nimi",
        "s3 service url label": "S3-palvelun URL",
        "s3 service url helper": "Esimerkki: https://minio.lab.example.net",
        "default region label": "Oletusalue",
        "default region helper": "Esimerkki: eu-west-1, jätä tyhjäksi jos et ole varma",
        "url style title": "URL-tyyli",
        "url style subtitle":
            "Määritä, miten S3-palvelin muodostaa tiedostojen lataus-URL-osoitteet.",
        "path style": "Polkutyyli",
        "virtual hosted style": "Virtual-hosted-tyyli",
        example: "Esimerkki",
        "account credentials title": "Tilin käyttöoikeustiedot",
        "account credentials subtitle":
            "Valitse, käyttääkö profiili anonyymiä käyttöä vai erillisiä tunnuksia.",
        "anonymous access": "Anonyymi käyttö",
        "access key id label": "Käyttöavaimen tunnus",
        "access key id helper": "Esimerkki: ASIAIOSFODNN7EXAMPLE",
        "secret access key label": "Salainen käyttöavain",
        "secret access key helper": "Esimerkki: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
        "session token label": "Istuntotunnus",
        "session token helper":
            "Valinnainen. Jätä tyhjäksi, jos tunnuksesi eivät sisällä istuntotunnusta.",
        cancel: "Peruuta",
        "save configuration": "Tallenna määritys",
        "create profile": "Luo profiili"
    },
    MySecrets: {
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
                <MuiLink {...accountTabLink}>
                    Määritä paikallinen Vault CLI
                </MuiLink>.
            </>
        )
    },
    SecretsExplorerItem: {
        description: "kuvaus"
    },
    SecretsExplorerButtonBar: {
        secret: "salaisuus",
        rename: "nimeä uudelleen",
        delete: "poista",
        "create secret": "Luo salaisuus",
        "copy path": "Käytä palvelussa",
        "create new empty directory": "Luo hakemisto",
        refresh: "päivitä",
        "create what": ({ what }) => `Luo ${what}`,
        new: "Uusi"
    },
    SecretsExplorerItems: {
        "empty directory": "Tämä hakemisto on tyhjä"
    },
    SecretsExplorer: {
        file: "tiedosto",
        secret: "salaisuus",
        create: "luo",
        cancel: "peruuta",
        delete: "poista",
        "do not display again": "Älä näytä uudelleen",

        "untitled what": ({ what }) => `nimetön_${what}`,
        directory: "hakemisto",
        "deletion dialog title": ({ deleteWhat }) => `Poista ${deleteWhat}?`,
        "deletion dialog body": ({ deleteWhat }) => `Olet poistamassa ${deleteWhat}.
            Tätä toimintoa ei voi peruuttaa.`,
        "already a directory with this name": "Tämän niminen hakemisto on jo olemassa",
        "can't be empty": "Ei voi olla tyhjä",
        "new directory": "Uusi hakemisto"
    },
    MySecretsEditor: {
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
    MySecretsEditorRow: {
        "key input desc": "Ympäristömuuttujan nimi",
        "value input desc": "Ympäristömuuttujan arvo"
    },
    Header: {
        login: "Kirjaudu sisään",
        logout: "Kirjaudu ulos",
        region: "Alue"
    },
    ProjectSelect: {
        project: "Projekti"
    },
    LeftBar: {
        reduce: "Pienennä",
        home: "Koti",
        account: "Oma tili",
        catalog: "Palvelukatalogi",
        myServices: "Omat palvelut",
        mySecrets: "Omat salaisuudet",
        "divider: services features": "Palvelun ominaisuudet",
        "divider: external services features": "Ulkoisten palveluiden ominaisuudet",
        "divider: onyxia instance specific features":
            "Onyxia-instanssin erityisominaisuudet",
        dataExplorer: "Data Explorer",
        dataCollection: "Kokoelmien selains",
        s3Explorer: "Tietojen tallennus",
        sqlOlapShell: "SQL OLAP-kuori"
    },
    AutoLogoutCountdown: {
        "are you still there": "Oletko vielä siellä?",
        "you'll soon be automatically logged out":
            "Sinut kirjataan pian automaattisesti ulos."
    },
    Page404: {
        "not found": "Sivua ei löydy"
    },
    PortraitModeUnsupported: {
        instructions:
            "Voit käyttää tätä sovellusta puhelimellasi ottamalla käyttöön kääntöanturin ja kääntämällä puhelimesi."
    },
    MaybeAcknowledgeConfigVolatilityDialog: {
        "dialog title": "Huomio, asetukset ovat epävakaita",
        "dialog body": `Tämä Onyxia-instanssi ei toteuta mitään pysyvyyteen liittyvää mekanismia asetusten tallentamiseksi. 
            Kaikki asetukset tallennetaan selaimen paikalliseen muistiin. Tämä tarkoittaa, että jos tyhjennät selaimesi paikallisen 
            muistin tai vaihdat selainta, menetät kaikki asetuksesi.`,
        "do not show next time": "Älä näytä tätä viestiä uudelleen",
        cancel: "Peruuta",
        "I understand": "Ymmärrän"
    },
    Home: {
        "title authenticated": ({ userFirstname }) => `Tervetuloa, ${userFirstname}!`,
        title: "Tervetuloa Onyxia datalabiin",
        "new user": "Uusi käyttäjä?",
        login: "Kirjaudu sisään",
        subtitle:
            "Työskentele Pythonin tai R:n kanssa ja nauti tarvitsemastasi laskentatehosta!",
        cardTitle1: "Ergonominen ympäristö ja tarvittaessa saatavilla olevat palvelut",
        cardTitle2: "Aktiivinen ja innostunut yhteisö palveluksessasi",
        cardTitle3: "Nopea, joustava ja verkkopohjainen tietovarasto",
        cardText1:
            "Analysoi dataa, suorita hajautettua laskentaa ja hyödynnä laajaa palvelukatalogia. Varaa tarvitsemasi laskentateho.",
        cardText2:
            "Käytä ja jaa käytettävissä olevia resursseja: opetusohjelmia, koulutuksia ja keskustelufoorumeita.",
        cardText3:
            "Helppo tapa käyttää omia ja saatavilla olevia tietoja ohjelmissasi - S3-rajapinnan toteutus",
        cardButton1: "Tutustu katalogiin",
        cardButton2: "Liity yhteisöön",
        cardButton3: "Selaa tietoja"
    },
    Catalog: {
        header: "Palvelukatalogi",
        "no result found": ({ forWhat }) => `Tuloksia ei löytynyt haulle ${forWhat}`,
        "search results": "Hakutulokset",
        search: "Haku",
        "title all catalog": "Kaikki"
    },
    CatalogChartCard: {
        launch: "Käynnistä",
        "learn more": "Lisätietoja"
    },
    CatalogNoSearchMatches: {
        "no service found": "Palvelua ei löytynyt",
        "no result found": ({ forWhat }) => `Tuloksia ei löytynyt haulle ${forWhat}`,
        "check spelling": "Tarkista kirjoitus tai laajenna hakua.",
        "go back": "Palaa pääpalveluihin"
    },
    Launcher: {
        sources: ({
            helmChartName,
            helmChartRepositoryName,
            labeledHelmChartSourceUrls
        }) => (
            <>
                Helm-kaavio{" "}
                {
                    <MaybeLink href={labeledHelmChartSourceUrls.helmChartSourceUrl}>
                        {helmChartName}
                    </MaybeLink>
                }{" "}
                kuuluu Helm-kaaviovarastoon{" "}
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
                        Se perustuu Docker-kuvaan{" "}
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
                        ...(doOpensNewTab ? { target: "_blank", onClick: undefined } : {})
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
        ),
        form: "Lomake",
        editor: "Tekstieditori"
    },
    AcknowledgeSharingOfConfigConfirmDialog: {
        "acknowledge sharing of config confirm dialog title":
            "Huomio, konfiguraatiot jaetaan",
        "acknowledge sharing of config confirm dialog subtitle": ({
            groupProjectName
        }) => `Jos tallennat
        tämän konfiguraation, jokainen projektin ${groupProjectName} jäsen pystyy käynnistämään sen.`,
        "acknowledge sharing of config confirm dialog body": `Vaikka Onyxia ei ole automaattisesti lisännyt henkilökohtaisia tietoja,
        ole varovainen, ettet jaa arkaluonteisia tietoja palautettavassa konfiguraatiossa.`,
        cancel: "Peruuta",
        "i understand, proceed": "Ymmärrän, jatka"
    },
    AutoLaunchDisabledDialog: {
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
        ok: "Ok"
    },
    FormFieldWrapper: {
        "reset to default": "Palauta oletusarvoon"
    },
    ConfigurationTopLevelGroup: {
        global: "global",
        miscellaneous: "Sekalaista",
        "Configuration that applies to all charts":
            "Konfiguraatio, joka koskee kaikkia kaavioita",
        "Top level configuration values": "Ylimmän tason konfiguraatioväriarvot"
    },
    YamlCodeBlockFormField: {
        "not an array": "Taulukkoa odotetaan",
        "not an object": "Oliota odotetaan",
        "not valid yaml": "Virheellinen YAML/JSON"
    },
    TextFormField: {
        "not matching pattern": ({ pattern }) => `Ei vastaa mallia ${pattern}`,
        "toggle password visibility": "Vaihda salasanan näkyvyyttä",
        loading: "Ladataan..."
    },
    FormFieldGroupComponent: {
        add: "Lisää"
    },
    AutoInjectSwitch: {
        tooltip: ({ isAutoInjected }) => (
            <>
                Jos tämä asetus on käytössä, se lisätään automaattisesti palveluihisi.
                Voit silti lisätä sen manuaalisesti palvelua käynnistäessäsi, vaikka tämä
                asetus olisi pois käytöstä.
                <br />
                <br />
                Nykyinen tila:{" "}
                <strong>{isAutoInjected ? "käytössä" : "ei käytössä"}</strong>
            </>
        )
    },
    NumberFormField: {
        "below minimum": ({ minimum }) =>
            `Täytyy olla suurempi tai yhtä suuri kuin ${minimum}`,
        "not a number": "Ei ole numero",
        "not an integer": "Ei ole kokonaisluku"
    },
    NoLongerBookmarkedDialog: {
        "no longer bookmarked dialog title": "Muutokset eivät tallennu",
        "no longer bookmarked dialog body":
            "Päivitä tallennettu konfiguraatio napsauttamalla kirjanmerkkikuvaketta uudelleen.",
        ok: "Ok"
    },
    MyService: {
        "page title": ({ helmReleaseFriendlyName }) =>
            `${helmReleaseFriendlyName} Valvonta`
    },
    PodLogsTab: {
        "not necessarily first logs":
            "Nämä eivät välttämättä ole ensimmäiset lokit, vanhemmat lokit saattavat olla poistettu",
        "new logs are displayed in realtime": "Uudet lokit näytetään reaaliajassa",
        follow: "Seuraa"
    },
    MyServiceButtonBar: {
        back: "Takaisin",
        "external monitoring": "Ulkoinen valvonta",
        "helm values": "Helm-arvot",
        reduce: "Vähennä"
    },
    LauncherMainCard: {
        "friendly name": "Käyttäjäystävällinen nimi",
        launch: "Käynnistä",
        "problem with": "Ongelma kohteessa:",
        cancel: "Peruuta",
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
    Footer: {
        "terms of service": "Käyttöehdot",
        "change language": "Vaihda kieli",
        "dark mode switch": "Tumma tila"
    },
    MyServices: {
        text1: "Omat palvelut",
        text2: "Käytettävissä olevat palvelusi",
        text3: "Palveluiden odotetaan olevan sammutettuina, kun et enää käytä niitä aktiivisesti.",
        "running services": "Käynnissä olevat palvelut"
    },
    ClusterEventsDialog: {
        title: "Tapahtumat",
        subtitle: (
            <>
                Kubernetes-nimiavaruuden tapahtumat, se on reaaliaikainen syöte komennosta{" "}
                <code>kubectl get events</code>
            </>
        ),
        close: "Sulje"
    },
    MyServicesConfirmDeleteDialog: {
        "confirm delete title": "Oletko varma?",
        "confirm delete subtitle":
            "Varmista, että palvelusi ovat valmiita poistettaviksi",
        "confirm delete body shared services":
            "Huomioi, että osa palveluistasi on jaettu muiden projektiin kuuluvien jäsenten kanssa.",
        "confirm delete body":
            "Muista tallentaa koodisi GitHubiin tai GitLabiin ennen palveluiden lopettamista",
        cancel: "Peruuta",
        confirm: "Kyllä, poista"
    },
    MyServicesButtonBar: {
        refresh: "Päivitä",
        launch: "Uusi palvelu",
        trash: "Tyhjennä kaikki",
        "trash my own": "Poista kaikki omat palvelut",
        events: "Tapahtumat"
    },
    MyServicesCard: {
        service: "Palvelu",
        "running since": "Käynnistetty: ",
        open: "avata",
        readme: "lueminut",
        "reminder to delete services": "Muista poistaa palvelusi.",
        status: "Tila",
        "container starting": "Säiliö käynnistyy",
        failed: "Epäonnistui",
        "suspend service tooltip": "Keskeytä palvelu ja vapauta resurssit",
        "resume service tooltip": "Jatka palvelua",
        suspended: "Keskeytetty",
        suspending: "Keskeyttää",
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
    MyServicesRestorableConfigOptions: {
        edit: "Muokkaa",
        "copy link": "Kopioi URL-osoite",
        "remove bookmark": "Poista",
        "move down": "Siirrä alas",
        "move up": "Siirrä ylös",
        "move to top": "Siirrä ylimmäksi",
        "move to bottom": "Siirrä alimmaksi"
    },
    MyServicesRestorableConfig: {
        edit: "Muokkaa",
        launch: "Käynnistä"
    },
    MyServicesRestorableConfigs: {
        saved: "Tallennettu",
        expand: "Laajenna"
    },
    ReadmeDialog: {
        ok: "ok",
        return: "Palaa"
    },
    CopyOpenButton: {
        "first copy the password": "Klikkaa kopioidaksesi salasanan...",
        "open the service": "Avaa palvelu 🚀"
    },
    MyServicesCards: {
        "running services": "Käynnissä olevat palvelut"
    },
    NoRunningService: {
        "launch one": "Käynnistä palvelu",
        "no services running": "Sinulla ei ole käynnissä olevia palveluita"
    },
    CircularUsage: {
        max: "Maksimi",
        used: "Käytetty",
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
    Quotas: {
        "show more": "Näytä lisää",
        "resource usage quotas": "Resurssien käyttökiintiöt",
        "current resource usage is reasonable":
            "Nykyinen resurssien käyttösi on kohtuullista."
    },
    DataExplorer: {
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
        column: "sarake",
        density: "tiheys",
        "download file": "lataa tiedosto",
        "resize table": "Muuta taulukon kokoa",
        "unsupported file type": ({ supportedFileTypes }) =>
            `Tuettua tiedostomuotoa ei tunnistettu. Tuetut tyypit ovat: ${supportedFileTypes.join(", ")}.`,
        "no s3 client":
            "S3-asiakasta ei ole määritetty. Siirry asetuksiin ja ota sellainen käyttöön Explorerissa.",
        "unsupported protocol":
            "URL ei ole tuettu. Tuetut protokollat ovat https:// ja s3://.",
        "https fetch error": "HTTPS-tiedostoa ei voitu noutaa.",
        "query error": "DuckDB-kyselyvirhe."
    },
    UrlInput: {
        load: "Lataa",
        reset: "Tyhjennä",
        "data source": "Tietolähde"
    },
    CommandBar: {
        ok: "ok"
    },
    formattedDate: {
        past1: ({ divisorKey }) => {
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
        pastN: ({ divisorKey }) => {
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
        future1: ({ divisorKey }) => {
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
        futureN: ({ divisorKey }) => {
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
        },
        singular: ({ divisorKey }) => {
            switch (divisorKey) {
                case "second":
                    return "1 sekunti";
                case "minute":
                    return "1 minuutti";
                case "hour":
                    return "1 tunti";
                case "day":
                    return "1 päivä";
                case "week":
                    return "1 viikko";
                case "month":
                    return "1 kuukausi";
                case "year":
                    return "1 vuosi";
            }
        },
        plural: ({ divisorKey }) => {
            switch (divisorKey) {
                case "second":
                    return "# sekuntia";
                case "minute":
                    return "# minuuttia";
                case "hour":
                    return "# tuntia";
                case "day":
                    return "# päivää";
                case "week":
                    return "# viikkoa";
                case "month":
                    return "# kuukautta";
                case "year":
                    return "# vuotta";
            }
        }
    },
    CopyToClipboardIconButton: {
        "copied to clipboard": "Kopioitu!",
        "copy to clipboard": "Kopioi leikepöydälle"
    },
    CustomDataGrid: {
        "empty directory": "Tämä hakemisto on tyhjä",
        "label rows count": ({ count }) => {
            const plural = count > 1 ? "tta" : "";
            return `${count} kohde${plural} valittu`;
        },
        "label rows per page": "Kohteet per sivu"
    },
    CustomDataGridToolbarDensitySelector: {
        toolbarDensity: "Tiheys",
        toolbarDensityStandard: "Normaali",
        toolbarDensityComfortable: "Mukava",
        toolbarDensityCompact: "Tiivis"
    },
    CustomDataGridToolbarColumnsButton: {
        toolbarColumnsLabel: "Sarakkeet"
    },
    DatasetCard: {
        publishedOn: "Julkaistu",
        datasetPage: "Aineistosivu",
        license: "Lisenssi:",
        format: "Muoto",
        size: "Koko",
        distributions: "Jakelut",
        visualize: "Visualisoi",
        unknown: "Tuntematon"
    },
    DataCollection: {
        "page header help title": "Syötä vain DCAT JSON-LD -skeemasi https://-osoite",
        "page header title": "Tietoluettelo",
        "page header help content": ({ demoCatalogLink }) => (
            <>
                Syötä vain tietoluettelon <code>https://</code>-URL-osoite nähdäksesi
                esikatselun.
                <br />
                Etkö tiedä, mistä aloittaa? Kokeile tätä{" "}
                <MuiLink {...demoCatalogLink}>demoluetteloa</MuiLink>!
            </>
        ),
        "https fetch error": "HTTPS-resurssia ei voitu hakea.",
        "invalid json response": "Vastaus ei ole kelvollista JSONia.",
        "json-ld compact error": "JSON-LD-vastausta ei voitu tiivistää.",
        "json-ld frame error": "JSON-LD-vastausta ei voitu kehystää.",
        "datasets parsing error": "Katalogin datasettejä ei voitu jäsentää."
    },
    S3UriBar: {
        explore: "Selaa..",
        "copy s3 path": "Kopioi S3-polku",
        copied: "Kopioitu",
        "copied path": ({ s3Uri }) => `Kopioitu polku: ${s3Uri}`,
        "add to bookmarks": "Lisää kirjanmerkkeihin",
        "delete from bookmarks": "Poista kirjanmerkeistä",
        "pinned storage location": "Kiinnitetty tallennussijainti",
        bookmarked: "Kirjanmerkitty",
        "edit s3 uri": "Muokkaa S3-URIa",
        prefix: "Etuliite",
        "admin bookmark": "Ylläpitäjän kirjanmerkki",
        bookmark: "Kirjanmerkki",
        object: "Objekti",
        public: "Julkinen",
        "go to s3 uri": ({ s3Uri, isPublic }) =>
            `${isPublic ? "Julkinen. " : ""}Siirry kohteeseen ${s3Uri}`,
        "s3 uri": "S3 URI",
        "edit from s3 root": "Muokkaa S3-juuresta",
        "edit object key": "Muokkaa objektin avainta",
        "object key": "Objektin avain",
        listing: "Listataan..."
    }
};
