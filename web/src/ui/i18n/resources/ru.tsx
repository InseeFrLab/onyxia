import type { Translations } from "../types";
import MuiLink from "@mui/material/Link";
import { Markdown } from "ui/shared/Markdown";
import { Icon } from "onyxia-ui/Icon";
import { getIconUrlByName } from "lazy-icons";
import { capitalize } from "tsafe/capitalize";
import { MaybeLink } from "ui/shared/MaybeLink";

export const translations: Translations<"ru"> = {
    Account: {
        profile: "Профиль",
        git: undefined,
        storage: "Подключиться к хранилищу",
        k8sCodeSnippets: "Kubernetes",
        "user-interface": "Настройки интерфейса",
        text1: "Мой аккаунт",
        text2: "Доступ к различной информации об аккаунте.",
        text3: "Настройте имена пользователей, электронные адреса, пароли и персональные токены доступа, напрямую связанные с вашими сервисами.",
        "personal tokens tooltip":
            "Токены, генерируемые для вас с заданным сроком действия",
        vault: "Vault"
    },
    AccountProfileTab: {
        "account id": "Идентификатор аккаунта",
        "account id helper":
            "Ваши неизменяемые идентификаторы, связанные с учётной записью, используемой для входа на платформу",
        "user id": "Идентификатор пользователя",
        email: "Электронная почта",
        "account management": "Управление аккаунтом"
    },
    UserProfileForm: {
        "customizable profile": "Настраиваемый профиль",
        "customizable profile helper":
            "Полезная информация для автоматической настройки ваших сервисов",
        save: "Сохранить",
        restore: "Восстановить"
    },
    ConfirmNavigationDialog: {
        "you have unsaved changes": "У вас есть несохранённые изменения!",
        cancel: "Отмена",
        "continue without saving": "Продолжить без сохранения"
    },
    AccountGitTab: {
        gitName: "Имя пользователя для Git",
        "gitName helper text": ({ gitName, focusClassName }) => (
            <>
                Эта команда задаст глобальное имя пользователя Git и будет выполнена при
                запуске сервиса:&nbsp;
                <code className={focusClassName}>
                    git config --global user.name "{gitName || "<ваше_имя_пользователя>"}"
                </code>
            </>
        ),
        gitEmail: "Электронная почта для Git",
        "gitEmail helper text": ({ gitEmail, focusClassName }) => (
            <>
                Эта команда задаст глобальный адрес электронной почты Git и будет
                выполнена при запуске сервиса:&nbsp;
                <code className={focusClassName}>
                    git config --global user.email "
                    {gitEmail || "<ваш_email@домен.com>"}"
                </code>
            </>
        ),
        githubPersonalAccessToken: "Персональный токен доступа к Git Forge",
        "githubPersonalAccessToken helper text": ({ focusClassName }) => (
            <>
                Предоставив этот токен, вы сможете клонировать и отправлять изменения в
                приватные репозитории GitHub или GitLab без повторного ввода учётных
                данных.
                <br />
                Токен также будет доступен в виде переменной окружения:&nbsp;
                <span className={focusClassName}>$GIT_PERSONAL_ACCESS_TOKEN</span>
            </>
        )
    },
    AccountStorageTab: {
        "credentials section title": "Подключите данные к вашим сервисам",
        "credentials section helper":
            "Объектное хранилище MinIO, совместимое с Amazon (AWS S3). Эта информация уже заполнена автоматически.",
        "accessible as env":
            "Доступно в ваших сервисах в виде переменной окружения:",
        "init script section title":
            "Для доступа к хранилищу вне сервисов datalab",
        "init script section helper":
            "Скачайте или скопируйте инициализационный скрипт на выбранном языке программирования.",
        "expires in": ({ howMuchTime }) => `Истекает через ${howMuchTime}`
    },
    AccountKubernetesTab: {
        "credentials section title": "Подключение к кластеру Kubernetes",
        "credentials section helper":
            "Учётные данные для прямого взаимодействия с API-сервером Kubernetes.",
        "init script section title": "Shell-скрипт",
        "init script section helper": ({ installKubectlUrl }) => (
            <>
                Этот скрипт позволяет использовать kubectl или helm на вашем локальном
                компьютере. <br />
                Для этого{" "}
                <MuiLink href={installKubectlUrl} target="_blank">
                    установите kubectl на вашем компьютере
                </MuiLink>{" "}
                и выполните скрипт, вставив его в терминал.
                <br />
                После этого вы можете убедиться в работоспособности, выполнив команду
                &nbsp;
                <code>kubectl get pods</code> или <code>helm list</code>
            </>
        ),
        "expires in": ({ howMuchTime }) =>
            `Эти учётные данные действительны в течение следующих ${howMuchTime}`
    },
    AccountVaultTab: {
        "credentials section title": "Учётные данные Vault",
        "credentials section helper": ({ vaultDocHref, mySecretLink }) => (
            <>
                <MuiLink href={vaultDocHref} target="_blank">
                    Vault
                </MuiLink>{" "}
                — это система, в которой хранятся&nbsp;
                <MuiLink {...mySecretLink}>ваши секреты</MuiLink>.
            </>
        ),
        "init script section title": "Использование Vault из терминала",
        "init script section helper": ({ vaultCliDocLink }) => (
            <>
                Скачайте или скопируйте переменные <code>ENV</code>, настраивающие ваш
                локальный{" "}
                <MuiLink href={vaultCliDocLink} target="_blank">
                    Vault CLI
                </MuiLink>
            </>
        ),
        "expires in": ({ howMuchTime }) => `Токен истекает через ${howMuchTime}`
    },
    ProjectSettings: {
        "page header title": "Настройки проекта",
        "page header help title": ({ groupProjectName }) =>
            groupProjectName === undefined
                ? "Настройки вашего личного проекта"
                : `Настройки для "${groupProjectName}"`,
        "page header help content": ({
            groupProjectName,
            doesUserBelongToSomeGroupProject
        }) => (
            <>
                Эта страница позволяет настроить параметры, применяемые к
                {groupProjectName === undefined
                    ? " вашему личному проекту"
                    : ` проекту ${groupProjectName}`}
                .
                <br />
                {groupProjectName !== undefined && (
                    <>
                        Обратите внимание, что {groupProjectName} — это групповой проект,
                        общий для нескольких пользователей; изменения, внесённые здесь,
                        будут применены ко всем участникам проекта.
                        <br />
                    </>
                )}
                {doesUserBelongToSomeGroupProject && (
                    <>
                        Вы можете переключаться между проектами с помощью выпадающего
                        меню в заголовке.
                        <br />
                    </>
                )}
                Обратите внимание, что только администратор вашего экземпляра Onyxia
                может создавать новые проекты.
            </>
        ),
        "security-info": "Информация о безопасности",
        "s3-configs": "Конфигурации S3"
    },
    ProjectSettingsS3ConfigTab: {
        "add custom config": "Добавить пользовательскую конфигурацию S3"
    },
    S3ConfigCard: {
        "data source": "Источник данных",
        credentials: "Учётные данные",
        "sts credentials":
            "Токены, автоматически запрашиваемые Onyxia от вашего имени (STS)",
        account: "Аккаунт",
        "use in services": "Использовать в сервисах",
        "use in services helper": `Если включено, эта конфигурация будет использоваться
            по умолчанию в сервисах, поддерживающих интеграцию S3.`,
        "use for onyxia explorers": "Использовать для проводников Onyxia",
        "use for onyxia explorers helper": `Если включено, эта конфигурация будет
            использоваться файловым и дата-проводниками.`,
        edit: "Редактировать",
        delete: "Удалить"
    },
    AddCustomS3ConfigDialog: {
        "dialog title": "Новая пользовательская конфигурация S3",
        "dialog subtitle":
            "Укажите пользовательский сервисный аккаунт или подключитесь к другому совместимому с S3 сервису",
        cancel: "Отмена",
        "save config": "Сохранить конфигурацию",
        "update config": "Обновить конфигурацию",
        "is required": "Это поле обязательно для заполнения",
        "must be an url": "Недопустимый URL",
        "not a valid access key id":
            "Похоже, это недопустимый идентификатор ключа доступа",
        "url textField label": "URL",
        "url textField helper text": "URL сервиса S3",
        "region textField label": "Регион AWS S3",
        "region textField helper text":
            "Пример: eu-west-1. Если не уверены, оставьте пустым",
        "workingDirectoryPath textField label": "Путь рабочего каталога",
        "workingDirectoryPath textField helper text": (
            <>
                Здесь можно указать корзину и префикс объекта S3, которыми вы владеете. <br />
                Пример: <code>my-bucket/my-prefix/</code> или{" "}
                <code>my-bucket/</code>, если вы владеете всей корзиной.
            </>
        ),
        "account credentials": "Учётные данные аккаунта",
        "friendlyName textField label": "Название конфигурации",
        "friendlyName textField helper text":
            "Это просто для удобства идентификации. Пример: Моя корзина AWS",
        "isAnonymous switch label": "Анонимный доступ",
        "isAnonymous switch helper text":
            "Включите, если секретный ключ доступа не требуется",
        "accessKeyId textField label": "Идентификатор ключа доступа",
        "accessKeyId textField helper text": "Пример: 1A2B3C4D5E6F7G8H9I0J",
        "secretAccessKey textField label": "Секретный ключ доступа",
        "sessionToken textField label": "Токен сессии",
        "sessionToken textField helper text":
            "Необязательно, оставьте пустым, если не уверены",
        "url style": "Стиль URL",
        "url style helper text": `Укажите, как ваш S3-сервер форматирует URL для скачивания файлов.`,
        "path style label": ({ example }) => (
            <>
                Path style
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
                Virtual-hosted style
                {example !== undefined && (
                    <>
                        :&nbsp;
                        <code>{example}my-dataset.parquet</code>
                    </>
                )}
            </>
        )
    },
    TestS3ConnectionButton: {
        "test connection": "Проверить соединение",
        "test connection failed": ({ errorMessage }) => (
            <>
                Проверка соединения завершилась с ошибкой: <br />
                {errorMessage}
            </>
        )
    },
    AccountUserInterfaceTab: {
        title: "Настройки интерфейса",
        "enable dark mode": "Включить тёмный режим",
        "dark mode helper":
            "Тема интерфейса с тёмным фоном для работы при слабом освещении.",
        "enable beta": "Включить бета-режим",
        "beta mode helper":
            "Для расширенной настройки и функций платформы.",
        "enable dev mode": "Включить режим разработчика",
        "dev mode helper": "Включить функции, находящиеся в разработке",
        "Enable command bar": "Командная строка",
        "Enable command bar helper": ({ imgUrl }) => (
            <>
                {" "}
                <MuiLink href={imgUrl} target="_blank">
                    Командная строка
                </MuiLink>{" "}
                показывает команды, выполняемые от вашего имени при взаимодействии с
                интерфейсом.
            </>
        )
    },
    SettingField: {
        "copy tooltip": "Скопировать в буфер обмена",
        language: "Изменить язык",
        "service password": "Пароль сервиса по умолчанию",
        "service password helper text": ({ groupProjectName }) => (
            <>
                Это пароль по умолчанию для защиты запущенных сервисов. <br />
                При запуске сервиса поле пароля на вкладке безопасности заполняется этим
                паролем. <br />
                Нажатие на значок{" "}
                <Icon size="extra small" icon={getIconUrlByName("Refresh")} /> создаст
                новый случайный пароль. Обратите внимание, что это не изменит пароль для
                уже запущенных сервисов. <br />
                Onyxia предложит вам скопировать пароль сервиса в буфер обмена перед
                открытием запущенного сервиса. <br />
                {groupProjectName !== undefined && (
                    <>
                        Обратите внимание, что этот пароль общий для всех участников
                        проекта ({groupProjectName}).
                    </>
                )}
            </>
        ),
        "not yet defined": "Ещё не задан",
        "reset helper dialogs": "Сбросить информационные окна",
        reset: "Сбросить",
        "reset helper dialogs helper text":
            "Сбросить информационные окна, которые были скрыты по запросу"
    },
    FileExplorerEntry: {
        "page title - file explorer": "Файловый проводник",
        "what this page is used for - file explorer":
            "Здесь вы можете просматривать ваши корзины S3.",
        "help content": ({ accountTabLink, docHref }) => (
            <>
                Прочитайте{" "}
                <MuiLink href={docHref} target="_blank">
                    нашу документацию
                </MuiLink>
                . &nbsp;
                <MuiLink {...accountTabLink}>
                    Настройте клиенты minio
                </MuiLink>.
            </>
        ),
        "title personal": "Мои данные",
        "description personal": "Ваши личные файлы и наборы данных.",
        "title project": ({ projectName }) => `Проект ${projectName}`,
        "description project": ({ projectName }) =>
            `Общее хранилище для проекта ${projectName}`,
        tags: ({ type }) => {
            switch (type) {
                case "personal":
                    return "Мои данные";
                case "project":
                    return "Групповые данные";
            }
        }
    },
    S3EntryCard: {
        "space path": "Путь к пространству"
    },
    FileExplorerDisabledDialog: {
        "dialog title": "Сервер S3 не настроен",
        "dialog body":
            "Для этого экземпляра не настроен сервер S3. Вы можете добавить его вручную для включения файлового проводника S3.",
        cancel: "Отмена",
        "go to settings": "Перейти к настройкам"
    },
    ShareDialog: {
        title: "Поделитесь данными",
        close: "Закрыть",
        "create and copy link": "Создать и скопировать ссылку",
        "paragraph current policy": ({ isPublic }) =>
            isPublic
                ? "Ваш файл публичный, любой, у кого есть ссылка, может его скачать."
                : "Ваш файл в настоящее время является приватным.",
        "paragraph change policy": ({ isPublic }) =>
            isPublic
                ? "Чтобы ограничить доступ, измените статус доступа к файлу."
                : "Чтобы предоставить доступ к файлу, измените его статус или создайте временную ссылку доступа.",
        "hint link access": ({ isPublic, expiration }) =>
            isPublic
                ? "Ваша ссылка действительна, пока файл публичный."
                : `Эта ссылка предоставит доступ к вашим данным в течение ${expiration}.`,
        "label input link": "Ссылка для доступа"
    },
    SelectTime: {
        "validity duration label": "Срок действия"
    },
    MySecrets: {
        "page title - my secrets": "Мои секреты",
        "what this page is used for - my secrets":
            "Здесь можно определить переменные, которые будут доступны в ваших сервисах в виде переменных окружения.",
        "learn more - my files": "Чтобы узнать больше об управлении файлами,",
        "help content": ({ accountTabLink, docHref }) => (
            <>
                Прочитайте{" "}
                <MuiLink href={docHref} target="_blank">
                    нашу документацию
                </MuiLink>
                . &nbsp;
                <MuiLink {...accountTabLink}>
                    Настройте локальный Vault CLI
                </MuiLink>.
            </>
        )
    },
    SecretsExplorerItem: {
        description: "описание"
    },
    ExplorerItem: {
        description: "описание"
    },
    SecretsExplorerButtonBar: {
        secret: "секрет",
        rename: "переименовать",
        delete: "удалить",
        "create secret": "Создать секрет",
        "copy path": "Использовать в сервисе",
        "create new empty directory": "создать новый пустой каталог",
        refresh: "обновить",
        "create what": ({ what }) => `Создать ${what}`,
        new: "Новый"
    },
    ExplorerButtonBar: {
        file: "файл",
        delete: "удалить",
        "download directory": "Скачать",
        "upload file": "Загрузить файл",
        "copy path": "Скопировать имя объекта S3",
        "create new empty directory": "создать новый пустой каталог",
        refresh: "обновить",
        new: "Новый",
        share: "Поделиться",
        "alt list view": "Показать списком",
        "alt block view": "Показать блоками"
    },
    ExplorerDownloadSnackbar: {
        "download preparation": "Подготовка к загрузке ..."
    },
    ExplorerItems: {
        "empty directory": "Этот каталог пуст"
    },
    SecretsExplorerItems: {
        "empty directory": "Этот каталог пуст"
    },
    SecretsExplorer: {
        file: "файл",
        secret: "секрет",
        create: "создать",
        cancel: "отмена",
        delete: "удалить",
        "do not display again": "Больше не показывать",
        "untitled what": ({ what }) => `без_названия_${what}`,
        directory: "папка",
        "deletion dialog title": ({ deleteWhat }) => `Удалить ${deleteWhat}?`,
        "deletion dialog body": ({
            deleteWhat
        }) => `Вы собираетесь удалить ${deleteWhat}.
            Это действие нельзя отменить.`,
        "already a directory with this name":
            "Каталог с таким именем уже существует",
        "can't be empty": "Не может быть пустым",
        "new directory": "Новый каталог"
    },
    Explorer: {
        file: "файл",
        secret: "секрет",
        create: "создать",
        cancel: "отмена",
        delete: "удалить",
        "do not display again": "Больше не показывать",
        "untitled what": ({ what }) => `без_названия_${what}`,
        directory: "папка",
        multiple: "элементы",
        "deletion dialog title": ({ deleteWhat, isPlural }) =>
            `Удалить ${isPlural ? "эти" : "этот"} ${deleteWhat}?`,
        "deletion dialog body": ({ deleteWhat, isPlural }) => `
        Вы собираетесь удалить ${isPlural ? "эти" : "этот"} ${deleteWhat}.
        Это действие может привести к потере данных, связанных с ${isPlural ? "этими" : "этим"} ${deleteWhat}.
        `,
        "already a directory with this name":
            "Каталог с таким именем уже существует",
        "can't be empty": "Не может быть пустым",
        "new directory": "Новый каталог"
    },
    MySecretsEditor: {
        "do not display again": "Больше не показывать",
        "add an entry": "Добавить новую переменную",
        "environnement variable default name": "NEW_VAR",
        "table of secret": "таблица секретов",
        "key column name": "Имя переменной",
        "value column name": "Значение",
        "unavailable key": "Уже используется",
        "invalid key empty string": "Требуется имя",
        "invalid key _ not valid": "Не может состоять только из _",
        "invalid key start with digit": "Не может начинаться с цифры",
        "invalid key invalid character": "Недопустимый символ",
        "use this secret": `Использовать в сервисах`,
        "use secret dialog title": "Использовать в сервисе",
        "use secret dialog subtitle": "Путь к секрету скопирован",
        "use secret dialog body": `
                При запуске сервиса (RStudio, Jupyter и т.д.) перейдите на вкладку
                секретов и вставьте путь к секрету в соответствующее поле.
                Значения будут внедрены как переменные окружения.
            `,
        "use secret dialog ok": "Понятно"
    },
    MySecretsEditorRow: {
        "key input desc": "Имя переменной окружения",
        "value input desc": "Значение переменной окружения"
    },
    ExplorerUploadModalDropArea: {
        "browse files": "выбрать файлы",
        "drag and drop or": "Перетащите или"
    },
    ExplorerUploadProgress: {
        over: "из",
        importing: "Импорт"
    },
    ExplorerUploadModal: {
        "import files": "Импортировать файлы",
        cancel: "Отмена",
        minimize: "Свернуть"
    },
    ListExplorerItems: {
        "header name": "Имя",
        "header modified date": "Изменено",
        "header size": "Размер",
        "header policy": "Политика"
    },
    Header: {
        login: "Войти",
        logout: "Выйти",
        project: "Проект",
        region: "Регион"
    },
    LeftBar: {
        reduce: "Свернуть",
        home: "Главная",
        account: "Мой аккаунт",
        projectSettings: "Настройки проекта",
        catalog: "Каталог сервисов",
        myServices: "Мои сервисы",
        mySecrets: "Мои секреты",
        myFiles: "Мои файлы",
        "divider: services features": "Функции сервисов",
        "divider: external services features": "Функции внешних сервисов",
        "divider: onyxia instance specific features":
            "Функции данного экземпляра Onyxia",
        dataExplorer: "Проводник данных",
        dataCollection: "Сбор данных",
        fileExplorer: "Файловый проводник",
        sqlOlapShell: "SQL Olap Shell"
    },
    AutoLogoutCountdown: {
        "are you still there": "Вы ещё здесь?",
        "you'll soon be automatically logged out":
            "Вы скоро будете автоматически выведены из системы."
    },
    Page404: {
        "not found": "Страница не найдена"
    },
    PortraitModeUnsupported: {
        instructions:
            "Чтобы использовать это приложение на телефоне, включите датчик поворота и переверните телефон."
    },
    MaybeAcknowledgeConfigVolatilityDialog: {
        "dialog title": "Обратите внимание: конфигурации временны",
        "dialog body": `Этот экземпляр Onyxia не реализует механизм сохранения конфигураций. 
            Все конфигурации хранятся в локальном хранилище браузера. Это означает, что при 
            очистке локального хранилища или смене браузера все конфигурации будут потеряны.`,
        "do not show next time": "Больше не показывать",
        cancel: "Отмена",
        "I understand": "Я понимаю"
    },
    Home: {
        "title authenticated": ({ userFirstname }) => `Добро пожаловать, ${userFirstname}!`,
        title: "Добро пожаловать в Onyxia datalab",
        "new user": "Впервые в datalab?",
        login: "Войти",
        subtitle:
            "Работайте с Python или R и используйте все необходимые вычислительные ресурсы!",
        cardTitle1: "Эргономичная среда и сервисы по запросу",
        cardTitle2: "Активное и отзывчивое сообщество к вашим услугам",
        cardTitle3: "Быстрое, гибкое и онлайн-хранилище данных",
        cardText1:
            "Анализируйте данные, выполняйте распределённые вычисления и пользуйтесь обширным каталогом сервисов. Резервируйте необходимые вычислительные мощности.",
        cardText2:
            "Используйте и делитесь доступными ресурсами: учебными материалами, обучением и каналами общения.",
        cardText3:
            "Для удобного доступа к вашим данным и данным, предоставленным вам, из ваших программ — реализация API S3",
        cardButton1: "Просмотреть каталог",
        cardButton2: "Присоединиться к сообществу",
        cardButton3: "Просмотреть данные"
    },
    Catalog: {
        header: "Каталог сервисов",
        "no result found": ({ forWhat }) => `Результаты для "${forWhat}" не найдены`,
        "search results": "Результаты поиска",
        search: "Поиск",
        "title all catalog": "Все"
    },
    CatalogChartCard: {
        launch: "Запустить",
        "learn more": "Узнать больше"
    },
    CatalogNoSearchMatches: {
        "no service found": "Сервис не найден",
        "no result found": ({ forWhat }) => `Результаты для "${forWhat}" не найдены`,
        "check spelling":
            "Проверьте правописание или попробуйте расширить поиск.",
        "go back": "Вернуться к основным сервисам"
    },
    Launcher: {
        sources: ({
            helmChartName,
            helmChartRepositoryName,
            labeledHelmChartSourceUrls
        }) => (
            <>
                Helm chart{" "}
                {
                    <MaybeLink href={labeledHelmChartSourceUrls.helmChartSourceUrl}>
                        {helmChartName}
                    </MaybeLink>
                }{" "}
                принадлежит репозиторию Helm chart{" "}
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
                        Он основан на образе Docker{" "}
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
        "download as script": "Скачать как скрипт",
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
            >{`Мы разработали командную строку, чтобы дать вам полный контроль над развёртываниями Kubernetes.
Вот что вам нужно знать:

#### Что такое команды Helm?

Эти команды — именно те Helm-команды, которые API Onyxia выполнит от вашего имени в вашем пространстве имён Kubernetes.
Это позволяет вам знать, что происходит «за кулисами» при взаимодействии с интерфейсом.

#### Обновления в реальном времени

По мере взаимодействия с интерфейсом команды Helm автоматически обновляются.

#### Зачем мне это нужно?

- **Прозрачность:** Мы считаем, что вы имеете право знать, какие действия выполняются в вашей среде.
- **Обучение:** Понимание этих команд поможет вам разобраться в Kubernetes и Helm.
- **Ручное выполнение:** Вы можете скопировать эти команды в терминал с доступом на запись к Kubernetes и запустить сервис вручную.

#### Как выполнить эти команды вручную?

${k8CredentialsHref === undefined ? "" : "Есть два способа выполнить эти команды:  "}

${
    k8CredentialsHref === undefined
        ? ""
        : `
- **Локальный терминал:** Перейдите в [\`Мой аккаунт -> вкладка Kubernetes\`](${k8CredentialsHref}).
  Здесь вы найдёте учётные данные для выполнения команд в вашем пространстве имён Kubernetes с локального терминала.
`
}

- Если в вашем экземпляре Onyxia есть сервисы VSCode или Jupyter, вы можете открыть терминал в этих сервисах и выполнить команды там.
  Для конструктивных или деструктивных команд вам потребуется запустить сервис с ролью Kubernetes \`admin\` или \`edit\`.

Выполнив команду вручную, вы сможете увидеть сервис на странице [\`Мои сервисы\`](${myServicesHref}), как если бы он был запущен через интерфейс.

Вы можете отключить командную строку в [\`Мой аккаунт -> вкладка Настройки интерфейса\`](${interfacePreferenceHref}).

Исследуйте и берите управление развёртываниями Kubernetes в свои руки!
        `}</Markdown>
        ),
        form: "Форма",
        editor: "Текстовый редактор"
    },
    AcknowledgeSharingOfConfigConfirmDialog: {
        "acknowledge sharing of config confirm dialog title":
            "Обратите внимание: конфигурации являются общими",
        "acknowledge sharing of config confirm dialog subtitle": ({
            groupProjectName
        }) => `Если вы сохраните эту конфигурацию, каждый участник проекта ${groupProjectName} сможет её запустить.`,
        "acknowledge sharing of config confirm dialog body": `Несмотря на то, что Onyxia не внедряет личные данные автоматически,
        убедитесь, что в сохраняемой конфигурации нет конфиденциальной информации.`,
        cancel: "Отмена",
        "i understand, proceed": "Я понимаю, продолжить"
    },
    AutoLaunchDisabledDialog: {
        "auto launch disabled dialog title":
            "Функция автозапуска отключена в этом экземпляре Onyxia",
        "auto launch disabled dialog body": (
            <>
                <b>ВНИМАНИЕ</b>: Кто-то может пытаться обманом заставить вас запустить
                сервис, который может нарушить целостность вашего пространства имён.
                <br />
                Пожалуйста, внимательно проверьте конфигурацию сервиса перед запуском.
                <br />
                Если у вас есть сомнения, обратитесь к администратору.
            </>
        ),
        ok: "Ок"
    },
    NoLongerBookmarkedDialog: {
        "no longer bookmarked dialog title": "Изменения не будут сохранены",
        "no longer bookmarked dialog body":
            "Нажмите на значок закладки ещё раз, чтобы обновить сохранённую конфигурацию",
        ok: "Ок"
    },
    FormFieldWrapper: {
        "reset to default": "Сбросить до значения по умолчанию"
    },
    ConfigurationTopLevelGroup: {
        miscellaneous: "Разное",
        "Configuration that applies to all charts":
            "Конфигурация, применяемая ко всем chart'ам",
        "Top level configuration values": "Конфигурационные значения верхнего уровня"
    },
    YamlCodeBlockFormField: {
        "not an array": "Ожидается массив",
        "not an object": "Ожидается объект",
        "not valid yaml": "Недопустимый YAML/JSON"
    },
    TextFormField: {
        "not matching pattern": ({ pattern }) =>
            `Не соответствует шаблону ${pattern}`,
        "toggle password visibility": "Показать/скрыть пароль"
    },
    FormFieldGroupComponent: {
        add: "Добавить"
    },
    AutoInjectSwitch: {
        tooltip: ({ isAutoInjected }) => (
            <>
                Если включено, эта конфигурация будет автоматически внедряться в ваши
                сервисы. Вы всё равно сможете добавить её вручную при запуске сервиса,
                даже если этот параметр отключён.
                <br />
                <br />
                Текущее состояние:{" "}
                <strong>{isAutoInjected ? "включено" : "отключено"}</strong>
            </>
        )
    },
    NumberFormField: {
        "below minimum": ({ minimum }) =>
            `Должно быть больше или равно ${minimum}`,
        "not a number": "Не является числом",
        "not an integer": "Не является целым числом"
    },
    MyService: {
        "page title": ({ helmReleaseFriendlyName }) =>
            `Мониторинг ${helmReleaseFriendlyName}`
    },
    PodLogsTab: {
        "not necessarily first logs":
            "Это не обязательно первые логи, более ранние могли быть удалены",
        "new logs are displayed in realtime": "Новые логи отображаются в реальном времени"
    },
    MyServiceButtonBar: {
        back: "Назад",
        "external monitoring": "Внешний мониторинг",
        "helm values": "Значения Helm",
        reduce: "Свернуть"
    },
    LauncherMainCard: {
        "friendly name": "Понятное имя",
        launch: "Запустить",
        "problem with": "Проблема с:",
        cancel: "Отмена",
        "copy auto launch url": "Скопировать URL автозапуска",
        "copy auto launch url helper": ({
            chartName
        }) => `Скопировать URL, который позволит любому пользователю этого экземпляра Onyxia
            запустить ${chartName} в данной конфигурации в своём пространстве имён`,
        "share the service": "Поделиться сервисом",
        "share the service - explain":
            "Сделать сервис доступным для участников группы",
        "restore all default": "Восстановить конфигурации по умолчанию",
        "bookmark button": ({ isBookmarked }) =>
            `${isBookmarked ? "Удалить" : "Сохранить"} конфигурацию`,
        "bookmark button tooltip": ({ myServicesSavedConfigsExtendedLink }) => (
            <>
                Сохранённые конфигурации можно быстро перезапустить со страницы&nbsp;
                <MuiLink {...myServicesSavedConfigsExtendedLink} target="_blank">
                    Мои сервисы
                </MuiLink>
            </>
        ),
        "version select label": "Версия",
        "version select helper text": ({
            helmCharName,
            helmRepositoryName,
            labeledHelmChartSourceUrls
        }) => (
            <>
                Версия Helm chart{" "}
                {
                    <MaybeLink href={labeledHelmChartSourceUrls.helmChartSourceUrl}>
                        {helmCharName}
                    </MaybeLink>
                }{" "}
                из репозитория{" "}
                {
                    <>
                        <MaybeLink
                            href={
                                labeledHelmChartSourceUrls.helmChartRepositorySourceUrl
                            }
                        >
                            {helmRepositoryName}
                        </MaybeLink>{" "}
                        Helm chart.
                    </>
                }
            </>
        ),
        "save changes": "Сохранить изменения",
        "copied to clipboard": "Скопировано в буфер обмена!",
        "s3 configuration": "Конфигурация S3",
        "s3 configuration - explain": ({ projectS3ConfigLink }) => (
            <>
                Конфигурация S3 для использования в этом сервисе.{" "}
                <MuiLink {...projectS3ConfigLink}>Конфигурация S3</MuiLink>.
            </>
        )
    },
    Footer: {
        "terms of service": "Условия использования",
        "change language": "Изменить язык",
        "dark mode switch": "Переключатель тёмного режима"
    },
    MyServices: {
        text1: "Мои сервисы",
        text2: "Доступ к запущенным сервисам",
        text3: "Сервисы следует останавливать сразу после прекращения активного использования.",
        "running services": "Запущенные сервисы"
    },
    ClusterEventsDialog: {
        title: "События",
        subtitle: (
            <>
                События пространства имён Kubernetes — это поток в реальном времени от{" "}
                <code>kubectl get events</code>
            </>
        )
    },
    MyServicesConfirmDeleteDialog: {
        "confirm delete title": "Вы уверены?",
        "confirm delete subtitle":
            "Убедитесь, что ваши сервисы готовы к удалению",
        "confirm delete body shared services":
            "Имейте в виду, что некоторые из ваших сервисов являются общими с другими участниками проекта.",
        "confirm delete body":
            "Не забудьте загрузить свой код на GitHub или GitLab перед завершением работы сервисов",
        cancel: "отмена",
        confirm: "Да, удалить"
    },
    MyServicesButtonBar: {
        refresh: "Обновить",
        launch: "Новый сервис",
        trash: "Удалить все",
        "trash my own": "Удалить все мои сервисы"
    },
    MyServicesCard: {
        service: "Сервис",
        "running since": "Запущен: ",
        open: "Открыть",
        readme: "readme",
        "reminder to delete services": "Не забудьте удалить ваши сервисы.",
        status: "Статус",
        "container starting": "Контейнер запускается",
        failed: "Ошибка",
        "suspend service tooltip": "Приостановить сервис и освободить ресурсы",
        "resume service tooltip": "Возобновить работу сервиса",
        suspended: "Приостановлен",
        suspending: "Приостановка",
        "share tooltip - belong to someone else": ({
            projectName,
            ownerUsername,
            focusColor
        }) => (
            <>
                Этот сервис является общим для участников проекта{" "}
                <span style={{ color: focusColor }}>{projectName}</span> и принадлежит
                пользователю{" "}
                <span style={{ color: focusColor }}>{ownerUsername}</span>.
            </>
        ),
        "share tooltip - belong to you, shared": ({ projectName, focusColor }) => (
            <>
                Этот сервис является общим для участников проекта{" "}
                <span style={{ color: focusColor }}>{projectName}</span>. Нажмите, чтобы
                остановить общий доступ.
            </>
        ),
        "share tooltip - belong to you, not shared": ({
            projectName,
            focusColor
        }) => (
            <>
                Только вы имеете доступ к этому сервису. Нажмите, чтобы открыть доступ
                для участников проекта{" "}
                <span style={{ color: focusColor }}>{projectName}</span>.
            </>
        )
    },
    MyServicesRestorableConfigOptions: {
        edit: "Редактировать",
        "copy link": "Скопировать URL ссылку",
        "remove bookmark": "Удалить",
        "move down": "Переместить вниз",
        "move to bottom": "Переместить в конец",
        "move to top": "Переместить в начало",
        "move up": "Переместить вверх"
    },
    MyServicesRestorableConfig: {
        edit: "Редактировать",
        launch: "Запустить"
    },
    MyServicesRestorableConfigs: {
        saved: "Сохранено",
        expand: "Развернуть"
    },
    ReadmeDialog: {
        ok: "ок",
        return: "Назад"
    },
    CopyOpenButton: {
        "first copy the password": "Нажмите, чтобы скопировать пароль...",
        "open the service": "Открыть сервис 🚀"
    },
    MyServicesCards: {
        "running services": "Запущенные сервисы"
    },
    NoRunningService: {
        "launch one": "Нажмите здесь, чтобы запустить",
        "no services running": "У вас нет запущенных сервисов"
    },
    CircularUsage: {
        max: "Максимум",
        used: "Использовано",
        "quota card title": ({ what, isLimit }) => {
            const whatTranslated = (() => {
                switch (what) {
                    case "memory":
                        return "ОЗУ";
                    case "cpu":
                        return "ЦП";
                    case "storage":
                        return "Хранилище";
                    case "count/pod":
                        return "Pods Kubernetes";
                    case "nvidia.com/gpu":
                        return "GPU Nvidia";
                    default:
                        return capitalize(what);
                }
            })();

            return `${whatTranslated} - ${isLimit ? "Лимит" : "Запрошено"}`;
        }
    },
    Quotas: {
        "show more": "Показать больше",
        "resource usage quotas": "Квоты использования ресурсов",
        "current resource usage is reasonable":
            "Ваше текущее использование ресурсов находится в разумных пределах."
    },
    DataExplorer: {
        "page header title": "Проводник данных",
        "page header help title":
            "Предварительный просмотр файлов Parquet и CSV прямо в браузере!",
        "page header help content": ({ demoParquetFileLink }) => (
            <>
                Просто укажите URL файла данных с префиксом <code>https://</code> или{" "}
                <code>s3://</code> для предварительного просмотра.
                <br />
                Файл не загружается полностью; его содержимое передаётся потоком по мере
                навигации.
                <br />
                Вы можете поделиться постоянной ссылкой на файл или даже на конкретную
                строку, скопировав URL из адресной строки.
                <br />
                Не знаете, с чего начать? Попробуйте этот{" "}
                <MuiLink {...demoParquetFileLink}>демонстрационный файл</MuiLink>!
            </>
        ),
        column: "столбец",
        density: "плотность",
        "download file": "Скачать файл",
        "resize table": "Изменить размер",
        "unsupported file type": ({ supportedFileTypes }) =>
            `Неподдерживаемый формат данных. Поддерживаемые типы: ${supportedFileTypes.join(", ")}.`,
        "no s3 client":
            "Клиент S3 не настроен. Перейдите в настройки, чтобы включить его для проводника.",
        "unsupported protocol":
            "Неподдерживаемый URL. Поддерживаемые протоколы: https:// и s3://.",
        "https fetch error": "Не удалось загрузить HTTPS файл.",
        "query error": "Ошибка запроса DuckDB."
    },
    UrlInput: {
        load: "Загрузить",
        reset: "Сбросить"
    },
    CommandBar: {
        ok: "Ок"
    },
    formattedDate: {
        past1: ({ divisorKey }) => {
            switch (divisorKey) {
                case "now":
                    return "только что";
                case "second":
                    return "секунду назад";
                case "minute":
                    return "минуту назад";
                case "hour":
                    return "час назад";
                case "day":
                    return "вчера";
                case "week":
                    return "на прошлой неделе";
                case "month":
                    return "в прошлом месяце";
                case "year":
                    return "в прошлом году";
            }
        },
        pastN: ({ divisorKey }) => {
            switch (divisorKey) {
                case "now":
                    return "только что";
                case "second":
                    return "# секунд назад";
                case "minute":
                    return "# минут назад";
                case "hour":
                    return "# часов назад";
                case "day":
                    return "# дней назад";
                case "week":
                    return "# недель назад";
                case "month":
                    return "# месяцев назад";
                case "year":
                    return "# лет назад";
            }
        },
        future1: ({ divisorKey }) => {
            switch (divisorKey) {
                case "now":
                    return "только что";
                case "second":
                    return "через секунду";
                case "minute":
                    return "через минуту";
                case "hour":
                    return "через час";
                case "day":
                    return "через день";
                case "week":
                    return "через неделю";
                case "month":
                    return "через месяц";
                case "year":
                    return "через год";
            }
        },
        futureN: ({ divisorKey }) => {
            switch (divisorKey) {
                case "now":
                    return "только что";
                case "second":
                    return "через # секунд";
                case "minute":
                    return "через # минут";
                case "hour":
                    return "через # часов";
                case "day":
                    return "через # дней";
                case "week":
                    return "через # недель";
                case "month":
                    return "через # месяцев";
                case "year":
                    return "через # лет";
            }
        },
        singular: ({ divisorKey }) => {
            switch (divisorKey) {
                case "second":
                    return "1 секунда";
                case "minute":
                    return "1 минута";
                case "hour":
                    return "1 час";
                case "day":
                    return "1 день";
                case "week":
                    return "1 неделя";
                case "month":
                    return "1 месяц";
                case "year":
                    return "1 год";
            }
        },
        plural: ({ divisorKey }) => {
            switch (divisorKey) {
                case "second":
                    return "# секунд";
                case "minute":
                    return "# минут";
                case "hour":
                    return "# часов";
                case "day":
                    return "# дней";
                case "week":
                    return "# недель";
                case "month":
                    return "# месяцев";
                case "year":
                    return "# лет";
            }
        }
    },
    CopyToClipboardIconButton: {
        "copied to clipboard": "Скопировано!",
        "copy to clipboard": "Скопировать в буфер обмена"
    },
    CustomDataGrid: {
        "empty directory": "Этот каталог пуст",
        "label rows count": ({ count }) => {
            const ending = (() => {
                if (count % 10 === 1 && count % 100 !== 11) return "";
                if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100))
                    return "а";
                return "ов";
            })();
            return `${count} элемент${ending} выбрано`;
        },
        "label rows per page": "Элементов на странице"
    },
    CustomDataGridToolbarDensitySelector: {
        toolbarDensity: "Плотность",
        toolbarDensityStandard: "Стандартная",
        toolbarDensityComfortable: "Комфортная",
        toolbarDensityCompact: "Компактная"
    },
    CustomDataGridToolbarColumnsButton: {
        toolbarColumnsLabel: "Столбцы"
    },
    DatasetCard: {
        publishedOn: "Опубликовано",
        datasetPage: "Страница набора данных",
        license: "Лицензия:",
        format: "Формат",
        size: "Размер",
        distributions: "Дистрибутивы",
        visualize: "Визуализировать",
        unknown: "Неизвестно"
    },
    DataCollection: {
        "page header help title":
            "Просто введите https:// URL вашей схемы DCAT JSON-LD",
        "page header title": "Каталог данных",
        "page header help content": ({ demoCatalogLink }) => (
            <>
                Просто введите URL <code>https://</code> каталога данных для
                предварительного просмотра.
                <br />
                Не знаете, с чего начать? Попробуйте этот{" "}
                <MuiLink {...demoCatalogLink}>демонстрационный каталог</MuiLink>!
            </>
        ),
        "https fetch error": "Не удалось загрузить HTTPS ресурс.",
        "invalid json response": "Ответ не является допустимым JSON.",
        "json-ld compact error": "Не удалось свернуть ответ JSON-LD.",
        "json-ld frame error": "Не удалось преобразовать ответ JSON-LD.",
        "datasets parsing error":
            "Не удалось разобрать наборы данных из каталога."
    }
};