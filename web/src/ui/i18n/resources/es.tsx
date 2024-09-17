import MuiLink from "@mui/material/Link";
import { Markdown } from "ui/shared/Markdown";
import type { Translations } from "../types";
import { Icon } from "onyxia-ui/Icon";
import type { MuiIconComponentName } from "onyxia-ui/MuiIconComponentName";
import { id } from "tsafe/id";
import { capitalize } from "tsafe/capitalize";
import { MaybeLink } from "ui/shared/MaybeLink";

export const translations: Translations<"en"> = {
    /* spell-checker: disable */
    "Account": {
        "infos": "Información de la cuenta",
        "git": "Git",
        "storage": "Conectar al almacenamiento",
        "k8sCodeSnippets": "Kubernetes",
        "user-interface": "Preferencias de interfaz",
        "text1": "Mi cuenta",
        "text2": "Accede a tu diversa información de cuenta.",
        "text3":
            "Configura tus nombres de usuario, correos electrónicos, contraseñas y tokens de acceso personal directamente conectados a tus servicios.",
        "personal tokens tooltip":
            "Contraseñas que se generan para ti y que tienen un período de validez determinado",
        "vault": "Vault"
    },
    "AccountInfoTab": {
        "general information": "Información general",
        "user id": "ID de usuario (IDEP)",
        "full name": "Nombre completo",
        "email": "Dirección de correo electrónico",
        "instructions about how to change password":
            'Para cambiar tu contraseña, simplemente cierra sesión y haz clic en el enlace de "olvidé mi contraseña".'
    },
    "AccountGitTab": {
        "gitName": "Nombre de usuario para Git",
        "gitName helper text": ({ gitName, focusClassName }) => (
            <>
                Este comando establecerá tu nombre de usuario global de Git, ejecutado al
                inicio del servicio:&nbsp;
                <code className={focusClassName}>
                    git config --global user.name "{gitName || "<tu_nombre_de_usuario>"}"
                </code>
            </>
        ),
        "gitEmail": "Correo electrónico para Git",
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
        "githubPersonalAccessToken": "Token de acceso personal para Git Forge",
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
    "AccountStorageTab": {
        "credentials section title": "Conecta tus datos a tus servicios",
        "credentials section helper":
            "Almacenamiento de objetos MinIO compatible con Amazon (AWS S3). Esta información ya está rellenada automáticamente.",
        "accessible as env":
            "Accesible dentro de tus servicios como la variable de entorno:",
        "init script section title":
            "Para acceder a tu almacenamiento fuera de los servicios de datalab",
        "init script section helper":
            "Descarga o copia el script de inicialización en el lenguaje de programación de tu elección.",
        "expires in": ({ howMuchTime }) => `Expira en ${howMuchTime}`
    },
    "AccountKubernetesTab": {
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
    "AccountVaultTab": {
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
        "expires in": ({ howMuchTime }) => `El token expira en ${howMuchTime}`
    },
    "ProjectSettings": {
        "page header title": "Configuración del Proyecto",
        "page header help title": ({ groupProjectName }) =>
            groupProjectName === undefined
                ? "Configuración de tu proyecto personal"
                : `Configuración para "${groupProjectName}"`,
        "page header help content": ({
            groupProjectName,
            doesUserBelongToSomeGroupProject
        }) => (
            <>
                Esta página te permite configurar los ajustes que se aplican
                {groupProjectName === undefined
                    ? " a tu proyecto personal"
                    : ` al ${groupProjectName}`}
                .
                <br />
                {groupProjectName !== undefined && (
                    <>
                        Ten en cuenta que {groupProjectName} es un proyecto grupal
                        compartido con otros usuarios; los ajustes que cambies aquí se
                        aplicarán a todos los miembros del proyecto.
                        <br />
                    </>
                )}
                {doesUserBelongToSomeGroupProject && (
                    <>
                        Puedes cambiar entre tus proyectos usando el menú desplegable en
                        el encabezado.
                        <br />
                    </>
                )}
                Ten en cuenta que solo el administrador de tu instancia de Onyxia puede
                crear nuevos proyectos.
            </>
        ),
        "security-info": "Información de Seguridad",
        "s3-configs": "Configuraciones de S3"
    },
    "ProjectSettingsS3ConfigTab": {
        "add custom config": "Agregar una configuración S3 personalizada"
    },
    "S3ConfigCard": {
        "data source": "Fuente de datos",
        "credentials": "Credenciales",
        "sts credentials":
            "Tokens solicitados dinámicamente en tu nombre por Onyxia (STS)",
        "account": "Cuenta",
        "use in services": "Usar en servicios",
        "use in services helper": `Si está habilitado, esta configuración se utilizará por
            defecto en tus servicios que implementan una integración S3.`,
        "use for onyxia explorers": "Usar para exploradores de Onyxia",
        "use for onyxia explorers helper": `Si está habilitado, esta configuración será utilizada
            por el explorador de archivos y el explorador de datos.`,
        "edit": "Editar",
        "delete": "Eliminar"
    },
    "AddCustomS3ConfigDialog": {
        "dialog title": "Nueva configuración S3 personalizada",
        "dialog subtitle":
            "Especifica una cuenta de servicio personalizada o conéctate a otro servicio compatible con S3",
        "cancel": "Cancelar",
        "save config": "Guardar configuración",
        "update config": "Actualizar configuración",
        "is required": "Este campo es obligatorio",
        "must be an url": "No es una URL válida",
        "not a valid access key id": "Esto no parece una ID de clave de acceso válida",
        "url textField label": "URL",
        "url textField helper text": "URL del servicio S3",
        "region textField label": "Región de AWS S3",
        "region textField helper text":
            "Ejemplo: eu-west-1, si no estás seguro, déjalo vacío",
        "workingDirectoryPath textField label": "Ruta del directorio de trabajo",
        "workingDirectoryPath textField helper text": (
            <>
                Esto te permite especificar el bucket y el prefijo del objeto S3 que
                posees en el servicio S3. <br />
                Ejemplo: <code>mi-bucket/mi-prefijo/</code> o <code>solo mi-bucket/</code>{" "}
                si posees todo el bucket.
            </>
        ),
        "account credentials": "Credenciales de cuenta",
        "friendlyName textField label": "Nombre de configuración",
        "friendlyName textField helper text":
            "Esto es solo para ayudarle a identificar esta configuración. Ejemplo: Mi bucket de AWS",
        "isAnonymous switch label": "Acceso anónimo",
        "isAnonymous switch helper text":
            "Activa esta opción si no se requiere una clave de acceso secreto",
        "accessKeyId textField label": "ID de clave de acceso",
        "accessKeyId textField helper text": "Ejemplo: 1A2B3C4D5E6F7G8H9I0J",
        "secretAccessKey textField label": "Clave de acceso secreto",
        "sessionToken textField label": "Token de sesión",
        "sessionToken textField helper text": "Opcional, déjalo vacío si no estás seguro",
        "url style": "Estilo de URL",
        "url style helper text":
            "Especifica cómo tu servidor S3 formatea la URL para descargar archivos.",
        "path style label": ({ example }) => (
            <>
                Estilo de ruta
                {example !== undefined && (
                    <>
                        :&nbsp;
                        <code>{example}mi-dataset.parquet</code>
                    </>
                )}
            </>
        ),
        "virtual-hosted style label": ({ example }) => (
            <>
                Estilo hospedado virtualmente
                {example !== undefined && (
                    <>
                        :&nbsp;
                        <code>{example}mi-dataset.parquet</code>
                    </>
                )}
            </>
        )
    },
    "TestS3ConnectionButton": {
        "test connection": "Probar conexión",
        "test connection failed": ({ errorMessage }) => (
            <>
                La prueba de conexión falló con el error: <br />
                {errorMessage}
            </>
        )
    },
    "AccountUserInterfaceTab": {
        "title": "Preferencias de la interfaz",
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
    "SettingField": {
        "copy tooltip": "Copiar al portapapeles",
        "language": "Cambiar idioma",
        "service password": "Contraseña predeterminada del servicio",
        "service password helper text": ({ groupProjectName }) => (
            <>
                Esta es la contraseña predeterminada utilizada para proteger tus servicios
                en ejecución. <br />
                Cuando inicias un servicio, el campo de contraseña de la pestaña de
                seguridad se llena previamente con esta contraseña. <br />
                Hacer clic en el{" "}
                <Icon
                    size="extra small"
                    icon={id<MuiIconComponentName>("Refresh")}
                />{" "}
                ícono generará una nueva contraseña aleatoria. Sin embargo, ten en cuenta
                que no actualizará la contraseña para los servicios que están actualmente
                en ejecución. <br />
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
        "reset": "Restablecer",
        "reset helper dialogs helper text":
            "Restablecer ventanas de mensajes que se han solicitado no mostrar nuevamente"
    },
    "MyFiles": {
        "page title - my files": "Mis Archivos",
        "what this page is used for - my files":
            "Aquí puedes explorar tus Buckets de S3.",
        "help content": ({ accountTabLink, docHref }) => (
            <>
                Lee{" "}
                <MuiLink href={docHref} target="_blank">
                    nuestra documentación
                </MuiLink>
                . &nbsp;
                <MuiLink {...accountTabLink}>Configura los clientes de minio</MuiLink>.
            </>
        )
    },
    "MyFilesDisabledDialog": {
        "dialog title": "No hay servidor S3 configurado",
        "dialog body":
            "No hay ningún servidor S3 configurado para esta instancia. Pero puedes agregar uno manualmente para habilitar el explorador de archivos S3.",
        "cancel": "Cancelar",
        "go to settings": "Ir a configuración"
    },
    "MyFilesShareDialog": {
        "cancel": "Cancelar",
        "create and copy link": "Crear y copiar enlace"
    },
    "MySecrets": {
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
                <MuiLink {...accountTabLink}>Configura tu Vault CLI local</MuiLink>.
            </>
        )
    },
    "SecretsExplorerItem": {
        "description": "descripción"
    },
    "ExplorerItem": {
        "description": "descripción"
    },
    "SecretsExplorerButtonBar": {
        "secret": "secreto",
        "rename": "renombrar",
        "delete": "eliminar",
        "create secret": "Crear secreto",
        "copy path": "Usar en un servicio",
        "create directory": "Crear directorio",
        "refresh": "refrescar",
        "create what": ({ what }) => `Crear ${what}`,
        "new": "Nuevo"
    },
    "ExplorerButtonBar": {
        "file": "archivo",
        "delete": "eliminar",
        "upload file": "Subir archivo",
        "copy path": "Copiar nombre del objeto S3",
        "create directory": "Crear directorio",
        "refresh": "actualizar",
        "create what": ({ what }) => `Crear ${what}`,
        "new": "Nuevo"
    },
    "ExplorerItems": {
        "empty directory": "Este directorio está vacío"
    },
    "SecretsExplorerItems": {
        "empty directory": "Este directorio está vacío"
    },
    "SecretsExplorer": {
        "file": "archivo",
        "secret": "secreto",
        "create": "crear",
        "cancel": "cancelar",
        "delete": "eliminar",
        "do not display again": "No mostrar de nuevo",

        "untitled what": ({ what }) => `sin_título_${what}`,
        "directory": "carpeta",
        "deletion dialog title": ({ deleteWhat }) => `¿Eliminar un ${deleteWhat} ?`,
        "deletion dialog body": ({
            deleteWhat
        }) => `Estás a punto de eliminar ${deleteWhat}.
            Esta acción no se puede revertir.`,
        "already a directory with this name": "Ya existe una carpeta con este nombre",
        "can't be empty": "No puede estar vacío",
        "new directory": "Nueva carpeta"
    },
    "Explorer": {
        "file": "archivo",
        "secret": "secreto",
        "create": "crear",
        "cancel": "cancelar",
        "delete": "eliminar",
        "do not display again": "No mostrar de nuevo",

        "untitled what": ({ what }) => `sin_título_${what}`,
        "directory": "carpeta",
        "deletion dialog title": ({ deleteWhat }) => `¿Eliminar un ${deleteWhat} ?`,
        "deletion dialog body": ({
            deleteWhat
        }) => `Estás a punto de eliminar ${deleteWhat}.
            Esta acción no se puede revertir.`,
        "already a directory with this name": "Ya existe una carpeta con este nombre",
        "can't be empty": "No puede estar vacío",
        "new directory": "Nueva carpeta"
    },
    "MySecretsEditor": {
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
    "MySecretsEditorRow": {
        "key input desc": "Nombre de la variable de entorno",
        "value input desc": "Valor de la variable de entorno"
    },
    "ExplorerUploadModalDropArea": {
        "browse files": "explorar archivos",
        "drag and drop or": "Arrastra y suelta o"
    },
    "ExplorerUploadProgress": {
        "over": "más de",
        "importing": "Importando"
    },
    "ExplorerUploadModal": {
        "import files": "Importar archivos",
        "cancel": "Cancelar",
        "minimize": "Minimizar"
    },

    "Header": {
        "login": "Iniciar sesión",
        "logout": "Cerrar sesión",
        "project": "Proyecto",
        "region": "Región"
    },
    "LeftBar": {
        "reduce": "Reducir",
        "home": "Inicio",
        "account": "Mi cuenta",
        "projectSettings": "Configuración del proyecto",
        "catalog": "Catálogo de servicios",
        "myServices": "Mis servicios",
        "mySecrets": "Mis secretos",
        "myFiles": "Mis archivos",
        "divider: services features": "Funciones de los servicios",
        "divider: external services features": "Funciones de los servicios externos",
        "divider: onyxia instance specific features":
            "Funciones específicas de la instancia de Onyxia",
        "dataExplorer": "Explorador de datos",
        "sqlOlapShell": "SQL Olap Shell"
    },
    "AutoLogoutCountdown": {
        "are you still there": "¿Sigues ahí?",
        "you'll soon be automatically logged out":
            "Serás desconectado automáticamente pronto."
    },
    "Page404": {
        "not found": "Página no encontrada"
    },
    "PortraitModeUnsupported": {
        "instructions":
            "Para usar esta aplicación en tu teléfono, por favor activa el sensor de rotación y gira tu teléfono."
    },
    "MaybeAcknowledgeConfigVolatilityDialog": {
        "dialog title": "Ten en cuenta que las configuraciones son volátiles",
        "dialog body": `Esta instancia de Onyxia no implementa ningún mecanismo de persistencia para almacenar configuraciones. 
            Todas las configuraciones se almacenan en el almacenamiento local del navegador. Esto significa que si borras el almacenamiento local 
            del navegador o cambias de navegador, perderás todas tus configuraciones.`,
        "do not show next time": "No mostrar este mensaje de nuevo",
        "cancel": "Cancelar",
        "I understand": "Entiendo"
    },
    "Home": {
        "title authenticated": ({ userFirstname }) => `¡Bienvenido ${userFirstname}!`,
        "title": "Bienvenido al datalab de Onyxia",
        "new user": "¿Eres nuevo en el datalab?",
        "login": "Iniciar sesión",
        "subtitle":
            "¡Trabaja con Python o R, disfruta de toda la potencia de cálculo que necesitas!",
        "cardTitle1": "Un entorno ergonómico y servicios bajo demanda",
        "cardTitle2": "Una comunidad activa y entusiasta a tu servicio",
        "cardTitle3": "Almacenamiento de datos rápido, flexible y en línea",
        "cardText1":
            "Analiza datos, realiza cálculos distribuidos y aprovecha un amplio catálogo de servicios. Reserva la potencia de cálculo que necesites.",
        "cardText2":
            "Utiliza y comparte los recursos disponibles para ti: tutoriales, formación y canales de intercambio.",
        "cardText3":
            "Para acceder fácilmente a tus datos y a los que se ponen a tu disposición desde tus programas: implementación de la API de S3",
        "cardButton1": "Consultar el catálogo",
        "cardButton2": "Unirse a la comunidad",
        "cardButton3": "Consultar los datos"
    },
    "Catalog": {
        "header": "Catálogo de servicios",
        "no result found": ({ forWhat }) =>
            `No se encontraron resultados para ${forWhat}`,
        "search results": "Resultado de la búsqueda",
        "search": "Buscar"
    },
    "CatalogChartCard": {
        "launch": "Iniciar",
        "learn more": "Saber más"
    },
    "CatalogNoSearchMatches": {
        "no service found": "No se encontraron servicios",
        "no result found": ({ forWhat }) =>
            `No se encontraron resultados para ${forWhat}`,
        "check spelling":
            "Por favor, verifica la ortografía o intenta ampliar tu búsqueda.",
        "go back": "Volver a los servicios principales"
    },
    "Launcher": {
        "header text1": "Catálogo de servicios",
        "sources": ({
            helmChartName,
            helmChartRepositoryName,
            labeledHelmChartSourceUrls
        }) => (
            <>
                Estás a punto de implementar el{" "}
                {
                    <MaybeLink href={labeledHelmChartSourceUrls.helmChartSourceUrl}>
                        {helmChartName}
                    </MaybeLink>
                }{" "}
                gráfico de Helm que pertenece al{" "}
                {
                    <MaybeLink
                        href={labeledHelmChartSourceUrls.helmChartRepositorySourceUrl}
                    >
                        {helmChartRepositoryName}
                    </MaybeLink>
                }{" "}
                repositorio de gráficos de Helm.
                {labeledHelmChartSourceUrls.dockerImageSourceUrl !== undefined && (
                    <>
                        {" "}
                        basado en la{" "}
                        {
                            <MuiLink
                                href={labeledHelmChartSourceUrls.dockerImageSourceUrl}
                                target="_blank"
                            >
                                {helmChartName}
                            </MuiLink>
                        }{" "}
                        imagen Docker
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
                        ...(doOpensNewTab
                            ? { "target": "_blank", "onClick": undefined }
                            : {})
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
        )
    },
    "AcknowledgeSharingOfConfigConfirmDialog": {
        "acknowledge sharing of config confirm dialog title":
            "Ten en cuenta que las configuraciones se comparten",
        "acknowledge sharing of config confirm dialog subtitle": ({ groupProjectName }) =>
            `Si guardas esta configuración, todos los miembros del proyecto ${groupProjectName} podrán lanzarla.`,
        "acknowledge sharing of config confirm dialog body": `Aunque Onyxia no haya inyectado automáticamente ninguna información personal, ten en cuenta no compartir ninguna información sensible en la configuración compartida y restaurable.`,
        "cancel": "Cancelar",
        "i understand, proceed": "Entiendo, proceder"
    },
    "AutoLaunchDisabledDialog": {
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
        "ok": "Ok"
    },
    "FormFieldWrapper": {
        "reset to default": "Restablecer a los valores predeterminados"
    },
    "YamlCodeBlockFormField": {
        "not an array": "Se espera un arreglo",
        "not an object": "Se espera un objeto",
        "not valid yaml": "YAML/JSON no válido"
    },
    "TextFormField": {
        "not matching pattern": ({ pattern }) => `No coincide con el patrón ${pattern}`,
        "toggle password visibility": "Alternar la visibilidad de la contraseña"
    },
    "FormFieldGroupComponent": {
        "add": "Añadir"
    },
    "NumberFormField": {
        "below minimum": ({ minimum }) => `Debe ser mayor o igual a ${minimum}`,
        "not a number": "No es un número",
        "not an integer": "No es un número entero"
    },
    "NoLongerBookmarkedDialog": {
        "no longer bookmarked dialog title": "Tus cambios no se guardarán",
        "no longer bookmarked dialog body":
            "Haz clic en el icono de marcador nuevamente para actualizar tu configuración guardada",
        "ok": "Ok"
    },
    "MyService": {
        "page title": ({ helmReleaseFriendlyName }) =>
            `Monitoreo de ${helmReleaseFriendlyName}`
    },
    "PodLogsTab": {
        "not necessarily first logs":
            "Estos no son necesariamente los primeros registros, los registros más antiguos podrían haber sido eliminados",
        "new logs are displayed in realtime":
            "Los nuevos registros se muestran en tiempo real"
    },
    "MyServiceButtonBar": {
        "back": "Volver",
        "external monitoring": "Monitoreo externo",
        "helm values": "Valores de Helm",
        "reduce": "Reducir"
    },
    "LauncherMainCard": {
        "card title": "Crea tus servicios personales",
        "friendly name": "Nombre amigable",
        "launch": "Lanzar",
        "cancel": "Cancelar",
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
    "Footer": {
        "contribute": "Contribuir",
        "terms of service": "Términos de servicio",
        "change language": "Cambiar idioma",
        "dark mode switch": "Activar modo oscuro"
    },
    "MyServices": {
        "text1": "Mis Servicios",
        "text2": "Acceda a sus servicios en ejecución",
        "text3":
            "Los servicios deben cerrarse tan pronto como deje de usarlos activamente.",
        "running services": "Servicios en ejecución"
    },
    "ClusterEventsDialog": {
        "title": "Eventos",
        "subtitle": (
            <>
                Eventos del espacio de nombres de Kubernetes, es un flujo de eventos en
                tiempo real de <code>kubectl get events</code>
            </>
        )
    },
    "MyServicesConfirmDeleteDialog": {
        "confirm delete title": "¿Estás seguro?",
        "confirm delete subtitle":
            "Asegúrate de que tus servicios estén listos para ser eliminados",
        "confirm delete body shared services":
            "Ten en cuenta que algunos de tus servicios se comparten con otros miembros del proyecto.",
        "confirm delete body":
            "No olvides subir tu código a GitHub o GitLab antes de terminar tus servicios.",
        "cancel": "Cancelar",
        "confirm": "Sí, eliminar"
    },
    "MyServicesButtonBar": {
        "refresh": "Actualizar",
        "launch": "Nuevo servicio",
        "trash": "Eliminar todo",
        "trash my own": "Eliminar todos mis servicios"
    },
    "MyServicesCard": {
        "service": "Servicio",
        "running since": "Iniciado: ",
        "open": "Abrir",
        "readme": "leerme",
        "reminder to delete services": "Recuerda eliminar tus servicios.",
        "status": "Estado",
        "container starting": "Iniciando contenedor",
        "failed": "Fallido",
        "suspend service tooltip": "Suspender el servicio y liberar recursos",
        "resume service tooltip": "Reanudar el servicio",
        "suspended": "Suspendido",
        "suspending": "Suspendiendo",
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
    "MyServicesRestorableConfigOptions": {
        "edit": "Editar",
        "copy link": "Copiar enlace URL",
        "remove bookmark": "Eliminar"
    },
    "MyServicesRestorableConfig": {
        "edit": "Editar",
        "launch": "Lanzar"
    },
    "MyServicesRestorableConfigs": {
        "saved": "Guardado",
        "expand": "Expandir"
    },
    "ReadmeDialog": {
        "ok": "ok",
        "return": "Volver"
    },
    "CopyOpenButton": {
        "first copy the password": "Haz clic para copiar la contraseña...",
        "open the service": "Abrir el servicio 🚀"
    },
    "MyServicesCards": {
        "running services": "Servicios en ejecución"
    },
    "NoRunningService": {
        "launch one": "Haz clic aquí para lanzar uno",
        "no services running": "No tienes ningún servicio en ejecución"
    },
    "CircularUsage": {
        "max": "Máx.",
        "used": "Usado",
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
    "Quotas": {
        "show more": "Ver más",
        "resource usage quotas": "Cuotas de uso de recursos",
        "current resource usage is reasonable": "El uso actual de recursos es razonable."
    },
    "DataExplorer": {
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
                <MuiLink {...demoParquetFileLink}>archivo de demostración</MuiLink>!
            </>
        ),
        "column": "columna",
        "density": "densidad",
        "download file": "Descargar archivo"
    },
    "UrlInput": {
        "load": "Cargar"
    },
    "CommandBar": {
        "ok": "Aceptar"
    },
    "moment": {
        "date format": ({ isSameYear }) =>
            `dddd, MMMM Do${isSameYear ? "" : " YYYY"}, h:mm a`,
        "past1": ({ divisorKey }) => {
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
        "pastN": ({ divisorKey }) => {
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
        "future1": ({ divisorKey }) => {
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
        "futureN": ({ divisorKey }) => {
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
        }
    },
    "CopyToClipboardIconButton": {
        "copied to clipboard": "¡Copiado!",
        "copy to clipboard": "Copiar al portapapeles"
    }
    /* spell-checker: enable */
};
