import type { Translations } from "../types";

export const translations: Translations<"zh-CN"> = {
    /* spell-checker: disable */
    "Account": {
        "infos": "账号信息",
        "third-party-integration": "外部服务",
        "storage": "链接到储存器",
        "user-interface": "变换显示模式",
        "k8sCredentials": undefined,
        "text1": "我的账号",
        "text2": "访问我的账号信息",
        "text3": "设置您的用户名, 电子邮件, 密码和访问令牌",
        "personal tokens tooltip": "服务的访问令牌",
        "vault": undefined
    },
    "AccountInfoTab": {
        "general information": "一般信息",
        "user id": "身分名 (IDEP)",
        "full name": "全名",
        "email": "邮件地址",
        "change account info": "修改帐户信息（例如您的密码）",
        "auth information": "Onyxia的认证信息",
        "auth information helper": `此信息可让您在平台内和平台内的各种服务中认证自己.`,
        "ip address": "IP地址"
    },
    "AccountIntegrationsTab": {
        "git section title": "Git 配置",
        "git section helper": `为了确保您在您的服务中
            作为 Git 贡献者`,
        "gitName": "您Git 账号的用户名",
        "gitEmail": "您Git 账号的注册电子邮件",
        "third party tokens section title": "连接您的 Gitlab、Github 和 Kaggle 帐户",
        "third party tokens section helper":
            "利用您的个人访问令牌和环境变量，来将您的服务连接到外部帐户.",
        "personal token": ({ serviceName }) => `个人访问令牌 ${serviceName}`,
        "link for token creation": ({ serviceName }) => `创建您的令牌 ${serviceName}.`,
        "accessible as env": "可在您的服务中作为环境变量被访问"
    },
    "AccountStorageTab": {
        "credentials section title": "将您的数据连接到您的服务",
        "credentials section helper":
            "与 Amazon (AWS S3) 兼容的对象存储 MinIO. 此信息已自动填写.",
        "accessible as env": "可在您的服务中作为环境变量被访问",
        "init script section title": "访问datalab服务之外的存储器",
        "init script section helper": `下载或复制用您选择的编程语言编写的初始化脚本.`,
        "expires in": undefined
    },
    "AccountKubernetesTab": {
        "credentials section title": undefined,
        "credentials section helper": undefined,
        "init script section title": undefined,
        "init script section helper": undefined,
        "expires in": undefined
    },
    "AccountVaultTab": {
        "credentials section title": undefined,
        "credentials section helper": undefined,
        "init script section title": undefined,
        "init script section helper": undefined,
        "expires in": undefined
    },
    "AccountUserInterfaceTab": {
        "title": "配置界面模式",
        "enable dark mode": "开启深色模式",
        "dark mode helper": "适用于低光环境的深色背景主题",
        "enable beta": "启用 Beta 测试模式",
        "beta mode helper": "用于平台高级配置和功能.",
        "enable dev mode": "启用开发者模式",
        "dev mode helper": "启用正在开发的功能"
    },
    "AccountField": {
        "copy tooltip": "复制到剪贴板",
        "language": "更改语言",
        "service password": "您的服务密码",
        "service password helper text": `登录您的所有服务都需要此密码.
            此密码自动生成并定期更新.`,
        "not yet defined": "没有定义",
        "reset helper dialogs": "重置指令窗口",
        "reset": "重置",
        "reset helper dialogs helper text": "重置您要求不再显示的消息窗口"
    },
    "MyFiles": {
        "page title - my files": "我的文件",
        "page title - my secrets": "我的密钥",
        "what this page is used for - my files": "在此处存储您的数据.",
        "what this page is used for - my secrets":
            "在此处存储可作为服务中的环境变量访问的密钥.",
        "help content": undefined
    },
    "MySecrets": {
        "page title - my files": "我的文件",
        "page title - my secrets": "我的密钥",
        "what this page is used for - my files": "在此处存储您的数据.",
        "what this page is used for - my secrets":
            "在此处存储可作为服务中的环境变量访问的密钥.",
        "learn more - my files": "了解有关使用 S3 存储的更多信息,",
        "help content": undefined
    },
    "ExplorerItem": {
        "description": "描述"
    },
    "SecretsExplorerItem": {
        "description": "描述"
    },
    "ExplorerButtonBar": {
        "file": "文档",
        "secret": "密码",
        "delete": "删除",
        "create secret": "新的密钥",
        "upload file": "上传文件",
        "copy path": undefined,
        "create directory": "新建文件夹",
        "refresh": "刷新",
        "create what": ({ what }) => `新 ${what}`,
        "new": undefined
    },
    "SecretsExplorerButtonBar": {
        "file": "文档",
        "secret": "密码",
        "rename": "重命名",
        "delete": "删除",
        "create secret": "新的密钥",
        "upload file": "上传文件",
        "copy path": "在服务中使用",
        "create directory": "新建文件夹",
        "refresh": "刷新",
        "create what": ({ what }) => `新 ${what}`,
        "new": undefined
    },
    "Explorer": {
        "file": "文档",
        "secret": "密码",
        "cancel": "取消",
        "delete": "删除",
        "do not display again": "不要再显示",
        "untitled what": undefined,
        "directory": "目录",
        "deletion dialog title": ({ deleteWhat }) => `删除 ${deleteWhat} ?`,
        "deletion dialog body": ({ deleteWhat }) => `
            您即将删除 ${deleteWhat} 服务.
            此操作将导致与此 ${deleteWhat} 服务相关的数据的潜在丢失
            `,
        "already a directory with this name": "已经有一个同名的文件夹",
        "can't be empty": "不能为空",
        "create": "建立",
        "new directory": "新建文件夹"
    },
    "SecretsExplorer": {
        "file": "文档",
        "secret": "密码",
        "cancel": "取消",
        "delete": "删除",
        "do not display again": "不要再显示",
        "untitled what": undefined,
        "directory": "目录",
        "deletion dialog title": ({ deleteWhat }) => `删除 ${deleteWhat} ?`,
        "deletion dialog body": ({ deleteWhat }) => `
            您即将删除 ${deleteWhat} 服务.
            此操作将导致与此 ${deleteWhat} 服务相关的数据的潜在丢失
            `,
        "already a directory with this name": "已经有一个同名的文件夹",
        "can't be empty": "不能为空",
        "create": "建立",
        "new directory": "新建文件夹"
    },
    "ExplorerItems": {
        "empty directory": "此目录为空"
    },
    "SecretsExplorerItems": {
        "empty directory": "此目录为空"
    },
    "MySecretsEditor": {
        "do not display again": "不要再显示",
        "add an entry": "添加变量",
        "environnement variable default name": "NEW_VARENV",
        "table of secret": "密钥表",

        "key column name": "变量名",
        "value column name": "变量值",
        "resolved value column name": "求解值",
        "what's a resolved value": `一个环境变量可以引用另一个，例如，如果你有
            定义变量 PRENOM=Louis 你可以定义变量 NAME_COMPLET="$PRENOM"-Dupon
            NAME_COMPLET的解析值将是"Louis-Dupon"
            `,
        "unavailable key": "已被使用",
        "invalid key empty string": "名字是必需的",
        "invalid key _ not valid": "不可以只有 _",
        "invalid key start with digit": "不能以数字开头",
        "invalid key invalid character": "无效字符",
        "invalid value cannot eval": "无效的shell表达式",
        "use this secret": "在服务中使用",

        "use secret dialog title": "在服务中使用",
        "use secret dialog subtitle": "密钥路径已被复制",
        "use secret dialog body": `启动服务（RStudio，Jupyter）时，
                                    如果在"VAULT"选项卡中，将路径粘贴到提供的字段中。
                                    您的键值将被作为环境变量.`,
        "use secret dialog ok": "我知道了"
    },
    "MySecretsEditorRow": {
        "key input desc": "环境变量名称",
        "value input desc": "环境变量值"
    },
    "ExplorerUploadModalDropArea": {
        "browse files": "浏览您的文件",
        "drag and drop or": "拖拽，放置或"
    },
    "ExplorerUploadProgress": {
        "over": "over",
        "importing": "导入"
    },
    "ExplorerUploadModal": {
        "import files": "导入文件",
        "cancel": "取消",
        "minimize": "最小化"
    },
    "Header": {
        "login": "登录",
        "logout": "登出",
        "project": "项目",
        "region": "区域"
    },
    "App": {
        "reduce": "缩小",
        "home": "我的主页",
        "account": "我的账号",
        "catalog": "服务目录",
        "myServices": "我的服务",
        "mySecrets": "我的密钥",
        "myFiles": "我的文档",
        "divider: services features": "服务功能",
        "divider: external services features": "外部服务功能",
        "divider: onyxia instance specific features": "Onyxia实例特定功能"
    },
    "Page404": {
        "not found": "网页未找到"
    },
    "PortraitModeUnsupported": {
        "portrait mode not supported": "尚不支持纵向模式",
        "instructions": "要在您的手机中使用此应用程序，请激活旋转传感器并转动您的手机"
    },
    "Home": {
        "welcome": ({ who }) => `你好 ${who}!`,
        "title": "欢迎来到 datalab",
        "login": "登录",
        "new user": "您是datalab的新用户?",
        "subtitle": "我们支持 Python 或 R，并为您提供各种数据服务和您需要的所有计算能力!",
        "cardTitle1": "灵活的工作环境和按需分配的服务",
        "cardTitle2": "一个为您服务的，活跃的和热情的社区",
        "cardTitle3": "快速、灵活、在线的数据存储空间",
        "cardText1":
            "分析数据、执行分布式计算并提供大量数据服务. 保证您可以预订您需要的超大计算能力",
        "cardText2": "充分利用我们向您提供的资源: 教程, 培训和交流群.",
        "cardText3": "轻松访问您的个人数据以及您的项目提供给您的数据 - S3 API",
        "cardButton1": "查阅目录",
        "cardButton2": "加入社区",
        "cardButton3": "查看数据"
    },
    "CatalogExplorerCard": {
        "launch": "启动",
        "learn more": "了解更多"
    },
    "CatalogExplorerCards": {
        "show more": "显示所有",
        "no service found": "没有找到服务",
        "no result found": ({ forWhat }) => `没有找到关于 ${forWhat} 的结果`,
        "check spelling": "检查服务名称是否拼写正确或尝试扩大您的搜索范围",
        "go back": "返回主要服务",
        "main services": "主要服务",
        "all services": "所有服务",
        "search results": "搜索结果",
        "search": "收索服务"
    },
    "Catalog": {
        "header text1": "服务目录",
        "header text2": "只需单击几下即可探索、启动和配置服务.",
        "contribute to the catalog": ({ catalogName }) => (
            <>为目录 {catalogName} 做贡献</>
        ),
        "contribute to the package": ({ packageName }) => `访问源包 ${packageName} `,
        "here": "此处"
    },
    "CatalogLauncher": {
        "no longer bookmarked dialog title": "更改未保存",
        "no longer bookmarked dialog body": "再次单击书签符号以更新您保存的配置.",
        "ok": "是",
        "should overwrite configuration dialog title": "您想更换它吗?",
        "should overwrite configuration dialog subtitle": ({ friendlyName }) =>
            `«${friendlyName}» 已经存在于您的记录中`,
        "should overwrite configuration dialog body":
            "已存在同名的注册服务. 如果替换它, 原始内容将丢失.",
        "cancel": "取消",
        "replace": "取代",
        "sensitive configuration dialog title": "您想更换它吗?", //TODO
        "proceed to launch": "继续启动", //TODO
        "auto launch disabled dialog title": "您想更换它吗?",
        "auto launch disabled dialog body": (
            <>
                <b>警告</b>：有人可能试图欺骗您，启动一个可能威胁到您 namespace
                完整性的服务。
                <br />
                请在启动之前仔细审查服务配置。
                <br />
                如有任何疑问，请联系您的管理员。
            </>
        )
    },
    "Footer": {
        "contribute": "为项目做贡献",
        "terms of service": "使用条款",
        "change language": "切换语言",
        "dark mode switch": "黑暗模式切换" // or maybe 黑暗模式开关
    },
    "CatalogLauncherMainCard": {
        "card title": "创建自定义服务",
        "friendly name": "自定义名称",
        "launch": "启动",
        "cancel": "取消",
        "copy url helper text": "复制 URL 以恢复此配置",
        "save configuration": "保存当前服务",
        "share the service": "分享服务",
        "share the service - explain": "让其他组员可以访问该服务",
        "restore all default": undefined
    },
    "CatalogLauncherConfigurationCard": {
        "global config": "全局设置",
        "configuration": ({ packageName }) => `配置 ${packageName}`,
        "dependency": ({ dependencyName }) => `依赖服务 ${dependencyName}`,
        "launch of a service": ({ dependencyName }) => `启动一个服务 ${dependencyName}`,
        "mismatching pattern": undefined,
        "Invalid YAML Object": undefined,
        "Invalid YAML Array": undefined
    },
    "MyServices": {
        "text1": "我的服务",
        "text2": "快速启动、查看和管理您正在运行的各种服务。",
        "text3": "建议您在每次工作会话后删除您的服务.",
        "running services": "正在运行的服务",
        "confirm delete title": "您确定?",
        "confirm delete subtitle": "确保您的服务不包括未保存的工作。",
        "confirm delete body": "在继续之前不要忘记将您的代码推送到 GitHub 或 GitLab.",
        "confirm delete body shared services":
            "请注意，您的某些服务正在与项目的其他成员共享.",
        "cancel": "取消",
        "confirm": "是的, 删除"
    },
    "MyServicesButtonBar": {
        "refresh": "刷新",
        "launch": "新的服务",
        "password": "复制密码",
        "trash": "删除所有",
        "trash my own": "删除您的所有服务"
    },
    "MyServicesCard": {
        "service": "服务",
        "running since": "运行时间: ",
        "open": "打开",
        "readme": "自述文件",
        "shared by you": "你分享的",
        "which token expire when": ({ which, howMuchTime }) =>
            `令牌 ${which} 在 ${howMuchTime} 后过期.`,
        "which token expired": ({ which }) => `令牌 ${which} 已经过期.`,
        "reminder to delete services": "请在使用后删除您的服务。",
        "this is a shared service": "该服务在项目内共享"
    },
    "MyServicesRunningTime": {
        "launching": "启动中"
    },
    "MyServicesSavedConfigOptions": {
        "edit": "编辑服务",
        "copy link": "复制链接",
        "remove bookmark": "删除书签"
    },
    "MyServicesSavedConfig": {
        "edit": "编辑服务",
        "launch": "启动服务"
    },
    "MyServicesSavedConfigs": {
        "saved": "已经保存",
        "show all": "显示所有"
    },
    "MyServicesCards": {
        "running services": "正在运行的服务",
        "no services running": "您没有正在运行的服务",
        "launch one": "点击来启动此服务",
        "ok": "是",
        "need to copy": "需要复制未截断的值？",
        "everything have been printed to the console": "所有的信息都会记录在日志里",
        "first copy the password": "请复制您的密码",
        "open the service": "打开服务 🚀",
        "return": "返回"
    }
    /* spell-checker: enable */
};
