import MuiLink from "@mui/material/Link";
import { Markdown } from "ui/shared/Markdown";
import type { Translations } from "../types";
import { Icon } from "onyxia-ui/Icon";
import { getIconUrlByName } from "lazy-icons";
import { capitalize } from "tsafe/capitalize";
import { MaybeLink } from "ui/shared/MaybeLink";

export const translations: Translations<"en"> = {
    /* spell-checker: disable */
    Account: {
        profile: "Perfil",
        git: "Git",
        storage: "Conectar al almacenamiento",
        k8sCodeSnippets: "Kubernetes",
        "user-interface": "Preferencias de interfaz",
        text1: "Mi cuenta",
        text2: "Accede a tu diversa información de cuenta.",
        text3: "Configura tus nombres de usuario, correos electrónicos, contraseñas y tokens de acceso personal directamente conectados a tus servicios.",
        "personal tokens tooltip":
            "Contraseñas que se generan para ti y que tienen un período de validez determinado",
        vault: "Vault"
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
    AccountStorageTab: {
        "credentials section title": "Conecta tus datos a tus servicios",
        "credentials section helper":
            "Almacenamiento de objetos MinIO compatible con Amazon (AWS S3). Esta información ya está rellenada automáticamente.",
        "accessible as env":
            "Accesible dentro de tus servicios como la variable de entorno:",
        "init script section title":
            "Para acceder a tu almacenamiento fuera de los servicios de datalab",
        "init script section helper":
            "Descarga o copia el script de inicialización en el lenguaje de programación de tu elección.",
        "expires in": ({ howMuchTime }) => `Expira ${howMuchTime}`
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
    CreateOrRenameBookmarkDialog: {
        "dialog title": "Nombre del marcador",
        "bookmarkName textField label": "Nombre",
        "bookmarkName textField empty error":
            "El nombre del marcador no puede estar vacío",
        cancel: "Cancelar",
        ok: "Ok"
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
    CreateOrUpdateProfileDialog: {
        "dialog title": "Nueva configuración S3 personalizada",
        "dialog subtitle":
            "Especifique una cuenta de servicio personalizada o conéctese a otro servicio compatible con S3",
        cancel: "Cancelar",
        "save config": "Guardar configuración",
        "update config": "Actualizar configuración",
        "is required": "Este campo es obligatorio",
        "must be an url": "No es una URL válida",
        "profile name already used": "Ya existe otro perfil con el mismo nombre",
        "not a valid access key id": "No parece un ID de clave de acceso válido",
        "url textField label": "URL",
        "url textField helper text": "URL del servicio S3",
        "region textField label": "Región de AWS S3",
        "region textField helper text":
            "Ejemplo: eu-west-1, si no está seguro, déjelo vacío",
        "account credentials": "Credenciales de la cuenta",
        "profileName textField label": "Nombre del perfil",
        "profileName textField helper text": "Identificador único de este perfil S3",
        "isAnonymous switch label": "Acceso anónimo",
        "isAnonymous switch helper text":
            "Poner en ON si no se requiere una clave de acceso secreta",
        "accessKeyId textField label": "ID de clave de acceso",
        "accessKeyId textField helper text": "Ejemplo: 1A2B3C4D5E6F7G8H9I0J",
        "secretAccessKey textField label": "Clave de acceso secreta",
        "sessionToken textField label": "Token de sesión",
        "sessionToken textField helper text": "Opcional, deje vacío si no está seguro",
        "url style": "Estilo de URL",
        "url style helper text":
            "Indique cómo su servidor S3 formatea la URL para descargar archivos.",
        "path style label": ({ example }) => (
            <>
                Estilo de ruta
                {example !== undefined && (
                    <>
                        :&nbsp;
                        <code>{example}my-dataset.parquet</code>
                    </>
                )}
            </>
        ),
        "virtual-hosted style label": ({ example }) => (
            <>
                Estilo de host virtual
                {example !== undefined && (
                    <>
                        :&nbsp;
                        <code>{example}my-dataset.parquet</code>
                    </>
                )}
            </>
        )
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
        project: "Proyecto",
        region: "Región"
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
        "toggle password visibility": "Alternar la visibilidad de la contraseña"
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
            "Los nuevos registros se muestran en tiempo real"
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
        )
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
        "trash my own": "Eliminar todos mis servicios"
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
        reset: "Vaciar"
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
    }
    /* spell-checker: enable */
};
