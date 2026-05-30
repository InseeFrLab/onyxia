import type { Translations } from "../types";
import MuiLink from "@mui/material/Link";
import { Markdown } from "ui/shared/Markdown";
import { Icon } from "onyxia-ui/Icon";
import { getIconUrlByName } from "lazy-icons";
import { capitalize } from "tsafe/capitalize";
import { MaybeLink } from "ui/shared/MaybeLink";

export const translations: Translations<"fr"> = {
    /* spell-checker: disable */
    Account: {
        profile: "Profil",
        git: "Git",
        k8sCodeSnippets: "Connexion à Kubernetes",
        "user-interface": "Modes d'interface",
        text1: "Mon compte",
        text2: "Accédez à vos différentes informations de compte.",
        text3: "Configurez vos identifiants, e-mails, mots de passe et jetons d'accès personnels directement connectés à vos services.",
        "personal tokens tooltip": 'Ou en anglais "token".',
        vault: "Vault"
    },
    AccountProfileTab: {
        "account id": "Identifiant de compte",
        "account id helper":
            "Vos identifiants intangibles liés à l'identité que vous utilisez pour vous connecter à la plateforme",
        "user id": "ID utilisateur",
        email: "Email",
        "account management": "Gestion du compte"
    },
    UserProfileForm: {
        "customizable profile": "Profil personnalisable",
        "customizable profile helper":
            "Informations utiles à la configuration automatique de vos services",
        save: "Enregistrer",
        restore: "Restaurer"
    },
    ConfirmNavigationDialog: {
        "you have unsaved changes": "Vous avez des modifications non enregistrées !",
        cancel: "Annuler",
        "continue without saving": "Continuer sans enregistrer"
    },
    AccountGitTab: {
        gitName: "Nom d'utilisateur pour Git",
        "gitName helper text": ({ gitName, focusClassName }) => (
            <>
                Cette commande configurera votre nom d'utilisateur global Git, exécutée au
                démarrage du service:&nbsp;
                <code className={focusClassName}>
                    git config --global user.name "{gitName || "<votre_nom_utilisateur>"}"
                </code>
            </>
        ),
        gitEmail: "Email pour Git",
        "gitEmail helper text": ({ gitEmail, focusClassName }) => (
            <>
                Cette commande configurera votre email global Git, exécutée au démarrage
                du service:&nbsp;
                <code className={focusClassName}>
                    git config --global user.email "
                    {gitEmail || "<votre_email@domaine.com>"}"
                </code>
            </>
        ),
        githubPersonalAccessToken: "Token d'accès personnel pour Forge Git",
        "githubPersonalAccessToken helper text": ({ focusClassName }) => (
            <>
                En fournissant ce token, vous pourrez cloner et pousser vers vos dépôts
                privés GitHub ou GitLab sans devoir saisir à nouveau vos identifiants de
                forge.
                <br />
                Ce token sera également disponible en tant que variable
                d'environnement:&nbsp;
                <span className={focusClassName}>$GIT_PERSONAL_ACCESS_TOKEN</span>
            </>
        )
    },
    AccountKubernetesTab: {
        "credentials section title": "Connection au cluster Kubernetes",
        "credentials section helper":
            "Identifiants pour interagir directement avec le serveur d'API Kubernetes.",
        "init script section title": "Script Shell",
        "init script section helper": ({ installKubectlUrl }) => (
            <>
                Ce script permet d'utiliser kubectl ou helm sur votre machine locale.{" "}
                <br />
                Pour l'utiliser,{" "}
                <MuiLink href={installKubectlUrl} target="_blank">
                    installez simplement kubectl sur votre machine
                </MuiLink>{" "}
                et exécutez le script en le copiant-collant dans votre terminal.
                <br />
                Après avoir fait cela, vous pouvez confirmer que cela fonctionne en
                exécutant la commande&nbsp;
                <code>kubectl get pods</code> ou <code>helm list</code>
            </>
        ),
        "expires in": ({ howMuchTime }) =>
            `Ces identifiants sont valables pour les ${howMuchTime} prochaines`
    },
    AccountVaultTab: {
        "credentials section title": "Identifiants Vault",
        "credentials section helper": ({ vaultDocHref, mySecretLink }) => (
            <>
                <MuiLink href={vaultDocHref} target="_blank">
                    Vault
                </MuiLink>{" "}
                est le système où &nbsp;
                <MuiLink {...mySecretLink}>vos secrets</MuiLink> sont enregistrés.
            </>
        ),
        "init script section title": "Utiliser Vault depuis votre terminal",
        "init script section helper": ({ vaultCliDocLink }) => (
            <>
                Télécharger ou copier les variables d'<code>ENV</code> pour configurer
                votre{" "}
                <MuiLink href={vaultCliDocLink} target="_blank">
                    Vault CLI
                </MuiLink>{" "}
                local.
            </>
        ),
        "expires in": ({ howMuchTime }) => `Le token expire ${howMuchTime}`
    },
    AccountUserInterfaceTab: {
        title: "Configurer le mode d'interface",
        "enable dark mode": "Activer le mode sombre",
        "dark mode helper":
            "Thème de l'interface à faible luminosité avec un fond de couleur sombre.",
        "enable beta": "Activer le mode béta-testeur",
        "beta mode helper":
            "Pour des configurations et fonctionnalités avancées de la plateforme.",
        "enable dev mode": "Activer le mode développeur",
        "dev mode helper": "Activer les fonctionnalités en cours de développement",
        "Enable command bar": "Activer la barre de commande",
        "Enable command bar helper": ({ imgUrl }) => (
            <>
                La{" "}
                <MuiLink href={imgUrl} target="_blank">
                    barre de commande
                </MuiLink>{" "}
                vous donne un aperçu des commandes exécutées en votre nom lorsque vous
                interagissez avec l'interface utilisateur.
            </>
        )
    },
    SettingField: {
        "copy tooltip": "Copier dans le presse-papier",
        language: "Changer la langue",
        "service password": "Mot de passe par défault des services",
        "service password helper text": ({ groupProjectName }) => (
            <>
                Ceci est le mot de passe par défaut utilisé pour protéger vos services en
                cours d'exécution. <br />
                Lorsque vous lancez un service, le champ de mot de passe dans l'onglet
                sécurité est pré-rempli avec ce mot de passe. <br />
                Cliquer sur l'icône{" "}
                <Icon size="extra small" icon={getIconUrlByName("Refresh")} /> générera un
                nouveau mot de passe aléatoire. Cependant, soyez conscient que cela ne
                mettra pas à jour le mot de passe pour les services qui sont déjà en cours
                d'exécution. <br />
                Le mot de passe du service est ce qu'Onyxia vous fait copier dans votre
                presse-papiers avant d'accéder à un service en cours d'exécution. <br />
                {groupProjectName !== undefined && (
                    <>
                        Veuillez noter que ce mot de passe est partagé parmi tous les
                        membres du projet ({groupProjectName}).
                    </>
                )}
            </>
        ),
        "not yet defined": "Non définie",
        "reset helper dialogs": "Réinitialiser les fenêtres d'instructions",
        reset: "Réinitialiser",
        "reset helper dialogs helper text":
            "Réinitialiser les fenêtres de messages que vous avez demandé de ne plus afficher"
    },
    ConfirmBucketCreationAttemptDialog: {
        "bucket does not exist title": ({ bucket }) => `Le bucket ${bucket} n'existe pas`,
        "bucket does not exist body": "Voulez-vous tenter de le créer maintenant ?",
        no: "Non",
        yes: "Oui",
        "success title": "Succès",
        "failed title": "Échec",
        "success body": ({ bucket }) => `Bucket ${bucket} créé avec succès.`,
        "failed body": ({ bucket }) => `Échec de la création de ${bucket}.`,
        ok: "Ok"
    },
    ConfirmOverwriteDialog: {
        "dialog title": "Le fichier existe déjà",
        "dialog body": "Voulez-vous écraser le fichier existant ?",
        cancel: "Annuler",
        overwrite: "Écraser"
    },
    ConfirmCustomS3ConfigDeletionDialog: {
        "dialog title": "Confirmer la suppression de la configuration S3 personnalisée ?",
        cancel: "Annuler",
        yes: "Oui"
    },
    DisplayErrorDialog: {
        error: "Erreur",
        ok: "Ok"
    },
    S3Explorer: {
        "page header title": "Stockage de données",
        "create profile": "Créer un profil",
        back: "Retour",
        upload: "Téléverser",
        "create new prefix": "Créer un nouveau préfixe"
    },
    S3ShareObjectDialogContainer: {
        "dialog title": "Partager l'objet"
    },
    S3BookmarksBar: {
        "s3 bookmarks aria label": "Favoris S3",
        "show more bookmarks": "Afficher plus de favoris"
    },
    S3BookmarkItem: {
        "open bookmark": "Ouvrir le favori",
        "open bucket": "Ouvrir le bucket",
        "bookmark actions": "Actions du favori",
        rename: "Renommer",
        delete: "Supprimer",
        "rename bookmark": "Renommer le favori",
        "delete bookmark": "Supprimer le favori"
    },
    S3BookmarksEntryPointList: {
        "s3 bookmark entry points aria label": "Points d’entrée des favoris S3",
        bookmarks: "Favoris",
        "no bookmarks yet": "Aucun favori pour le moment.",
        "storage locations": "Emplacements de stockage"
    },
    S3DialogCopyField: {
        "generating url": "Génération de l'URL...",
        copy: "Copier",
        copied: "Copié"
    },
    S3DialogItemSummary: {
        public: "Public"
    },
    S3ProfileSelect: {
        "select s3 profile aria label": "Sélectionner le profil S3",
        "profile settings aria label": "Paramètres du profil",
        "s3 profiles aria label": "Profils S3",
        "new s3 profile": "Nouveau profil S3"
    },
    S3SelectionActionBar: {
        download: "Télécharger",
        delete: "Supprimer",
        "copy s3 uri": "Copier l'URI S3",
        copied: "Copié",
        "copy s3 uri tooltip": ({ s3UriStr }) => `Copier "${s3UriStr}"`,
        "add to bookmarks": "Ajouter aux favoris",
        "delete from bookmarks": "Supprimer des favoris",
        share: "Partager",
        "make public": "Rendre public",
        "make private": "Rendre privé",
        "one selected": "1 sélectionné",
        "many selected": ({ count }) => `${count} sélectionnés`,
        "clear selection": "Effacer la sélection"
    },
    ConfirmAbortUploadDialog: {
        "dialog title": "Annuler le téléversement ?",
        "dialog body": "Votre téléversement n'est pas terminé. Voulez-vous l'annuler ?",
        "continue upload": "Continuer le téléversement",
        "cancel upload": "Annuler le téléversement"
    },
    S3Uploads: {
        "uploading count": ({ count }) =>
            `Téléversement de ${count} élément${count === 1 ? "" : "s"}...`,
        "upload count": ({ count }) => `${count} téléversement${count === 1 ? "" : "s"}`,
        "expand uploads": "Développer les téléversements",
        "collapse uploads": "Réduire les téléversements",
        "close uploads": "Fermer les téléversements",
        "uploading status": "Téléversement...",
        completed: "Terminé",
        error: "Erreur",
        "uploaded size of total size": ({ uploadedSize, totalSize }) =>
            `${uploadedSize} sur ${totalSize}`,
        of: "sur",
        "open uploaded directory": "Ouvrir le répertoire téléversé",
        "cancel upload": "Annuler le téléversement",
        "retry upload": "Réessayer le téléversement"
    },
    CustomNoRowsOverlay: {
        "no rows": "Aucune ligne"
    },
    DataTextEditor: {
        "not a valid format": ({ format }) => `Format invalide : ${format}`,
        format: "Format",
        "all defaults": "Toutes les valeurs par défaut",
        schema: "Schéma"
    },
    JsonSchemaDialog: {
        "json schema": "Schéma JSON",
        ok: "Ok"
    },
    SelectFormField: {
        "empty string": "(Chaîne vide)"
    },
    CreateOrRenameBookmarkDialog: {
        "dialog title": "Nom du signet",
        "add dialog title": "Ajouter cet emplacement aux signets",
        "rename dialog title": "Renommer le signet",
        "dialog subtitle":
            "Enregistrez cet emplacement S3 pour y accéder plus rapidement plus tard.",
        "bookmarkName textField label": "Nom",
        "bookmarkName textField empty error": "Le nom du signet ne peut pas être vide",
        "copy s3 path aria label": "Copier le chemin S3",
        cancel: "Annuler",
        ok: "Ok",
        "add to bookmarks": "Ajouter aux signets",
        "rename bookmark": "Renommer le signet"
    },
    DirectoryCreationDialog: {
        "dialog title": "Créer un répertoire",
        "dialog subtitle":
            "Les répertoires sont créés par rapport au préfixe actuellement affiché.",
        "create prefix dialog title": "Créer un préfixe",
        "create prefix dialog subtitle":
            "Créer un nouveau préfixe dans l'emplacement S3 actuel.",
        "directoryName textField label": "Nom du répertoire",
        "prefixName textField label": "Nom du préfixe",
        "directoryName textField empty error":
            "Le nom du répertoire ne peut pas être vide",
        "directoryName textField duplicate error": "Le nom du répertoire existe déjà",
        cancel: "Annuler",
        create: "Créer",
        "create prefix": "Créer le préfixe"
    },
    MakePrefixPublicDialog: {
        "dialog title": "Rendre le préfixe public",
        "make public dialog title": "Rendre ce préfixe public ?",
        "make private dialog title": "Rendre ce préfixe privé ?",
        "make public dialog body main":
            "Tous les fichiers de ce préfixe seront accessibles à toute personne disposant d'un lien, y compris le contenu actuel et futur.",
        "make public dialog body alternative":
            "Pour partager des fichiers précis ou limiter l'accès dans le temps, créez plutôt un lien de partage.",
        "make private dialog body main":
            "Tous les fichiers de ce préfixe sont accessibles à toute personne disposant d'un lien, y compris le contenu actuel et futur. Rendre ce préfixe privé supprime l'accès public.",
        "make private dialog body alternative":
            "Pour partager des fichiers précis ou limiter l'accès dans le temps, créez plutôt un lien de partage.",
        "dialog body": ({ s3Uri, s3UriClassName }) => (
            <>
                Vous êtes sur le point de rendre{" "}
                <span className={s3UriClassName}>{s3Uri}</span> public. Tout le monde
                pourra lister et télécharger tous les objets actuels et futurs de ce
                préfixe.
                <br />
                <br />
                Les liens de téléchargement que vous partagez pour les objets de ce
                préfixe n&apos;expireront jamais.
            </>
        ),
        cancel: "Annuler",
        "make public": "Rendre public",
        "make private": "Rendre privé"
    },
    S3ExplorerMainView: {
        "create prefix dialog title": "Créer un préfixe",
        "create prefix dialog subtitle":
            "Créer un nouveau préfixe dans l'emplacement S3 actuel.",
        "prefix name field label": "Nom du préfixe",
        "prefix name empty error": "Le nom du préfixe ne peut pas être vide.",
        cancel: "Annuler",
        "create prefix": "Créer le préfixe",
        "delete selection dialog title": "Supprimer la sélection",
        "delete selection dialog subtitle":
            "Cette action supprime définitivement les éléments sélectionnés.",
        "delete selection dialog body": ({ count }) =>
            `Vous êtes sur le point de supprimer ${count} élément${count > 1 ? "s" : ""} sélectionné${count > 1 ? "s" : ""}. Supprimer un préfixe supprime aussi tout son contenu.`,
        delete: "Supprimer",
        share: "Partager",
        download: "Télécharger",
        "copy s3 uri": "Copier l'URI S3",
        copied: "Copié",
        "copy s3 uri tooltip": ({ s3UriStr }) => `Copier "${s3UriStr}"`,
        "add to bookmarks": "Ajouter aux favoris",
        "delete from bookmarks": "Supprimer des favoris",
        "make public": "Rendre public",
        "make private": "Rendre privé",
        folder: "Dossier",
        object: "Objet",
        "folder is public": "Le dossier est public",
        "folder is private": "Le dossier est privé",
        today: "Aujourd'hui",
        yesterday: "Hier",
        "access denied": "Accès refusé",
        "bucket not found": "Bucket introuvable",
        "access denied description":
            "Vous n'avez pas l'autorisation de lister cet emplacement S3.",
        "bucket not found description":
            "Le bucket demandé n'existe pas ou n'est pas accessible avec le profil actuel.",
        "select item": ({ itemName }) => `Sélectionner ${itemName}`,
        "select all items": "Sélectionner tous les éléments",
        public: "Public",
        deleting: "Suppression...",
        uploading: "Téléversement",
        "drag and drop to import files": "Glissez-déposez pour importer des fichiers",
        "this prefix is empty": "Ce préfixe est vide",
        "empty prefix description":
            "Téléversez des fichiers ou créez un dossier pour commencer à remplir cet emplacement.",
        "upload files": "Téléverser des fichiers",
        "new folder": "Nouveau dossier",
        name: "Nom",
        "last modified": "Dernière modification",
        size: "Taille"
    },
    S3ShareObjectDialog: {
        "generating public URL": "Génération de l'URL publique...",
        "copy public URL aria label": "Copier l'URL publique",
        "signed link with time limit": "Lien signé avec durée limitée",
        "signed link validity aria label": "Durée de validité du lien signé",
        "generating signed URL": "Génération de l'URL signée...",
        "copy signed URL aria label": "Copier l'URL signée",
        "public description":
            "Toute personne disposant de l'URL peut accéder à cet objet. Le lien n'expire jamais car l'objet se trouve dans un préfixe public.",
        "signed description":
            "Créez une URL signée avec une durée de validité limitée. Pour partager une URL qui n'expire pas, rendez public l'un des préfixes parents de cet objet.",
        "validity duration one hour": "1 heure",
        "validity duration one day": "1 jour",
        "validity duration one week": "1 semaine",
        "selected duration": "la durée sélectionnée"
    },
    S3ProfileDialog: {
        "detail title": "Détail du profil S3",
        "create title": "Nouveau profil S3 personnalisé",
        "edit title": "Modifier le profil S3 personnalisé",
        "close aria label": "Fermer la fenêtre de profil S3"
    },
    S3ProfileDetails: {
        "read only": "Lecture seule",
        custom: "Personnalisé",
        edit: "Modifier",
        delete: "Supprimer",
        "connection details title": "Détails de connexion",
        "connection details subtitle":
            "Utilisez ces valeurs pour configurer des clients S3 en dehors de l'explorateur.",
        "endpoint url label": "URL du point d'accès",
        "default region label": "Région par défaut",
        "access credentials title": "Identifiants d'accès",
        "access credentials anonymous subtitle":
            "Ce profil n'expose pas d'identifiants. Utilisez l'accès S3 anonyme lorsque le bucket cible l'autorise.",
        "access credentials subtitle":
            "Copiez la valeur requise par le client que vous configurez.",
        "access key id label": "Access key ID",
        "secret access key label": "Secret access key",
        "session token label": "Jeton de session",
        "environment variable": "Variable d'environnement",
        "no expiration": "Aucune date d'expiration n'est fournie pour ces identifiants.",
        expires: ({ expirationTime }) => `Expire le ${expirationTime}.`,
        renewing: "Renouvellement...",
        "renew tokens": "Renouveler les jetons",
        "init script title": "Pour accéder à votre stockage hors des services Datalab",
        "init script subtitle":
            "Téléchargez ou copiez le script d'initialisation dans le langage de programmation de votre choix.",
        "technology aria label": "Technologie",
        download: "Télécharger",
        "select s3 profile aria label": "Sélectionner un profil S3",
        "s3 profiles aria label": "Profils S3",
        "new s3 profile": "Nouveau profil S3",
        "copy aria label": ({ what }) => `Copier ${what}`,
        copied: "Copié",
        copy: "Copier"
    },
    S3ProfileForm: {
        "must be an url": "Saisissez une URL valide.",
        "is required": "Ce champ est obligatoire.",
        "not a valid access key id": "Saisissez un identifiant de clé d'accès valide.",
        "profile name already used": "Ce nom de profil est déjà utilisé.",
        "connection details title": "Détails de connexion",
        "connection details subtitle":
            "Définissez le nom du profil et le point d'accès S3 utilisés par l'explorateur.",
        "profile name label": "Nom du profil",
        "s3 service url label": "URL du service S3",
        "s3 service url helper": "Exemple : https://minio.lab.example.net",
        "default region label": "Région par défaut",
        "default region helper": "Exemple : eu-west-1, laissez vide en cas de doute",
        "url style title": "Style d'URL",
        "url style subtitle":
            "Indiquez comment votre serveur S3 forme les URL de téléchargement.",
        "path style": "Style chemin",
        "virtual hosted style": "Style hôte virtuel",
        example: "Exemple",
        "account credentials title": "Identifiants du compte",
        "account credentials subtitle":
            "Choisissez si ce profil utilise un accès anonyme ou des identifiants explicites.",
        "anonymous access": "Accès anonyme",
        "access key id label": "Access Key ID",
        "access key id helper": "Exemple : ASIAIOSFODNN7EXAMPLE",
        "secret access key label": "Secret Access Key",
        "secret access key helper": "Exemple : wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
        "session token label": "Jeton de session",
        "session token helper":
            "Optionnel. Laissez vide si vos identifiants n'incluent pas de jeton de session.",
        cancel: "Annuler",
        "save configuration": "Enregistrer la configuration",
        "create profile": "Créer le profil"
    },
    MySecrets: {
        "page title - my secrets": "My Secrets",
        "what this page is used for - my secrets":
            "Stockez ici des secrets qui seront accessibles sous forme de variables d'environnement dans vos services.",
        "learn more - my files": "Pour en savoir plus sur l'utilisation du stockage S3,",
        "help content": ({ accountTabLink, docHref }) => (
            <>
                Lire{" "}
                <MuiLink href={docHref} target="_blank">
                    notre documentation
                </MuiLink>
                . &nbsp;
                <MuiLink {...accountTabLink}>
                    Configurer votre Vault CLI local
                </MuiLink>.
            </>
        )
    },
    SecretsExplorerItem: {
        description: "description"
    },
    SecretsExplorerButtonBar: {
        secret: "secret",
        rename: "renommer",
        delete: "supprimer",
        "create secret": "Nouveau secret",
        "copy path": "Utiliser dans le service",
        "create new empty directory": "Nouveau dossier",
        refresh: "rafraîchir",
        "create what": ({ what }) => `Nouveau ${what}`,
        new: "Nouveau"
    },
    SecretsExplorer: {
        file: "fichier",
        secret: "secret",
        cancel: "annuler",
        delete: "supprimer",
        "do not display again": "Ne plus afficher",
        "untitled what": ({ what }) => `${what}_sans_nom`,
        directory: "dossier",
        "deletion dialog title": ({ deleteWhat }) => `Supprimer un ${deleteWhat} ?`,
        "deletion dialog body": ({ deleteWhat }) => `
            Vous êtes sur le point de supprimer un ${deleteWhat}. 
            Cette action entraînera la perte potentielle des données liées à ce ${deleteWhat}.
            `,
        "already a directory with this name": "Il y a déjà un dossier avec ce nom",
        "can't be empty": "Ne peut être vide",
        create: "Créer",
        "new directory": "Nouveau dossier"
    },
    SecretsExplorerItems: {
        "empty directory": "Ce répertoire est vide"
    },
    MySecretsEditor: {
        "do not display again": "Ne plus afficher",
        "add an entry": "Ajouter une variable",
        "environnement variable default name": "NOUVELLE_VARENV",
        "table of secret": "table de secrets",

        "key column name": "Nom de la variable",
        "value column name": "Valeur",
        "unavailable key": "Déjà utilisé",
        "invalid key empty string": "Un nom est requis",
        "invalid key _ not valid": "Ne peut pas être juste _",
        "invalid key start with digit": "Ne doit pas commencer par un chiffre",
        "invalid key invalid character": "Caractère non valide",
        "use this secret": "Utiliser dans un service",

        "use secret dialog title": "Utiliser dans un service",
        "use secret dialog subtitle": "Le chemin du secret a été copié.",
        "use secret dialog body": `
                Au moment de lancer un service (RStudio, Jupyter), rendez-vous
                dans l'onglet 'VAULT' et collez le chemin du secret dans le champ prévu à cet effet.
                Vos clefs valeurs seront disponibles sous forme de variables d'environnement.
            `,
        "use secret dialog ok": "J'ai compris"
    },
    MySecretsEditorRow: {
        "key input desc": "Nom de la variable d'environnement",
        "value input desc": "Valeur de la variable d'environnement"
    },
    Header: {
        login: "Connexion",
        logout: "Déconnexion",
        region: "Région"
    },
    ProjectSelect: {
        project: "Projet"
    },
    LeftBar: {
        reduce: "Réduire",
        home: "Accueil",
        account: "Mon compte",
        catalog: "Catalogue de services",
        myServices: "Mes services",
        mySecrets: "Mes secrets",
        "divider: services features": "Fonctionnalités relative aux services",
        "divider: external services features":
            "Fonctionnalités relative aux services externes",
        "divider: onyxia instance specific features":
            "Fonctionnalités spécifiques à cette instance d'Onyxia",
        dataExplorer: "Explorateur de Données",
        dataCollection: "Explorateur de Collections",
        s3Explorer: "Stockage de données",
        sqlOlapShell: "Coquille SQL OLAP"
    },
    AutoLogoutCountdown: {
        "are you still there": "Êtes-vous toujours là ?",
        "you'll soon be automatically logged out":
            "Vous serez bientôt déconnecté automatiquement."
    },
    Page404: {
        "not found": "Page non trouvée"
    },
    PortraitModeUnsupported: {
        instructions:
            "Pour utiliser cette application depuis votre mobile, veuillez activer le capteur de rotation et tourner votre téléphone."
    },
    MaybeAcknowledgeConfigVolatilityDialog: {
        "dialog title": "Attention, les configurations sont volatiles",
        "dialog body": `Cette instance Onyxia n'implémente aucun mécanisme de persistance pour stocker les configurations. 
            Toutes les configurations sont stockées dans le stockage local du navigateur. Cela signifie que si vous effacez le 
            stockage local de votre navigateur ou changez de navigateur, vous perdrez toutes vos configurations.`,
        "do not show next time": "Ne plus afficher ce message",
        cancel: "Annuler",
        "I understand": "Je comprends"
    },
    Home: {
        "title authenticated": ({ userFirstname }) => `Bienvenue ${userFirstname}!`,
        title: "Bienvenue sur le datalab",
        login: "Connexion",
        "new user": "Nouvel utilisateur du datalab ?",
        subtitle:
            "Travaillez avec Python ou R et disposez de la puissance dont vous avez besoin !",
        cardTitle1: "Un environnement ergonomique et des services à la demande",
        cardTitle2: "Une communauté active et enthousiaste à votre écoute",
        cardTitle3: "Un espace de stockage de données rapide, flexible et en ligne",
        cardText1:
            "Analysez les données, faites du calcul distribué et profitez d'un large catalogue de services. Réservez la puissance de calcul dont vous avez besoin.",
        cardText2:
            "Profitez et partagez des ressources mises à votre disposition : tutoriels, formations et canaux d'échanges.",
        cardText3:
            "Pour accéder facilement à vos données et à celles mises à votre disposition depuis vos programmes - Implémentation API S3",
        cardButton1: "Consulter le catalogue",
        cardButton2: "Rejoindre la communauté",
        cardButton3: "Consulter des données"
    },
    Catalog: {
        header: "Catalogue de services",
        "no result found": ({ forWhat }) => `Aucun résultat trouvé pour ${forWhat}`,
        "search results": "Résultats de la recherche",
        search: "Rechercher",
        "title all catalog": "Tous"
    },
    CatalogChartCard: {
        launch: "Lancer",
        "learn more": "En savoir plus"
    },
    CatalogNoSearchMatches: {
        "no service found": "Service non trouvé",
        "no result found": ({ forWhat }) => `Aucun résultat trouvé pour ${forWhat}`,
        "check spelling": `Vérifiez que le nom du service est correctement 
            orthographié ou essayez d'élargir votre recherche.`,
        "go back": "Retourner aux principaux services"
    },
    Launcher: {
        sources: ({
            helmChartName,
            helmChartRepositoryName,
            labeledHelmChartSourceUrls
        }) => (
            <>
                Le chart Helm{" "}
                {
                    <MaybeLink href={labeledHelmChartSourceUrls.helmChartSourceUrl}>
                        {helmChartName}
                    </MaybeLink>
                }{" "}
                appartient au dépôt de charts Helm{" "}
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
                        Il est basé sur l'image Docker{" "}
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
        "download as script": "Télécharger le script",
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
            >{`Nous avons conçu la barre de commande pour vous permettre de prendre le contrôle de vos déploiements Kubernetes.
Voici ce que vous devez savoir :

#### Quelles sont ces commandes Helm ?

Ces commandes sont les commandes Helm exactes que l'API Onyxia exécutera en votre nom dans votre espace de noms Kubernetes.
Cela vous permet de savoir ce qui se passe en coulisse lorsque vous interagissez avec l'interface utilisateur.

#### Mises à jour en temps réel

Lorsque vous interagissez avec l'interface utilisateur, les commandes Helm se mettront à jour automatiquement pour refléter ce que vous faites.

#### Pourquoi devrais-je m'en soucier ?

- **Transparence :** Nous croyons que vous avez le droit de savoir quelles actions sont effectuées dans votre environnement.
- **Apprentissage :** Comprendre ces commandes peut fournir des informations sur Kubernetes et Helm, approfondissant ainsi vos connaissances.
- **Exécution manuelle :** Vous pouvez copier et coller ces commandes dans un terminal ayant un accès en écriture à Kubernetes, ce qui vous permet de lancer le service manuellement.

#### Comment puis-je exécuter ces commandes manuellement ?

${
    k8CredentialsHref === undefined
        ? ""
        : "Il y a deux façons d'exécuter ces commandes :  "
}

${
    k8CredentialsHref === undefined
        ? ""
        : `
- **Terminal local :** Allez dans [\`Mon compte -> Onglet Kubernetes\`](${k8CredentialsHref}).
  Ici, vous trouverez les informations d'identification qui vous permettent d'exécuter des commandes dans votre espace de noms Kubernetes depuis votre terminal local.
`
}

- Si cette instance d'Onyxia propose des services comme VSCode ou Jupyter, vous pouvez ouvrir un terminal au sein de ces services et y exécuter des commandes.
  Pour des commandes constructives ou destructives, vous devrez lancer votre service avec le rôle Kubernetes \`admin\` ou \`edit\`.

En exécutant la commande manuellement, vous pourrez toujours voir le service dans l'onglet [\`Mes Services\`](${myServicesHref}) comme si celui-ci avait été lancé via l'interface utilisateur.

Vous pouvez désactiver la barre de commande dans l'onglet [\`Mon compte -> Préférences d'interface\`](${interfacePreferenceHref}).

N'hésitez pas à explorer et à prendre en main vos déploiements Kubernetes !
        `}</Markdown>
        ),
        form: "Formulaire",
        editor: "Éditeur de texte"
    },
    AcknowledgeSharingOfConfigConfirmDialog: {
        "acknowledge sharing of config confirm dialog title":
            "Soyez conscient, les configurations sont partagées",
        "acknowledge sharing of config confirm dialog subtitle": ({
            groupProjectName
        }) => `Si vous enregistrez
        cette configuration, chaque membre du projet ${groupProjectName} pourra la lancer.`,
        "acknowledge sharing of config confirm dialog body": `Bien qu'aucune information personnelle n'ait été automatiquement injectée
        par Onyxia, soyez prudent de ne pas partager d'informations sensibles dans la configuration restaurable.`,
        cancel: "Annuler",
        "i understand, proceed": "Je comprends, continuer"
    },
    AutoLaunchDisabledDialog: {
        "auto launch disabled dialog title": "Lancement automatique désactivé",
        "auto launch disabled dialog body": (
            <>
                <b>ATTENTION</b>: Quelqu'un pourrait essayer de vous tromper en lançant un
                service qui pourrait compromettre l'intégrité de votre namespace.
                <br />
                Veuillez examiner attentivement la configuration du service avant de le
                lancer.
                <br />
                En cas de doute, veuillez contacter votre administrateur.
            </>
        ),
        ok: "Ok"
    },
    FormFieldWrapper: {
        "reset to default": "Réinitialiser à la valeur par défaut"
    },
    ConfigurationTopLevelGroup: {
        global: "global",
        miscellaneous: "Divers",
        "Configuration that applies to all charts":
            "Configurations qui s'appliquent à tous les charts",
        "Top level configuration values": "Configuration racine"
    },
    YamlCodeBlockFormField: {
        "not an array": "Un tableau est attendu",
        "not an object": "Un objet est attendu",
        "not valid yaml": "YAML/JSON invalide"
    },
    TextFormField: {
        "not matching pattern": ({ pattern }) => `Ne correspond pas au motif ${pattern}`,
        "toggle password visibility": "Basculer la visibilité du mot de passe",
        loading: "Chargement..."
    },
    FormFieldGroupComponent: {
        add: "Ajouter"
    },
    AutoInjectSwitch: {
        tooltip: ({ isAutoInjected }) => (
            <>
                Si activé, cette configuration sera automatiquement injectée dans vos
                services. Vous pouvez tout de même l’ajouter manuellement lors du
                lancement d’un service, même si cette option reste désactivée.
                <br />
                <br />
                État actuel : <strong>{isAutoInjected ? "activé" : "désactivé"}</strong>
            </>
        )
    },
    NumberFormField: {
        "below minimum": ({ minimum }) => `Doit être supérieur ou égal à ${minimum}`,
        "not a number": "Pas un nombre",
        "not an integer": "Pas un entier"
    },
    NoLongerBookmarkedDialog: {
        "no longer bookmarked dialog title": "Changements non enregistrés",
        "no longer bookmarked dialog body":
            "Cliquer une nouvelle fois sur le symbole marque-page pour mettre à jour votre configuration enregistrée.",
        ok: "Ok"
    },
    MyService: {
        "page title": ({ helmReleaseFriendlyName }) =>
            `${helmReleaseFriendlyName} Surveillance`
    },
    PodLogsTab: {
        "not necessarily first logs":
            "Ce ne sont pas nécessairement les premiers journaux, les journaux plus anciens peuvent avoir été effacés",
        "new logs are displayed in realtime":
            "Les nouveaux journaux sont affichés en temps réel",
        follow: "Suivre"
    },
    MyServiceButtonBar: {
        back: "Retour",
        "external monitoring": "Surveillance externe",
        "helm values": "Valeurs de Helm",
        reduce: "Réduire"
    },
    LauncherMainCard: {
        "friendly name": "Nom personnalisé",
        launch: "Lancer",
        "problem with": "Problème avec :",
        cancel: "Annuler",
        "copy auto launch url": "Copier l'URL de lancement automatique",
        "copy auto launch url helper": ({
            chartName
        }) => `Copier l'URL qui permettra à tout utilisateur de cette instance Onyxia de 
            lancer un ${chartName} dans cette configuration dans leur namespace`,
        "share the service": "Partager le service",
        "share the service - explain":
            "Rendre accessible le service aux collaborateurs du groupe",
        "restore all default": "Réinitialiser les configurations",
        "bookmark button": ({ isBookmarked }) =>
            `${isBookmarked ? "Supprimer" : "Enregistrer"} la configuration`,
        "bookmark button tooltip": ({ myServicesSavedConfigsExtendedLink }) => (
            <>
                Les configurations enregistrées peuvent être relancer rapidement depuis la
                page&nbsp;
                <MuiLink {...myServicesSavedConfigsExtendedLink} target="_blank">
                    Mes Services
                </MuiLink>
            </>
        ),
        "version select label": "Version",
        "version select helper text": ({
            helmCharName,
            helmRepositoryName,
            labeledHelmChartSourceUrls
        }) => (
            <>
                Version du helm chart{" "}
                {
                    <MaybeLink href={labeledHelmChartSourceUrls.helmChartSourceUrl}>
                        {helmCharName}
                    </MaybeLink>
                }{" "}
                qui appartient au dépôt de helm charts{" "}
                {
                    <>
                        <MaybeLink
                            href={labeledHelmChartSourceUrls.helmChartRepositorySourceUrl}
                        >
                            {helmRepositoryName}
                        </MaybeLink>
                        .
                    </>
                }
            </>
        ),
        "save changes": "Enregistrer les modifications",
        "copied to clipboard": "Copié dans le presse-papiers !",
        "s3 configuration": "Configuration S3",
        "s3 configuration - explain": ({ projectS3ConfigLink }) => (
            <>
                Configuration S3 à utiliser pour ce service.{" "}
                <MuiLink {...projectS3ConfigLink}>Configuration S3</MuiLink>.
            </>
        )
    },
    Footer: {
        "terms of service": "Conditions d'utilisation",
        "change language": "Changer la langue",
        "dark mode switch": "Interrupteur pour le mode sombre"
    },
    MyServices: {
        text1: "Mes services",
        text2: "Lancer, visualiser et gérer rapidement vos différents services en cours d'exécution.",
        text3: "Il est recommandé de supprimer vos services après chaque session de travail.",
        "running services": "Services en cours"
    },
    ClusterEventsDialog: {
        title: "Événements",
        subtitle: (
            <>
                Les événements du namespace Kubernetes, il s'agit d'un flux en temps réel
                de <code>kubectl get events</code>
            </>
        ),
        close: "Fermer"
    },
    MyServicesConfirmDeleteDialog: {
        "confirm delete title": "Êtes-vous sûr?",
        "confirm delete subtitle":
            "Assurez-vous que vos services ne contiennent pas de travail non sauvegardé.",
        "confirm delete body":
            "N'oubliez pas de pusher votre code sur GitHub ou GitLab avant de continuer.",
        "confirm delete body shared services":
            "Attention, certains de vos services sont partagés aux autres membres du projet.",
        cancel: "Annuler",
        confirm: "Oui, supprimer"
    },
    MyServicesButtonBar: {
        refresh: "Rafraîchir",
        launch: "Nouveau service",
        trash: "Supprimer tous",
        "trash my own": "Supprimer tous mes services",
        events: "Événements"
    },
    MyServicesCard: {
        service: "Service",
        "running since": "Démarré : ",
        open: "ouvrir",
        readme: "readme",
        "reminder to delete services":
            "Rappelez-vous de supprimer vos services après utilisation.",
        status: "Statut",
        "container starting": "Démarrage du conteneur",
        failed: "Échoué",
        "suspend service tooltip": "Suspendre le service et libérer les ressources",
        "resume service tooltip": "Reprendre le service",
        suspended: "Suspendu",
        suspending: "En suspension",
        "share tooltip - belong to someone else": ({
            projectName,
            ownerUsername,
            focusColor
        }) => (
            <>
                Ce service est partagé parmi les membres du projet{" "}
                <span style={{ color: focusColor }}>{projectName}</span>
                par <span style={{ color: focusColor }}>{ownerUsername}</span>.
            </>
        ),
        "share tooltip - belong to you, shared": ({ projectName, focusColor }) => (
            <>
                Ce service est partagé parmi les membres du projet{" "}
                <span style={{ color: focusColor }}>{projectName}</span>. Cliquez pour
                arrêter le partage.
            </>
        ),
        "share tooltip - belong to you, not shared": ({ projectName, focusColor }) => (
            <>
                Vous seul pouvez accéder à ce service. Cliquez pour le partager avec les
                membres du projet <span style={{ color: focusColor }}>{projectName}</span>
                .
            </>
        )
    },
    MyServicesRestorableConfigOptions: {
        edit: "Modifier",
        "copy link": "Copier l'URL",
        "remove bookmark": "Supprimer",
        "move down": "Déplacer vers le bas",
        "move up": "Déplacer vers le haut",
        "move to top": "Déplacer tout en haut",
        "move to bottom": "Déplacer tout en bas"
    },
    MyServicesRestorableConfig: {
        edit: "Modifier",
        launch: "Lancer"
    },
    MyServicesRestorableConfigs: {
        saved: "Enregistrés",
        expand: "Développer"
    },
    ReadmeDialog: {
        ok: "ok",
        return: "Retour"
    },
    CopyOpenButton: {
        "first copy the password": "Cliquez pour copier le mot de passe...",
        "open the service": "Ouvrir le service 🚀"
    },
    MyServicesCards: {
        "running services": "Services en cours"
    },
    NoRunningService: {
        "launch one": "Clickez ici pour en lancer un",
        "no services running":
            "Vous n'avez actuellement aucun service en cours d'exécution"
    },
    CircularUsage: {
        max: "Max",
        used: "Utilisé",
        "quota card title": ({ what, isLimit }) => {
            const whatTranslated = (() => {
                switch (what) {
                    case "memory":
                        return "RAM";
                    case "cpu":
                        return "CPU";
                    case "storage":
                        return "Stockage";
                    case "count/pod":
                        return "Pods Kubernetes";
                    case "nvidia.com/gpu":
                        return "GPUs Nvidia";
                    default:
                        return capitalize(what);
                }
            })();

            return `${whatTranslated} - ${isLimit ? "Limite" : "Demandé"}`;
        }
    },
    Quotas: {
        "show more": "Afficher plus",
        "resource usage quotas": "Quotas d'utilisation des ressources",
        "current resource usage is reasonable":
            "Votre utilisation actuelle des ressources est raisonnable."
    },
    DataExplorer: {
        "page header title": "Explorateur de Données",
        "page header help title":
            "Prévisualisez vos fichiers Parquet et CSV directement depuis votre navigateur !",
        "page header help content": ({ demoParquetFileLink }) => (
            <>
                Entrez simplement l'URL <code>https://</code> ou <code>s3://</code> d'un
                fichier de données pour le prévisualiser.
                <br />
                Le fichier n'est pas entièrement téléchargé ; son contenu est diffusé au
                fur et à mesure que vous naviguez à travers les pages.
                <br />
                Vous pouvez partager un permalien vers le fichier ou même vers une ligne
                spécifique du fichier en copiant l'URL de la barre d'adresse.
                <br />
                Vous ne savez pas par où commencer ? Essayez ce{" "}
                <MuiLink {...demoParquetFileLink}>
                    fichier de démonstration
                </MuiLink> !
            </>
        ),
        column: "colonne",
        density: "densité",
        "download file": "télécharger le fichier",
        "resize table": "Redimensionner",
        "unsupported file type": ({ supportedFileTypes }) =>
            `Format de données non pris en charge. Les types pris en charge sont : ${supportedFileTypes.join(", ")}.`,
        "no s3 client":
            "Aucun client S3 configuré. Allez dans les paramètres pour en activer un pour l’explorateur.",
        "unsupported protocol":
            "URL non prise en charge. Les protocoles supportés sont https:// et s3://.",
        "https fetch error": "Impossible de récupérer le fichier HTTPS.",
        "query error": "Erreur de requête DuckDB."
    },
    UrlInput: {
        load: "Charger",
        reset: "Vider",
        "data source": "Source de données"
    },
    CommandBar: {
        ok: "ok"
    },
    formattedDate: {
        past1: ({ divisorKey }) => {
            switch (divisorKey) {
                case "now":
                    return "à l'instant";
                case "second":
                    return "il y a une seconde";
                case "minute":
                    return "il y a une minute";
                case "hour":
                    return "il y a une heure";
                case "day":
                    return "hier";
                case "week":
                    return "la semaine dernière";
                case "month":
                    return "le mois dernier";
                case "year":
                    return "l'année dernière";
            }
        },
        pastN: ({ divisorKey }) => {
            switch (divisorKey) {
                case "now":
                    return "à l'instant";
                case "second":
                    return "il y a # secondes";
                case "minute":
                    return "il y a # minutes";
                case "hour":
                    return "il y a # heures";
                case "day":
                    return "il y a # jours";
                case "week":
                    return "il y a # semaines";
                case "month":
                    return "il y a # mois";
                case "year":
                    return "il y a # ans";
            }
        },
        future1: ({ divisorKey }) => {
            switch (divisorKey) {
                case "now":
                    return "à l'instant";
                case "second":
                    return "dans une seconde";
                case "minute":
                    return "dans une minute";
                case "hour":
                    return "dans une heure";
                case "day":
                    return "demain";
                case "week":
                    return "la semaine prochaine";
                case "month":
                    return "le mois prochain";
                case "year":
                    return "l'année prochaine";
            }
        },
        futureN: ({ divisorKey }) => {
            switch (divisorKey) {
                case "now":
                    return "à l'instant";
                case "second":
                    return "dans # secondes";
                case "minute":
                    return "dans # minutes";
                case "hour":
                    return "dans # heures";
                case "day":
                    return "dans # jours";
                case "week":
                    return "dans # semaines";
                case "month":
                    return "dans # mois";
                case "year":
                    return "dans # ans";
            }
        },
        singular: ({ divisorKey }) => {
            switch (divisorKey) {
                case "second":
                    return "1 seconde";
                case "minute":
                    return "1 minute";
                case "hour":
                    return "1 heure";
                case "day":
                    return "1 jour";
                case "week":
                    return "1 semaine";
                case "month":
                    return "1 mois";
                case "year":
                    return "1 an";
            }
        },
        plural: ({ divisorKey }) => {
            switch (divisorKey) {
                case "second":
                    return "# secondes";
                case "minute":
                    return "# minutes";
                case "hour":
                    return "# heures";
                case "day":
                    return "# jours";
                case "week":
                    return "# semaines";
                case "month":
                    return "# mois";
                case "year":
                    return "# ans";
            }
        }
    },
    CopyToClipboardIconButton: {
        "copied to clipboard": "Copié !",
        "copy to clipboard": "Copier dans le presse-papiers"
    },
    CustomDataGridToolbarDensitySelector: {
        toolbarDensity: "Densité",
        toolbarDensityStandard: "Standard",
        toolbarDensityComfortable: "Confortable",
        toolbarDensityCompact: "Compact"
    },
    CustomDataGridToolbarColumnsButton: {
        toolbarColumnsLabel: "Colonnes"
    },
    CustomDataGrid: {
        "empty directory": "Ce répertoire est vide",
        "label rows count": ({ count }) => {
            const plural = count > 1 ? "s" : "";
            return `${count} élément${plural} sélectionnée${plural}`;
        },
        "label rows per page": "Éléments par page"
    },
    DatasetCard: {
        publishedOn: "Publié le",
        datasetPage: "Page du jeu de données",
        license: "Licence :",
        format: "Format",
        size: "Taille",
        distributions: "Distributions",
        visualize: "Visualiser",
        unknown: "Inconnu"
    },
    DataCollection: {
        "page header help title":
            "Entrez simplement l'URL https:// de votre schema jsonld dcat",
        "page header title": "Catalogue de données",
        "page header help content": ({ demoCatalogLink }) => (
            <>
                Entrez simplement l'URL <code>https://</code> d'un catalogue de données
                pour le prévisualiser.
                <br />
                Vous ne savez pas par où commencer ? Essayez ce{" "}
                <MuiLink {...demoCatalogLink}>catalogue de démonstration</MuiLink> !
            </>
        ),
        "https fetch error": "Impossible de récupérer la ressource HTTPS.",
        "invalid json response": "La réponse n'est pas un JSON valide.",
        "json-ld compact error": "Impossible de compacter la réponse JSON-LD.",
        "json-ld frame error": "Impossible de structurer la réponse JSON-LD.",
        "datasets parsing error":
            "Impossible d'analyser les jeux de données du catalogue."
    },
    S3UriBar: {
        explore: "Explorer..",
        "copy s3 path": "Copier le chemin S3",
        copied: "Copié",
        "copied path": ({ s3Uri }) => `Chemin copié : ${s3Uri}`,
        "add to bookmarks": "Ajouter aux favoris",
        "delete from bookmarks": "Supprimer des favoris",
        bookmarked: "Dans les favoris",
        "edit s3 uri": "Modifier l'URI S3",
        prefix: "Préfixe",
        "admin bookmark": "Favori administrateur",
        bookmark: "Favori",
        object: "Objet",
        public: "Public",
        "go to s3 uri": ({ s3Uri, isPublic }) =>
            `${isPublic ? "Public. " : ""}Aller à ${s3Uri}`,
        "s3 uri": "S3 URI",
        "edit from s3 root": "Modifier depuis la racine S3",
        "edit object key": "Modifier la clé de l'objet",
        "object key": "Clé de l'objet",
        listing: "Chargement de la liste..."
    }
};
