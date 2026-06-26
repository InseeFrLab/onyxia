import MuiLink from "@mui/material/Link";
import { Markdown } from "ui/shared/Markdown";
import type { Translations } from "../types";
import { Icon } from "onyxia-ui/Icon";
import { getIconUrlByName } from "lazy-icons";
import { capitalize } from "tsafe/capitalize";
import { MaybeLink } from "ui/shared/MaybeLink";

export const translations: Translations<"es"> = {
    /* spell-checker: disable */
    Account: {
        profile: "Perfil",
        git: "Git",
        k8sCodeSnippets: "Kubernetes",
        "user-interface": "Preferencias de interfaz",
        text1: "Mi cuenta",
        text2: "Accede a tu diversa información de cuenta.",
        text3: "Configura tus nombres de usuario, correos electrónicos, contraseñas y tokens de acceso personal directamente conectados a tus servicios.",
        "personal tokens tooltip":
            "Contraseñas que se generan para ti y que tienen un período de validez determinado",
        vault: "Vault",
        ai: "IA"
    },
    AccountProfileTab: {
        "account id": "Identificador de cuenta",
        "account id helper":
            "Tus identificadores intangibles vinculados a la identidad que utilizas para iniciar sesión en la plataforma",
        "user id": "ID de usuario",
        email: "Correo electrónico",
        "account management": "Gestión de cuenta"
    },
    UserProfileForm: {
        "customizable profile": "Perfil personalizable",
        "customizable profile helper":
            "Información útil para la configuración automática de sus servicios",
        save: "Guardar",
        restore: "Restaurar"
    },
    ConfirmNavigationDialog: {
        "you have unsaved changes": "¡Tienes cambios sin guardar!",
        cancel: "Cancelar",
        "continue without saving": "Continuar sin guardar"
    },
    AccountGitTab: {
        gitName: "Nombre de usuario para Git",
        "gitName helper text": ({ gitName, focusClassName }) => (
            <>
                Este comando establecerá tu nombre de usuario global de Git, ejecutado al
                inicio del servicio:&nbsp;
                <code className={focusClassName}>
                    git config --global user.name "{gitName || "<tu_nombre_de_usuario>"}"
                </code>
            </>
        ),
        gitEmail: "Correo electrónico para Git",
        "gitEmail helper text": ({ gitEmail, focusClassName }) => (
            <>
                Este comando establecerá tu correo electrónico global de Git, ejecutado al
                inicio del servicio:&nbsp;
                <code className={focusClassName}>
                    git config --global user.email "{gitEmail || "<tu_correo@dominio.es>"}
                    "
                </code>
            </>
        ),
        githubPersonalAccessToken: "Token de acceso personal para Git Forge",
        "githubPersonalAccessToken helper text": ({ focusClassName }) => (
            <>
                Al proporcionar este token, puedes clonar y enviar a tus repositorios
                privados de GitHub o GitLab sin volver a ingresar las credenciales de tu
                forge cada vez.
                <br />
                Este token también estará disponible como una variable de entorno:&nbsp;
                <span className={focusClassName}>$GIT_PERSONAL_ACCESS_TOKEN</span>
            </>
        )
    },
    AccountKubernetesTab: {
        "credentials section title": "Conéctate al clúster de Kubernetes",
        "credentials section helper":
            "Credenciales para interactuar directamente con el servidor API de Kubernetes.",
        "init script section title": "Script de Shell",
        "init script section helper": ({ installKubectlUrl }) => (
            <>
                Este script permite usar kubectl o helm en tu máquina local. <br />
                Para usarlo, simplemente{" "}
                <MuiLink href={installKubectlUrl} target="_blank">
                    instala kubectl en tu máquina
                </MuiLink>{" "}
                y ejecuta el script copiándolo y pegándolo en tu terminal.
                <br />
                Después de hacerlo, puedes confirmar que funciona ejecutando el
                comando&nbsp;
                <code>kubectl get pods</code> o <code>helm list</code>
            </>
        ),
        "expires in": ({ howMuchTime }) =>
            `Estas credenciales son válidas por los próximos ${howMuchTime}`
    },
    AccountAiGatewayTab: {
        "credentials section title": "Credenciales de la pasarela de IA",
        "credentials section helper": ({ webUiUrl }) => (
            <>
                Su sesión OIDC le da acceso sin interrupciones a la pasarela de IA.{" "}
                <MuiLink href={webUiUrl} target="_blank">
                    Abrir pasarela de IA
                </MuiLink>
            </>
        ),
        "api base url": "URL base de la API",
        token: "Token",
        "model label": "Modelo",
        "gateway error": "No se pudo inicializar la pasarela de IA.",
        "use in services": "Usar en sus servicios",
        "custom providers section title": "Proveedores de IA personalizados",
        "custom providers section helper":
            "Añade tus propios proveedores de IA compatibles con OpenAI. Las credenciales se almacenan en tu navegador.",
        "edit custom provider title": "Editar proveedor de IA",
        "custom provider label field": "Etiqueta",
        "custom provider type field": "Tipo de proveedor",
        "custom provider api base field": "URL base de la API",
        "custom provider api key field": "Clave API",
        "provider test": "Probar conexión",
        "provider test success": "Conexión exitosa",
        "provider test error": "No se puede conectar — compruebe la URL y la clave API.",
        "provider save": "Añadir",
        "provider update": "Guardar",
        "provider cancel": "Cancelar",
        "models fetch error":
            "No se pueden obtener los modelos — compruebe la URL y la clave API.",
        "no account": ({ webUiUrl }) => (
            <>
                Aún no tiene una cuenta en la pasarela de IA. Por favor, inicie sesión
                primero en{" "}
                <MuiLink href={webUiUrl} target="_blank">
                    {webUiUrl}
                </MuiLink>{" "}
                para crear su cuenta.
            </>
        )
    },
    AccountVaultTab: {
        "credentials section title": "Credenciales de Vault",
        "credentials section helper": ({ vaultDocHref, mySecretLink }) => (
            <>
                <MuiLink href={vaultDocHref} target="_blank">
                    Vault
                </MuiLink>{" "}
                es el sistema donde &nbsp;
                <MuiLink {...mySecretLink}>tus secretos</MuiLink> se almacenan.
            </>
        ),
        "init script section title": "Usar vault desde tu terminal",
        "init script section helper": ({ vaultCliDocLink }) => (
            <>
                Descarga o copia las variables <code>ENV</code> que configuran tu{" "}
                <MuiLink href={vaultCliDocLink} target="_blank">
                    Vault CLI local
                </MuiLink>
            </>
        ),
        "expires in": ({ howMuchTime }) => `El token expira ${howMuchTime}`
    },
    AccountUserInterfaceTab: {
        title: "Preferencias de la interfaz",
        "enable dark mode": "Activar modo oscuro",
        "dark mode helper": "Tema de interfaz de baja luz con fondo de color oscuro.",
        "enable beta": "Activar modo beta",
        "beta mode helper":
            "Para configuraciones y características avanzadas de la plataforma.",
        "enable dev mode": "Activar modo desarrollador",
        "dev mode helper":
            "Habilita funciones que están siendo desarrolladas actualmente",
        "Enable command bar": "Barra de comandos",
        "Enable command bar helper": ({ imgUrl }) => (
            <>
                La{" "}
                <MuiLink href={imgUrl} target="_blank">
                    barra de comandos
                </MuiLink>{" "}
                te da información sobre los comandos ejecutados en tu nombre cuando
                interactúas con la interfaz de usuario.
            </>
        )
    },
    SettingField: {
        "copy tooltip": "Copiar al portapapeles",
        language: "Cambiar idioma",
        "service password": "Contraseña predeterminada del servicio",
        "service password helper text": ({ groupProjectName }) => (
            <>
                Esta es la contraseña predeterminada utilizada para proteger tus servicios
                en ejecución. <br />
                Cuando inicias un servicio, el campo de contraseña de la pestaña de
                seguridad se llena previamente con esta contraseña. <br />
                Hacer clic en el{" "}
                <Icon size="extra small" icon={getIconUrlByName("Refresh")} /> ícono
                generará una nueva contraseña aleatoria. Sin embargo, ten en cuenta que no
                actualizará la contraseña para los servicios que están actualmente en
                ejecución. <br />
                La contraseña del servicio es la que Onyxia te hace copiar en tu
                portapapeles antes de acceder a un servicio en ejecución. <br />
                {groupProjectName !== undefined && (
                    <>
                        Ten en cuenta que esta contraseña se comparte entre todos los
                        miembros del proyecto ({groupProjectName}).
                    </>
                )}
            </>
        ),
        "not yet defined": "Aún no definido",
        "reset helper dialogs": "Restablecer ventanas de instrucciones",
        reset: "Restablecer",
        "reset helper dialogs helper text":
            "Restablecer ventanas de mensajes que se han solicitado no mostrar nuevamente"
    },
    ConfirmBucketCreationAttemptDialog: {
        "bucket does not exist title": ({ bucket }) => `El bucket ${bucket} no existe`,
        "bucket does not exist body": "¿Quieres intentar crearlo ahora?",
        no: "No",
        yes: "Sí",
        "success title": "Éxito",
        "failed title": "Error",
        "success body": ({ bucket }) => `Bucket ${bucket} creado correctamente.`,
        "failed body": ({ bucket }) => `No se pudo crear ${bucket}.`,
        ok: "Ok"
    },
    ConfirmOverwriteDialog: {
        "dialog title": "El archivo ya existe",
        "dialog body": "¿Desea sobrescribir el archivo existente?",
        "no, keep the existing file": "No, conservar el archivo existente",
        "yes, overwrite": "Sí, sobrescribir"
    },
    ConfirmCustomS3ConfigDeletionDialog: {
        "dialog title": "¿Confirmar la eliminación de la configuración S3 personalizada?",
        cancel: "Cancelar",
        yes: "Sí"
    },
    DisplayErrorDialog: {
        error: "Error",
        ok: "Ok"
    },
    S3Explorer: {
        "page header title": "Almacenamiento de datos",
        "create profile": "Crear perfil",
        back: "Atrás",
        upload: "Subir",
        "create new folder": "Crear nueva carpeta",
        "download file": "Descargar archivo"
    },
    S3ShareObjectDialogContainer: {
        "dialog title": "Compartir objeto"
    },
    S3BookmarksBar: {
        "s3 bookmarks aria label": "Marcadores S3",
        "show more bookmarks": "Mostrar más marcadores"
    },
    S3BookmarkItem: {
        "open bookmark": "Abrir marcador",
        "open bucket": "Abrir bucket",
        "bookmark actions": "Acciones del marcador",
        rename: "Renombrar",
        delete: "Eliminar",
        "rename bookmark": "Renombrar marcador",
        "delete bookmark": "Eliminar marcador"
    },
    S3BookmarksEntryPointList: {
        "s3 bookmark entry points aria label": "Entradas de marcadores S3",
        bookmarks: "Marcadores",
        "no bookmarks yet": "Aún no hay marcadores.",
        "storage locations": "Ubicaciones de almacenamiento"
    },
    S3DialogCopyField: {
        "generating url": "Generando URL...",
        copy: "Copiar",
        copied: "Copiado"
    },
    S3DialogItemSummary: {
        public: "Público"
    },
    S3ProfileSelect: {
        "select s3 profile aria label": "Seleccionar perfil S3",
        "profile settings aria label": "Configuración del perfil",
        "s3 profiles aria label": "Perfiles S3",
        "new s3 profile": "Nuevo perfil S3"
    },
    S3SelectionActionBar: {
        download: "Descargar",
        delete: "Eliminar",
        "copy s3 uri": "Copiar URI S3",
        copied: "Copiado",
        "copy s3 uri tooltip": ({ s3UriStr }) => `Copiar "${s3UriStr}"`,
        "add to bookmarks": "Añadir a marcadores",
        "delete from bookmarks": "Eliminar de marcadores",
        share: "Compartir",
        "make public": "Hacer público",
        "make private": "Hacer privado",
        "one selected": "1 seleccionado",
        "many selected": ({ count }) => `${count} seleccionados`,
        "clear selection": "Limpiar selección"
    },
    ConfirmAbortUploadDialog: {
        "dialog title": "¿Cancelar subida?",
        "dialog body": "La subida no se ha completado. ¿Quieres cancelarla?",
        "continue upload": "Continuar subida",
        "cancel upload": "Cancelar subida"
    },
    S3Uploads: {
        "uploading count": ({ count }) =>
            `Subiendo ${count} elemento${count === 1 ? "" : "s"}...`,
        "upload count": ({ count }) => `${count} subida${count === 1 ? "" : "s"}`,
        "expand uploads": "Expandir subidas",
        "collapse uploads": "Contraer subidas",
        "close uploads": "Cerrar subidas",
        "uploading status": "Subiendo...",
        completed: "Completado",
        error: "Error",
        "uploaded size of total size": ({ uploadedSize, totalSize }) =>
            `${uploadedSize} de ${totalSize}`,
        of: "de",
        "open uploaded directory": "Abrir directorio subido",
        "cancel upload": "Cancelar subida",
        "retry upload": "Reintentar subida"
    },
    CustomNoRowsOverlay: {
        "no rows": "Sin filas"
    },
    DataTextEditor: {
        "not a valid format": ({ format }) => `No es un formato válido: ${format}`,
        format: "Formato",
        "all defaults": "Todos los valores predeterminados",
        schema: "Esquema"
    },
    JsonSchemaDialog: {
        "json schema": "Esquema JSON",
        ok: "Ok"
    },
    SelectFormField: {
        "empty string": "(Cadena vacía)"
    },
    CreateOrRenameBookmarkDialog: {
        "dialog title": "Nombre del marcador",
        "add dialog title": "Añadir esta ubicación a los marcadores",
        "rename dialog title": "Renombrar marcador",
        "dialog subtitle":
            "Guarda esta ubicación S3 para acceder a ella más rápido más tarde.",
        "bookmarkName textField label": "Nombre",
        "bookmarkName textField empty error":
            "El nombre del marcador no puede estar vacío",
        "copy s3 path aria label": "Copiar ruta S3",
        cancel: "Cancelar",
        ok: "Ok",
        "add to bookmarks": "Añadir a marcadores",
        "rename bookmark": "Renombrar marcador"
    },
    DirectoryCreationDialog: {
        "dialog title": "Crear una carpeta",
        "dialog subtitle": "Crear un prefijo similar a una carpeta en esta ubicación",
        "dialog body":
            "S3 no almacena las carpetas como objetos reales. Esta acción solo abre un nuevo segmento de prefijo desde la ubicación actual, para que puedas subir objetos allí. La carpeta aparecerá cuando exista al menos un objeto con ese prefijo; las carpetas vacías no existen en S3.",
        "folderName textField label": "Nombre de la carpeta",
        "folderName textField empty error":
            "El nombre de la carpeta no puede estar vacío",
        "folderName textField duplicate error": "El nombre de la carpeta ya existe",
        cancel: "Cancelar",
        "create folder": "Crear carpeta"
    },
    MakePrefixPublicDialog: {
        "dialog title": "Hacer público el prefijo",
        "make public dialog title": "¿Hacer público este prefijo?",
        "make private dialog title": "¿Hacer privado este prefijo?",
        "make public dialog body main":
            "Todos los archivos de este prefijo serán accesibles para cualquier persona con un enlace, incluido el contenido actual y futuro.",
        "make public dialog body alternative":
            "Para compartir archivos específicos o limitar el acceso en el tiempo, crea un enlace de uso compartido en su lugar.",
        "make private dialog body main":
            "Todos los archivos de este prefijo son accesibles para cualquier persona con un enlace, incluido el contenido actual y futuro. Al hacer privado este prefijo se elimina el acceso público.",
        "make private dialog body alternative":
            "Para compartir archivos específicos o limitar el acceso en el tiempo, crea un enlace de uso compartido en su lugar.",
        "dialog body": ({ s3Uri, s3UriClassName }) => (
            <>
                Estás a punto de hacer público{" "}
                <span className={s3UriClassName}>{s3Uri}</span>. Cualquiera podrá listar y
                descargar todos los objetos actuales y futuros de este prefijo.
                <br />
                <br />
                Los enlaces de descarga que compartas para objetos de este prefijo nunca
                expirarán.
            </>
        ),
        cancel: "Cancelar",
        "make public": "Hacer público",
        "make private": "Hacer privado"
    },
    S3ExplorerMainView: {
        "create prefix dialog title": "Crear prefijo",
        "create prefix dialog subtitle":
            "Crea un nuevo prefijo dentro de la ubicación S3 actual.",
        "prefix name field label": "Nombre del prefijo",
        "prefix name empty error": "El nombre del prefijo no puede estar vacío.",
        cancel: "Cancelar",
        "create prefix": "Crear prefijo",
        "delete selection dialog title": "Eliminar selección",
        "delete selection dialog subtitle":
            "Esta acción elimina permanentemente los elementos seleccionados.",
        "delete selection dialog body": ({ count }) =>
            `Estás a punto de eliminar ${count} elemento${count > 1 ? "s" : ""} seleccionado${count > 1 ? "s" : ""}. Eliminar un prefijo también elimina todo su contenido.`,
        delete: "Eliminar",
        share: "Compartir",
        download: "Descargar",
        "copy s3 uri": "Copiar URI S3",
        copied: "Copiado",
        "copy s3 uri tooltip": ({ s3UriStr }) => `Copiar "${s3UriStr}"`,
        "add to bookmarks": "Añadir a marcadores",
        "delete from bookmarks": "Eliminar de marcadores",
        "make public": "Hacer público",
        "make private": "Hacer privado",
        folder: "Carpeta",
        object: "Objeto",
        "folder is public": "La carpeta es pública",
        "folder is private": "La carpeta es privada",
        today: "Hoy",
        yesterday: "Ayer",
        "access denied": "Acceso denegado",
        "bucket not found": "Bucket no encontrado",
        "access denied description": "No tienes permiso para listar esta ubicación S3.",
        "bucket not found description":
            "El bucket solicitado no existe o no es accesible con el perfil actual.",
        "select item": ({ itemName }) => `Seleccionar ${itemName}`,
        "select all items": "Seleccionar todos los elementos",
        public: "Público",
        deleting: "Eliminando...",
        uploading: "Subiendo",
        "drag and drop to import files": "Arrastra y suelta para importar archivos",
        "go back": "Volver",
        "no objects found": "No se encontraron objetos",
        "no objects found description": ({ s3UriStr }) =>
            `No hay objetos cuya clave empiece por "${s3UriStr}".`,
        "this prefix is empty": "Este prefijo está vacío",
        "empty prefix description":
            "Sube archivos o crea una carpeta para empezar a llenar esta ubicación.",
        "empty prefix upload description":
            "Sube archivos aquí o arrástralos y suéltalos en esta zona.",
        "upload files": "Subir archivos",
        "upload files here": "Subir archivos aquí",
        "drop files here hint":
            "Suelta archivos en cualquier lugar de esta zona para subirlos.",
        "new folder": "Nueva carpeta",
        name: "Nombre",
        "last modified": "Última modificación",
        size: "Tamaño"
    },
    S3ShareObjectDialog: {
        "generating public URL": "Generando URL pública...",
        "copy public URL aria label": "Copiar URL pública",
        "signed URL with limited validity period":
            "URL firmada con periodo de validez limitado",
        "signed link validity aria label": "Duración de validez del enlace firmado",
        "generating signed URL": "Generando URL firmada...",
        "copy signed URL aria label": "Copiar URL firmada",
        "public sharing note":
            "Cualquier persona con la URL puede acceder a este objeto. El enlace nunca expira porque el objeto está dentro de un prefijo público.",
        "signed URL expiration note":
            "Para compartir una URL que no expire, haz público uno de los prefijos superiores de este objeto.",
        "validity duration one hour": "1 hora",
        "validity duration one day": "1 día",
        "validity duration one week": "1 semana",
        "selected duration": "la duración seleccionada"
    },
    S3ProfileDialog: {
        "detail title": "Detalle del perfil S3",
        "create title": "Nuevo perfil S3 personalizado",
        "edit title": "Editar perfil S3 personalizado",
        "close aria label": "Cerrar diálogo de perfil S3"
    },
    S3ProfileDetails: {
        "read only": "Solo lectura",
        custom: "Personalizado",
        edit: "Editar",
        delete: "Eliminar",
        "connection details title": "Detalles de conexión",
        "connection details subtitle":
            "Usa estos valores al configurar clientes S3 fuera del explorador.",
        "endpoint url label": "URL del endpoint",
        "default region label": "Región predeterminada",
        "access credentials title": "Credenciales de acceso",
        "access credentials anonymous subtitle":
            "Este perfil no expone credenciales. Usa acceso S3 anónimo cuando el bucket de destino lo permita.",
        "access credentials subtitle":
            "Copia el valor requerido por el cliente que estás configurando.",
        "access key id label": "ID de clave de acceso",
        "secret access key label": "Clave de acceso secreta",
        "session token label": "Token de sesión",
        "environment variable": "Variable de entorno",
        "no expiration": "No se anuncia tiempo de expiración para estas credenciales.",
        expires: ({ expirationTime }) => `Expira el ${expirationTime}.`,
        renewing: "Renovando...",
        "renew tokens": "Renovar tokens",
        "init script title":
            "Para acceder a tu almacenamiento fuera de los servicios Datalab",
        "init script subtitle":
            "Descarga o copia el script de inicialización en el lenguaje de programación que prefieras.",
        "technology aria label": "Tecnología",
        download: "Descargar",
        "select s3 profile aria label": "Seleccionar perfil S3",
        "s3 profiles aria label": "Perfiles S3",
        "new s3 profile": "Nuevo perfil S3",
        "copy aria label": ({ what }) => `Copiar ${what}`,
        copied: "Copiado",
        copy: "Copiar"
    },
    S3ProfileForm: {
        "must be an url": "Introduce una URL válida.",
        "is required": "Este campo es obligatorio.",
        "not a valid access key id": "Introduce un ID de clave de acceso válido.",
        "profile name already used": "Este nombre de perfil ya está en uso.",
        "connection details title": "Detalles de conexión",
        "connection details subtitle":
            "Define el nombre del perfil y el endpoint S3 usados por el explorador.",
        "profile name label": "Nombre del perfil",
        "s3 service url label": "URL del servicio S3",
        "s3 service url helper": "Ejemplo: https://minio.lab.example.net",
        "default region label": "Región predeterminada",
        "default region helper": "Ejemplo: eu-west-1, si no estás seguro, déjalo vacío",
        "url style title": "Estilo de URL",
        "url style subtitle":
            "Especifica cómo tu servidor S3 formatea la URL para descargar archivos.",
        "path style": "Estilo de ruta",
        "virtual hosted style": "Estilo virtual-hosted",
        example: "Ejemplo",
        "account credentials title": "Credenciales de cuenta",
        "account credentials subtitle":
            "Elige si este perfil usa acceso anónimo o credenciales explícitas.",
        "anonymous access": "Acceso anónimo",
        "access key id label": "ID de clave de acceso",
        "access key id helper": "Ejemplo: ASIAIOSFODNN7EXAMPLE",
        "secret access key label": "Clave de acceso secreta",
        "secret access key helper": "Ejemplo: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
        "session token label": "Token de sesión",
        "session token helper":
            "Opcional. Déjalo vacío si tus credenciales no incluyen un token de sesión.",
        cancel: "Cancelar",
        "save configuration": "Guardar configuración",
        "create profile": "Crear perfil"
    },
    MySecrets: {
        "page title - my secrets": "Mis Secretos",
        "what this page is used for - my secrets":
            "Aquí se pueden definir variables que serán accesibles en tus servicios en forma de variables de entorno.",
        "learn more - my files": "Para saber más sobre la gestión de archivos,",
        "help content": ({ accountTabLink, docHref }) => (
            <>
                Lee{" "}
                <MuiLink href={docHref} target="_blank">
                    nuestra documentación
                </MuiLink>
                . &nbsp;
                <MuiLink {...accountTabLink}>
                    Configura tu Vault CLI local
                </MuiLink>.
            </>
        )
    },
    SecretsExplorerItem: {
        description: "descripción"
    },
    SecretsExplorerButtonBar: {
        secret: "secreto",
        rename: "renombrar",
        delete: "eliminar",
        "create secret": "Crear secreto",
        "copy path": "Usar en un servicio",
        "create new empty directory": "Crear directorio",
        refresh: "refrescar",
        "create what": ({ what }) => `Crear ${what}`,
        new: "Nuevo"
    },
    SecretsExplorerItems: {
        "empty directory": "Este directorio está vacío"
    },
    SecretsExplorer: {
        file: "archivo",
        secret: "secreto",
        create: "crear",
        cancel: "cancelar",
        delete: "eliminar",
        "do not display again": "No mostrar de nuevo",

        "untitled what": ({ what }) => `sin_título_${what}`,
        directory: "carpeta",
        "deletion dialog title": ({ deleteWhat }) => `¿Eliminar un ${deleteWhat} ?`,
        "deletion dialog body": ({
            deleteWhat
        }) => `Estás a punto de eliminar ${deleteWhat}.
            Esta acción no se puede revertir.`,
        "already a directory with this name": "Ya existe una carpeta con este nombre",
        "can't be empty": "No puede estar vacío",
        "new directory": "Nueva carpeta"
    },
    MySecretsEditor: {
        "do not display again": "No mostrar de nuevo",
        "add an entry": "Agregar una nueva variable",
        "environnement variable default name": "NUEVA_VAR",
        "table of secret": "tabla de secreto",

        "key column name": "Nombre de la variable",
        "value column name": "Valor",
        "unavailable key": "Ya utilizado",
        "invalid key empty string": "Nombre requerido",
        "invalid key _ not valid": "No puede ser solo _",
        "invalid key start with digit": "No puede empezar con un dígito",
        "invalid key invalid character": "Carácter inválido",
        "use this secret": `Usar en servicios`,
        "use secret dialog title": "Usar en un servicio",
        "use secret dialog subtitle": "Se ha copiado la ruta del secreto",
        "use secret dialog body": `
                Cuando inicies un servicio (RStudio, Jupyter, etc.) ve a la
                pestaña de secretos y pega la ruta del secreto proporcionada para este
                propósito.
                Los valores se inyectarán como variables de entorno.
            `,
        "use secret dialog ok": "Entendido"
    },
    MySecretsEditorRow: {
        "key input desc": "Nombre de la variable de entorno",
        "value input desc": "Valor de la variable de entorno"
    },
    Header: {
        login: "Iniciar sesión",
        logout: "Cerrar sesión",
        region: "Región"
    },
    ProjectSelect: {
        project: "Proyecto"
    },
    LeftBar: {
        reduce: "Reducir",
        home: "Inicio",
        account: "Mi cuenta",
        catalog: "Catálogo de servicios",
        myServices: "Mis servicios",
        mySecrets: "Mis secretos",
        "divider: services features": "Funciones de los servicios",
        "divider: external services features": "Funciones de los servicios externos",
        "divider: onyxia instance specific features":
            "Funciones específicas de la instancia de Onyxia",
        dataExplorer: "Explorador de datos",
        dataCollection: "Explorador de colecciones",
        s3Explorer: "Almacenamiento de datos",
        sqlOlapShell: "SQL Olap Shell"
    },
    AutoLogoutCountdown: {
        "are you still there": "¿Sigues ahí?",
        "you'll soon be automatically logged out":
            "Serás desconectado automáticamente pronto."
    },
    Page404: {
        "not found": "Página no encontrada"
    },
    PortraitModeUnsupported: {
        instructions:
            "Para usar esta aplicación en tu teléfono, por favor activa el sensor de rotación y gira tu teléfono."
    },
    MaybeAcknowledgeConfigVolatilityDialog: {
        "dialog title": "Ten en cuenta que las configuraciones son volátiles",
        "dialog body": `Esta instancia de Onyxia no implementa ningún mecanismo de persistencia para almacenar configuraciones. 
            Todas las configuraciones se almacenan en el almacenamiento local del navegador. Esto significa que si borras el almacenamiento local 
            del navegador o cambias de navegador, perderás todas tus configuraciones.`,
        "do not show next time": "No mostrar este mensaje de nuevo",
        cancel: "Cancelar",
        "I understand": "Entiendo"
    },
    Home: {
        "title authenticated": ({ userFirstname }) => `¡Bienvenido ${userFirstname}!`,
        title: "Bienvenido al datalab de Onyxia",
        "new user": "¿Eres nuevo en el datalab?",
        login: "Iniciar sesión",
        subtitle:
            "¡Trabaja con Python o R, disfruta de toda la potencia de cálculo que necesitas!",
        cardTitle1: "Un entorno ergonómico y servicios bajo demanda",
        cardTitle2: "Una comunidad activa y entusiasta a tu servicio",
        cardTitle3: "Almacenamiento de datos rápido, flexible y en línea",
        cardText1:
            "Analiza datos, realiza cálculos distribuidos y aprovecha un amplio catálogo de servicios. Reserva la potencia de cálculo que necesites.",
        cardText2:
            "Utiliza y comparte los recursos disponibles para ti: tutoriales, formación y canales de intercambio.",
        cardText3:
            "Para acceder fácilmente a tus datos y a los que se ponen a tu disposición desde tus programas: implementación de la API de S3",
        cardButton1: "Consultar el catálogo",
        cardButton2: "Unirse a la comunidad",
        cardButton3: "Consultar los datos"
    },
    Catalog: {
        header: "Catálogo de servicios",
        "no result found": ({ forWhat }) =>
            `No se encontraron resultados para ${forWhat}`,
        "search results": "Resultado de la búsqueda",
        search: "Buscar",
        "title all catalog": "Todos"
    },
    CatalogChartCard: {
        launch: "Iniciar",
        "learn more": "Saber más"
    },
    CatalogNoSearchMatches: {
        "no service found": "No se encontraron servicios",
        "no result found": ({ forWhat }) =>
            `No se encontraron resultados para ${forWhat}`,
        "check spelling":
            "Por favor, verifica la ortografía o intenta ampliar tu búsqueda.",
        "go back": "Volver a los servicios principales"
    },
    Launcher: {
        sources: ({
            helmChartName,
            helmChartRepositoryName,
            labeledHelmChartSourceUrls
        }) => (
            <>
                El chart de Helm{" "}
                {
                    <MaybeLink href={labeledHelmChartSourceUrls.helmChartSourceUrl}>
                        {helmChartName}
                    </MaybeLink>
                }{" "}
                pertenece al repositorio de charts de Helm{" "}
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
                        Está basado en la imagen de Docker{" "}
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
        "download as script": "Descargar como script",
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
            >{`Hemos diseñado la barra de comandos para empoderarte y que tengas el control sobre tus implementaciones de Kubernetes. 
    Aquí tienes lo que necesitas saber:
    
    #### ¿Qué son esos Comandos Helm?  
    
    Estos comandos son exactamente los comandos Helm que la API de Onyxia ejecutará en tu nombre en tu espacio de nombres de Kubernetes.  
    Esto te permite saber qué está sucediendo detrás de escena cuando interactúas con la interfaz de usuario.  
    
    #### Actualizaciones en tiempo real  
    
    A medida que interactúas con la interfaz de usuario, los comandos Helm se actualizarán automáticamente para reflejar lo que estás haciendo.  
    
    #### ¿Por qué debería importarme?  
    
    - **Transparencia:** Creemos que tienes derecho a saber qué acciones se están realizando en tu entorno.  
    - **Aprendizaje:** Comprender estos comandos puede proporcionar una visión de Kubernetes y Helm, profundizando tus conocimientos.  
    - **Ejecución manual:** Puedes copiar y pegar esos comandos en un terminal con acceso de escritura a Kubernetes, lo que te permite lanzar el servicio manualmente.  
    
    #### ¿Cómo puedo ejecutar esos comandos manualmente?  
    
    ${k8CredentialsHref === undefined ? "" : "Hay dos formas de ejecutar estos comandos:  "}  
    
    ${
        k8CredentialsHref === undefined
            ? ""
            : `
    - **Terminal local:** Ve a [\`Mi cuenta -> Kubernetes\`](${k8CredentialsHref}).  
      Aquí encontrarás las credenciales que te permiten ejecutar comandos en tu espacio de nombres de Kubernetes desde tu terminal local.  
    `
    }
    
    - Si esta instancia de Onyxia cuenta con servicios VSCode o Jupyter, puedes abrir un terminal dentro de estos servicios y ejecutar comandos allí.  
      Para comandos constructivos o destructivos necesitarás lanzar tu servicio con el rol de Kubernetes \`admin\` o \`edit\`.  
    
    Al ejecutar el comando manualmente, aún podrás ver el servicio en la página [\`Mis servicios\`](${myServicesHref}) como si se hubiera lanzado a través de la interfaz de usuario.  
    
    Puedes desactivar la barra de comandos en la [\`Mi cuenta -> Preferencias de interfaz\`](${interfacePreferenceHref}).
    
    ¡Siéntete libre de explorar y tomar el control de tus implementaciones de Kubernetes!
            `}</Markdown>
        ),
        form: "Formulario",
        editor: "Editor de texto"
    },
    AcknowledgeSharingOfConfigConfirmDialog: {
        "acknowledge sharing of config confirm dialog title":
            "Ten en cuenta que las configuraciones se comparten",
        "acknowledge sharing of config confirm dialog subtitle": ({ groupProjectName }) =>
            `Si guardas esta configuración, todos los miembros del proyecto ${groupProjectName} podrán lanzarla.`,
        "acknowledge sharing of config confirm dialog body": `Aunque Onyxia no haya inyectado automáticamente ninguna información personal, ten en cuenta no compartir ninguna información sensible en la configuración compartida y restaurable.`,
        cancel: "Cancelar",
        "i understand, proceed": "Entiendo, proceder"
    },
    AutoLaunchDisabledDialog: {
        "auto launch disabled dialog title":
            "Función de inicio automático desactivada en esta instancia de Onyxia",
        "auto launch disabled dialog body": (
            <>
                <b>ADVERTENCIA</b>: Alguien podría intentar engañarte para que lances un
                servicio que podría comprometer la integridad de tu espacio de nombres.
                <br />
                Por favor, revisa cuidadosamente la configuración del servicio antes de
                lanzarlo.
                <br />
                Si tienes alguna duda, por favor contacta a tu administrador.
            </>
        ),
        ok: "Ok"
    },
    FormFieldWrapper: {
        "reset to default": "Restablecer a los valores predeterminados"
    },
    ConfigurationTopLevelGroup: {
        global: "global",
        miscellaneous: "Varios",
        "Configuration that applies to all charts":
            "Configuración que se aplica a todos los gráficos",
        "Top level configuration values": "Valores de configuración de nivel superior"
    },
    YamlCodeBlockFormField: {
        "not an array": "Se espera un arreglo",
        "not an object": "Se espera un objeto",
        "not valid yaml": "YAML/JSON no válido"
    },
    TextFormField: {
        "not matching pattern": ({ pattern }) => `No coincide con el patrón ${pattern}`,
        "toggle password visibility": "Alternar la visibilidad de la contraseña",
        loading: "Cargando..."
    },
    FormFieldGroupComponent: {
        add: "Añadir"
    },
    AutoInjectSwitch: {
        tooltip: ({ isAutoInjected }) => (
            <>
                Si está activado, esta configuración se inyectará automáticamente en tus
                servicios. Aun así, puedes añadirla manualmente al iniciar un servicio,
                incluso si esta opción permanece desactivada.
                <br />
                <br />
                Estado actual:{" "}
                <strong>{isAutoInjected ? "activado" : "desactivado"}</strong>
            </>
        )
    },
    NumberFormField: {
        "below minimum": ({ minimum }) => `Debe ser mayor o igual a ${minimum}`,
        "not a number": "No es un número",
        "not an integer": "No es un número entero"
    },
    NoLongerBookmarkedDialog: {
        "no longer bookmarked dialog title": "Tus cambios no se guardarán",
        "no longer bookmarked dialog body":
            "Haz clic en el icono de marcador nuevamente para actualizar tu configuración guardada",
        ok: "Ok"
    },
    MyService: {
        "page title": ({ helmReleaseFriendlyName }) =>
            `Monitoreo de ${helmReleaseFriendlyName}`
    },
    PodLogsTab: {
        "not necessarily first logs":
            "Estos no son necesariamente los primeros registros, los registros más antiguos podrían haber sido eliminados",
        "new logs are displayed in realtime":
            "Los nuevos registros se muestran en tiempo real",
        follow: "Seguir"
    },
    MyServiceButtonBar: {
        back: "Volver",
        "external monitoring": "Monitoreo externo",
        "helm values": "Valores de Helm",
        reduce: "Reducir"
    },
    LauncherMainCard: {
        "friendly name": "Nombre amigable",
        launch: "Lanzar",
        "problem with": "Problema con:",
        cancel: "Cancelar",
        "copy auto launch url": "Copiar URL de lanzamiento automático",
        "copy auto launch url helper": ({ chartName }) =>
            `Copia la URL que permitirá a cualquier usuario de esta instancia de Onyxia lanzar un ${chartName} en esta configuración en su espacio de nombres`,
        "share the service": "Compartir el servicio",
        "share the service - explain":
            "Haz que el servicio sea accesible para los miembros del grupo",
        "restore all default": "Restaurar todas las configuraciones predeterminadas",
        "bookmark button": ({ isBookmarked }) =>
            `${isBookmarked ? "Eliminar" : "Guardar"} configuración`,
        "bookmark button tooltip": ({ myServicesSavedConfigsExtendedLink }) => (
            <>
                Las configuraciones guardadas se pueden lanzar rápidamente desde la
                página&nbsp;
                <MuiLink {...myServicesSavedConfigsExtendedLink} target="_blank">
                    Mis Servicios
                </MuiLink>
            </>
        ),
        "version select label": "Versión",
        "version select helper text": ({
            helmCharName,
            helmRepositoryName,
            labeledHelmChartSourceUrls
        }) => (
            <>
                Versión del&nbsp;
                {
                    <MaybeLink href={labeledHelmChartSourceUrls.helmChartSourceUrl}>
                        {helmCharName}
                    </MaybeLink>
                }{" "}
                chart de Helm perteneciente al{" "}
                {
                    <>
                        <MaybeLink
                            href={labeledHelmChartSourceUrls.helmChartRepositorySourceUrl}
                        >
                            {helmRepositoryName}
                        </MaybeLink>{" "}
                        repositorio de charts de Helm.
                    </>
                }
            </>
        ),
        "save changes": "Guardar cambios",
        "copied to clipboard": "¡Copiado al portapapeles!",
        "s3 configuration": "Configuración de S3",
        "s3 configuration - explain": ({ projectS3ConfigLink }) => (
            <>
                Configuración de S3 para usar en este servicio.{" "}
                <MuiLink {...projectS3ConfigLink}>Configuración de S3</MuiLink>.
            </>
        )
    },
    Footer: {
        "terms of service": "Términos de servicio",
        "change language": "Cambiar idioma",
        "dark mode switch": "Activar modo oscuro"
    },
    MyServices: {
        text1: "Mis Servicios",
        text2: "Acceda a sus servicios en ejecución",
        text3: "Los servicios deben cerrarse tan pronto como deje de usarlos activamente.",
        "running services": "Servicios en ejecución"
    },
    ClusterEventsDialog: {
        title: "Eventos",
        subtitle: (
            <>
                Eventos del espacio de nombres de Kubernetes, es un flujo de eventos en
                tiempo real de <code>kubectl get events</code>
            </>
        ),
        close: "Cerrar"
    },
    MyServicesConfirmDeleteDialog: {
        "confirm delete title": "¿Estás seguro?",
        "confirm delete subtitle":
            "Asegúrate de que tus servicios estén listos para ser eliminados",
        "confirm delete body shared services":
            "Ten en cuenta que algunos de tus servicios se comparten con otros miembros del proyecto.",
        "confirm delete body":
            "No olvides subir tu código a GitHub o GitLab antes de terminar tus servicios.",
        cancel: "Cancelar",
        confirm: "Sí, eliminar"
    },
    MyServicesButtonBar: {
        refresh: "Actualizar",
        launch: "Nuevo servicio",
        trash: "Eliminar todo",
        "trash my own": "Eliminar todos mis servicios",
        events: "Eventos"
    },
    MyServicesCard: {
        service: "Servicio",
        "running since": "Iniciado: ",
        open: "Abrir",
        readme: "leerme",
        "reminder to delete services": "Recuerda eliminar tus servicios.",
        status: "Estado",
        "container starting": "Iniciando contenedor",
        failed: "Fallido",
        "suspend service tooltip": "Suspender el servicio y liberar recursos",
        "resume service tooltip": "Reanudar el servicio",
        suspended: "Suspendido",
        suspending: "Suspendiendo",
        "share tooltip - belong to someone else": ({
            projectName,
            ownerUsername,
            focusColor
        }) => (
            <>
                Este servicio se comparte entre los miembros del proyecto{" "}
                <span style={{ color: focusColor }}>{projectName}</span>
                por <span style={{ color: focusColor }}>{ownerUsername}</span>.
            </>
        ),
        "share tooltip - belong to you, shared": ({ projectName, focusColor }) => (
            <>
                Este servicio se comparte entre los miembros del proyecto{" "}
                <span style={{ color: focusColor }}>{projectName}</span>. Haga clic para
                dejar de compartir.
            </>
        ),
        "share tooltip - belong to you, not shared": ({ projectName, focusColor }) => (
            <>
                Solo usted puede acceder a este servicio. Haga clic para compartirlo con
                los miembros del proyecto{" "}
                <span style={{ color: focusColor }}>{projectName}</span>.
            </>
        )
    },
    MyServicesRestorableConfigOptions: {
        edit: "Editar",
        "copy link": "Copiar enlace URL",
        "remove bookmark": "Eliminar",
        "move down": "Mover hacia abajo",
        "move up": "Mover hacia arriba",
        "move to top": "Mover al principio",
        "move to bottom": "Mover al final"
    },
    MyServicesRestorableConfig: {
        edit: "Editar",
        launch: "Lanzar"
    },
    MyServicesRestorableConfigs: {
        saved: "Guardado",
        expand: "Expandir"
    },
    ReadmeDialog: {
        ok: "ok",
        return: "Volver"
    },
    CopyOpenButton: {
        "first copy the password": "Haz clic para copiar la contraseña...",
        "open the service": "Abrir el servicio 🚀"
    },
    MyServicesCards: {
        "running services": "Servicios en ejecución"
    },
    NoRunningService: {
        "launch one": "Haz clic aquí para lanzar uno",
        "no services running": "No tienes ningún servicio en ejecución"
    },
    CircularUsage: {
        max: "Máx.",
        used: "Usado",
        "quota card title": ({ what, isLimit }) => {
            const whatTranslated = (() => {
                switch (what) {
                    case "memory":
                        return "RAM";
                    case "cpu":
                        return "CPU";
                    case "storage":
                        return "Almacenamiento";
                    case "count/pod":
                        return "Pods de Kubernetes";
                    case "nvidia.com/gpu":
                        return "GPUs Nvidia";
                    default:
                        return capitalize(what);
                }
            })();

            return `${whatTranslated} - ${isLimit ? "Límite" : "Solicitado"}`;
        }
    },
    Quotas: {
        "show more": "Ver más",
        "resource usage quotas": "Cuotas de uso de recursos",
        "current resource usage is reasonable": "El uso actual de recursos es razonable."
    },
    DataExplorer: {
        "page header title": "Explorador de datos",
        "page header help title":
            "¡Previsualiza tus archivos Parquet y CSV directamente desde tu navegador!",
        "page header help content": ({ demoParquetFileLink }) => (
            <>
                Simplemente pasa la URL de un archivo de datos con <code>https://</code> o{" "}
                <code>s3://</code> para previsualizarlo.
                <br />
                El archivo no se descarga completamente; su contenido se transmite
                mientras navegas por las páginas.
                <br />
                Puedes compartir un enlace permanente al archivo o incluso a una fila
                específica del archivo copiando la URL de la barra de direcciones.
                <br />
                ¿No estás seguro por dónde empezar? ¡Prueba este{" "}
                <MuiLink {...demoParquetFileLink}>
                    archivo de demostración
                </MuiLink>!
            </>
        ),
        column: "columna",
        density: "densidad",
        "download file": "Descargar archivo",
        "resize table": "Redimensionar",
        "unsupported file type": ({ supportedFileTypes }) =>
            `Formato de datos no compatible. Los tipos compatibles son: ${supportedFileTypes.join(", ")}.`,
        "no s3 client":
            "No hay cliente S3 configurado. Ve a la configuración para habilitar uno en el explorador.",
        "unsupported protocol":
            "URL no compatible. Los protocolos admitidos son https:// y s3://.",
        "https fetch error": "No se pudo obtener el archivo HTTPS.",
        "query error": "Error de consulta en DuckDB."
    },
    UrlInput: {
        load: "Cargar",
        reset: "Vaciar",
        "data source": "Fuente de datos"
    },
    CommandBar: {
        ok: "Aceptar"
    },
    formattedDate: {
        past1: ({ divisorKey }) => {
            switch (divisorKey) {
                case "now":
                    return "justo ahora";
                case "second":
                    return "hace un segundo";
                case "minute":
                    return "hace un minuto";
                case "hour":
                    return "hace una hora";
                case "day":
                    return "ayer";
                case "week":
                    return "la semana pasada";
                case "month":
                    return "el mes pasado";
                case "year":
                    return "el año pasado";
            }
        },
        pastN: ({ divisorKey }) => {
            switch (divisorKey) {
                case "now":
                    return "justo ahora";
                case "second":
                    return "hace # segundos";
                case "minute":
                    return "hace # minutos";
                case "hour":
                    return "hace # horas";
                case "day":
                    return "hace # días";
                case "week":
                    return "hace # semanas";
                case "month":
                    return "hace # meses";
                case "year":
                    return "hace # años";
            }
        },
        future1: ({ divisorKey }) => {
            switch (divisorKey) {
                case "now":
                    return "justo ahora";
                case "second":
                    return "en un segundo";
                case "minute":
                    return "en un minuto";
                case "hour":
                    return "en una hora";
                case "day":
                    return "en un día";
                case "week":
                    return "en una semana";
                case "month":
                    return "en un mes";
                case "year":
                    return "en un año";
            }
        },
        futureN: ({ divisorKey }) => {
            switch (divisorKey) {
                case "now":
                    return "justo ahora";
                case "second":
                    return "en # segundos";
                case "minute":
                    return "en # minutos";
                case "hour":
                    return "en # horas";
                case "day":
                    return "en # días";
                case "week":
                    return "en # semanas";
                case "month":
                    return "en # meses";
                case "year":
                    return "en # años";
            }
        },
        singular: ({ divisorKey }) => {
            switch (divisorKey) {
                case "second":
                    return "1 segundo";
                case "minute":
                    return "1 minuto";
                case "hour":
                    return "1 hora";
                case "day":
                    return "1 día";
                case "week":
                    return "1 semana";
                case "month":
                    return "1 mes";
                case "year":
                    return "1 año";
            }
        },
        plural: ({ divisorKey }) => {
            switch (divisorKey) {
                case "second":
                    return "# segundos";
                case "minute":
                    return "# minutos";
                case "hour":
                    return "# horas";
                case "day":
                    return "# días";
                case "week":
                    return "# semanas";
                case "month":
                    return "# meses";
                case "year":
                    return "# años";
            }
        }
    },
    CopyToClipboardIconButton: {
        "copied to clipboard": "¡Copiado!",
        "copy to clipboard": "Copiar al portapapeles"
    },
    CustomDataGrid: {
        "empty directory": "Este directorio está vacío",
        "label rows count": ({ count }) => {
            const plural = count > 1 ? "s" : "";
            return `${count} elemento${plural} seleccionado${plural}`;
        },
        "label rows per page": "Elementos por página"
    },
    CustomDataGridToolbarDensitySelector: {
        toolbarDensity: "Densidad",
        toolbarDensityStandard: "Estándar",
        toolbarDensityComfortable: "Cómodo",
        toolbarDensityCompact: "Compacto"
    },
    CustomDataGridToolbarColumnsButton: {
        toolbarColumnsLabel: "Columnas"
    },
    DatasetCard: {
        publishedOn: "Publicado el",
        datasetPage: "Página del conjunto de datos",
        license: "Licencia:",
        format: "Formato",
        size: "Tamaño",
        distributions: "Distribuciones",
        visualize: "Visualizar",
        unknown: "Desconocido"
    },
    DataCollection: {
        "page header help title":
            "Introduce simplemente la URL https:// de tu esquema DCAT JSON-LD",
        "page header title": "Catálogo de datos",
        "page header help content": ({ demoCatalogLink }) => (
            <>
                Introduce simplemente la URL <code>https://</code> de un catálogo de datos
                para previsualizarlo.
                <br />
                ¿No sabes por dónde empezar? ¡Prueba este{" "}
                <MuiLink {...demoCatalogLink}>catálogo de demostración</MuiLink>!
            </>
        ),
        "https fetch error": "No se pudo obtener el recurso HTTPS.",
        "invalid json response": "La respuesta no es un JSON válido.",
        "json-ld compact error": "No se pudo compactar la respuesta JSON-LD.",
        "json-ld frame error": "No se pudo crear el frame de la respuesta JSON-LD.",
        "datasets parsing error":
            "No se pudieron analizar los conjuntos de datos del catálogo."
    },
    S3UriBar: {
        explore: "Explorar..",
        "copy s3 path": "Copiar ruta S3",
        copied: "Copiado",
        "copied path": ({ s3Uri }) => `Ruta copiada: ${s3Uri}`,
        "add to bookmarks": "Añadir a marcadores",
        "delete from bookmarks": "Eliminar de marcadores",
        "pinned storage location": "Ubicación de almacenamiento fijada",
        bookmarked: "Marcado",
        "edit s3 uri": "Editar URI S3",
        prefix: "Prefijo",
        "admin bookmark": "Marcador de administración",
        bookmark: "Marcador",
        object: "Objeto",
        public: "Público",
        "go to s3 uri": ({ s3Uri, isPublic }) =>
            `${isPublic ? "Público. " : ""}Ir a ${s3Uri}`,
        "s3 uri": "S3 URI",
        "edit from s3 root": "Editar desde la raíz S3",
        "edit object key": "Editar clave del objeto",
        "object key": "Clave del objeto",
        listing: "Listando..."
    }
};
