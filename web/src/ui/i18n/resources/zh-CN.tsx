import type { Translations } from "../types";
import MuiLink from "@mui/material/Link";
import { Markdown } from "ui/shared/Markdown";
import { Icon } from "onyxia-ui/Icon";
import { getIconUrlByName } from "lazy-icons";
import { capitalize } from "tsafe/capitalize";
import { MaybeLink } from "ui/shared/MaybeLink";

export const translations: Translations<"zh-CN"> = {
    /* spell-checker: disable */
    Account: {
        profile: "个人资料",
        git: undefined,
        storage: "链接到储存器",
        "user-interface": "变换显示模式",
        k8sCodeSnippets: "Kubernetes",
        text1: "我的账号",
        text2: "访问我的账号信息",
        text3: "设置您的用户名, 电子邮件, 密码和访问令牌",
        "personal tokens tooltip": "服务的访问令牌",
        vault: "Vault"
    },
    AccountProfileTab: {
        "account id": "账户标识符",
        "account id helper": "与您用于登录平台的身份相关联的无形标识符",
        "user id": "用户ID",
        email: "电子邮件",
        "account management": "账户管理"
    },
    UserProfileForm: {
        "customizable profile": "可定制的个人资料",
        "customizable profile helper": "用于自动配置服务的有用信息",
        save: "保存",
        restore: "恢复"
    },
    ConfirmNavigationDialog: {
        "you have unsaved changes": "您有未保存的更改！",
        cancel: "取消",
        "continue without saving": "继续且不保存"
    },
    AccountGitTab: {
        gitName: "Git 用户名",
        "gitName helper text": ({ gitName, focusClassName }) => (
            <>
                此命令将设置您的全局 Git 用户名，服务启动时执行：&nbsp;
                <code className={focusClassName}>
                    git config --global user.name "{gitName || "<您的用户名>"}"
                </code>
            </>
        ),
        gitEmail: "Git 邮箱",
        "gitEmail helper text": ({ gitEmail, focusClassName }) => (
            <>
                此命令将设置您的全局 Git 邮箱，服务启动时执行：&nbsp;
                <code className={focusClassName}>
                    git config --global user.email "
                    {gitEmail || "<您的邮箱地址@域名.com>"}"
                </code>
            </>
        ),
        githubPersonalAccessToken: "Git 服务平台个人访问令牌",
        "githubPersonalAccessToken helper text": ({ focusClassName }) => (
            <>
                提供此令牌后，您可以在不再次输入您的服务平台凭据的情况下，克隆和推送到您的私人
                GitHub 或 GitLab 仓库。
                <br />
                此令牌还将作为环境变量提供：&nbsp;
                <span className={focusClassName}>$GIT_PERSONAL_ACCESS_TOKEN</span>
            </>
        )
    },
    AccountStorageTab: {
        "credentials section title": "将您的数据连接到您的服务",
        "credentials section helper":
            "与 Amazon (AWS S3) 兼容的对象存储 MinIO. 此信息已自动填写.",
        "accessible as env": "可在您的服务中作为环境变量被访问",
        "init script section title": "访问datalab服务之外的存储器",
        "init script section helper": `下载或复制用您选择的编程语言编写的初始化脚本.`,
        "expires in": ({ howMuchTime }) => `有效期至 ${howMuchTime}`
    },
    AccountKubernetesTab: {
        "credentials section title": "连接到 Kubernetes 集群",
        "credentials section helper": "用于直接与 Kubernetes API 服务器交互的凭证。",
        "init script section title": "Shell 脚本",
        "init script section helper": ({ installKubectlUrl }) => (
            <>
                此脚本使您可以在本地机器上使用 kubectl 或 helm。 <br />
                要使用它，只需在您的机器上
                <MuiLink href={installKubectlUrl} target="_blank">
                    安装 kubectl
                </MuiLink>
                ，然后运行脚本 通过在终端中复制粘贴它。
                <br />
                做完这些后，您可以通过运行以下命令来确认其是否有效&nbsp;
                <code>kubectl get pods</code> 或 <code>helm list</code>
            </>
        ),
        "expires in": ({ howMuchTime }) => `这些凭证在接下来的 ${howMuchTime} 内有效`
    },
    AccountVaultTab: {
        "credentials section title": "保险库凭证",
        "credentials section helper": ({ vaultDocHref, mySecretLink }) => (
            <>
                <MuiLink href={vaultDocHref} target="_blank">
                    保险库
                </MuiLink>{" "}
                是存储 &nbsp;
                <MuiLink {...mySecretLink}>您的密钥</MuiLink> 的系统。
            </>
        ),
        "init script section title": "从您的终端使用保险库",
        "init script section helper": ({ vaultCliDocLink }) => (
            <>
                下载或复制配置您本地{" "}
                <MuiLink href={vaultCliDocLink} target="_blank">
                    保险库 CLI
                </MuiLink>{" "}
                的 <code>ENV</code> 变量。
            </>
        ),
        "expires in": ({ howMuchTime }) => `该令牌有效期至 ${howMuchTime}`
    },
    ProjectSettings: {
        "page header title": "项目设置",
        "page header help title": ({ groupProjectName }) =>
            groupProjectName === undefined
                ? "您个人项目的设置"
                : `“${groupProjectName}”的设置`,
        "page header help content": ({
            groupProjectName,
            doesUserBelongToSomeGroupProject
        }) => (
            <>
                本页面允许您配置适用于
                {groupProjectName === undefined
                    ? " 您的个人项目"
                    : ` ${groupProjectName}项目`}{" "}
                的设置。
                <br />
                {groupProjectName !== undefined && (
                    <>
                        请注意，${groupProjectName}是一个与其他用户共享的团队项目；
                        您在此处所做的设置更改将适用于所有项目成员。
                        <br />
                    </>
                )}
                {doesUserBelongToSomeGroupProject && (
                    <>
                        您可以使用标题中的下拉菜单在您的项目之间切换。
                        <br />
                    </>
                )}
                请注意，只有您的Onyxia实例管理员可以创建新项目。
            </>
        ),
        "security-info": "安全信息",
        "s3-configs": "S3 配置"
    },
    ProjectSettingsS3ConfigTab: {
        "add custom config": "添加自定义S3配置"
    },
    S3ConfigCard: {
        "data source": "数据源",
        credentials: "凭证",
        "sts credentials": "由Onyxia代表您动态请求的令牌 (STS)",
        account: "账户",
        "use in services": "在服务中使用",
        "use in services helper": `如果启用，此配置将默认用于实现S3集成的服务中。`,
        "use for onyxia explorers": "用于Onyxia探索器",
        "use for onyxia explorers helper": `如果启用，此配置将被文件浏览器和数据浏览器使用。`,
        edit: "编辑",
        delete: "删除"
    },
    AddCustomS3ConfigDialog: {
        "dialog title": "新的自定义 S3 配置",
        "dialog subtitle": "指定自定义服务账户或连接到另一个兼容 S3 的服务",
        cancel: "取消",
        "save config": "保存配置",
        "update config": "更新配置",
        "is required": "此字段为必填项",
        "must be an url": "不是有效的 URL",
        "not a valid access key id": "这不像是一个有效的访问密钥 ID",
        "url textField label": "URL",
        "url textField helper text": "S3 服务的 URL",
        "region textField label": "AWS S3 区域",
        "region textField helper text": "例如：eu-west-1，如果不确定，请留空",
        "workingDirectoryPath textField label": "工作目录路径",
        "workingDirectoryPath textField helper text": (
            <>
                这可以让你指定在 S3 服务上你拥有的桶和 S3 对象前缀。 <br />
                例如：<code>我的桶/我的前缀/</code> 或 <code>仅我的桶/</code>{" "}
                如果你拥有整个桶。
            </>
        ),
        "account credentials": "账户凭证",
        "friendlyName textField label": "配置名称",
        "friendlyName textField helper text":
            "这只是帮助您识别此配置。例如：我的 AWS 存储桶",
        "isAnonymous switch label": "匿名访问",
        "isAnonymous switch helper text": "如果不需要密钥，请将其设置为开启",
        "accessKeyId textField label": "访问密钥 ID",
        "accessKeyId textField helper text": "例如：1A2B3C4D5E6F7G8H9I0J",
        "secretAccessKey textField label": "秘密访问密钥",
        "sessionToken textField label": "会话令牌",
        "sessionToken textField helper text": "可选的，如果不确定请留空",
        "url style": "URL 样式",
        "url style helper text": `指定您的 S3 服务器如何格式化下载文件的 URL。`,
        "path style label": ({ example }) => (
            <>
                路径样式
                {example !== undefined && (
                    <>
                        :&nbsp;
                        <code>{example}我的数据集.parquet</code>
                    </>
                )}
            </>
        ),
        "virtual-hosted style label": ({ example }) => (
            <>
                虚拟托管样式
                {example !== undefined && (
                    <>
                        :&nbsp;
                        <code>{example}我的数据集.parquet</code>
                    </>
                )}
            </>
        )
    },
    TestS3ConnectionButton: {
        "test connection": "测试连接",
        "test connection failed": ({ errorMessage }) => (
            <>
                测试连接失败，错误信息： <br />
                {errorMessage}
            </>
        )
    },
    AccountUserInterfaceTab: {
        title: "配置界面模式",
        "enable dark mode": "开启深色模式",
        "dark mode helper": "适用于低光环境的深色背景主题",
        "enable beta": "启用 Beta 测试模式",
        "beta mode helper": "用于平台高级配置和功能.",
        "enable dev mode": "启用开发者模式",
        "dev mode helper": "启用正在开发的功能",
        "Enable command bar": "启用命令栏",
        "Enable command bar helper": ({ imgUrl }) => (
            <>
                <MuiLink href={imgUrl} target="_blank">
                    命令栏
                </MuiLink>
                可让您了解在与用户界面互动时代您运行的命令。
            </>
        )
    },
    SettingField: {
        "copy tooltip": "复制到剪贴板",
        language: "更改语言",
        "service password": "默认服务密码",
        "service password helper text": ({ groupProjectName }) => (
            <>
                这是用来保护您正在运行的服务的默认密码。 <br />
                当您启动一个服务时，安全标签页中的密码字段将自动填充此密码。 <br />
                点击 <Icon size="extra small" icon={getIconUrlByName("Refresh")} />{" "}
                图标将生成一个新的随机密码。
                但是，请注意，它不会更新当前正在运行的服务的密码。 <br />
                服务密码是Onyxia在您访问正在运行的服务之前让您复制到剪贴板的密码。 <br />
                {groupProjectName !== undefined && (
                    <>请注意，这个密码在项目({groupProjectName})的所有成员之间共享。</>
                )}
            </>
        ),
        "not yet defined": "没有定义",
        "reset helper dialogs": "重置指令窗口",
        reset: "重置",
        "reset helper dialogs helper text": "重置您要求不再显示的消息窗口"
    },
    FileExplorerEntry: {
        "page title - file explorer": "文件资源管理器",
        "what this page is used for - file explorer": "在此处存储您的数据.",
        "help content": ({ accountTabLink, docHref }) => (
            <>
                阅读{" "}
                <MuiLink href={docHref} target="_blank">
                    我们的文档
                </MuiLink>
                。&nbsp;
                <MuiLink {...accountTabLink}>配置 Minio 客户端</MuiLink>。
            </>
        ),
        "title personal": "我的数据",
        "description personal": "您自己的文件和数据集。",
        "title project": ({ projectName }) => `项目 ${projectName}`,
        "description project": ({ projectName }) => `项目 ${projectName} 的共享存储空间`,
        tags: ({ type }) => {
            switch (type) {
                case "personal":
                    return "我的数据";
                case "project":
                    return "群组数据";
            }
        }
    },
    S3EntryCard: {
        "space path": "空间路径"
    },
    FileExplorerDisabledDialog: {
        "dialog title": "未配置S3服务器",
        "dialog body": "此实例未配置S3服务器。但您可以手动添加一个，以启用S3文件浏览器。",
        cancel: "取消",
        "go to settings": "前往设置"
    },
    ConfirmBucketCreationAttemptDialog: {
        "bucket does not exist title": ({ bucket }) => `存储桶 ${bucket} 不存在`,
        "bucket does not exist body": "要立即尝试创建吗？",
        no: "否",
        yes: "是",
        "success title": "成功",
        "failed title": "失败",
        "success body": ({ bucket }) => `存储桶 ${bucket} 创建成功。`,
        "failed body": ({ bucket }) => `创建 ${bucket} 失败。`,
        ok: "确定"
    },
    S3ExplorerExplorer: {
        "access denied": ({ directoryPath }) =>
            `您没有使用此 S3 配置文件读取 s3://${directoryPath} 的权限`,
        "bucket does not exist": ({ bucket }) => `存储桶 ${bucket} 不存在`,
        "go back": "返回",
        "delete bookmark": "删除书签"
    },
    ShareDialog: {
        title: "分享您的数据",
        close: "关闭",
        "create and copy link": "创建并复制链接",
        "paragraph current policy": ({ isPublic }) =>
            isPublic
                ? "您的文件是公开的，任何拥有链接的人都可以下载。"
                : "您的文件当前是私密的。",

        "paragraph change policy": ({ isPublic }) =>
            isPublic
                ? "要限制访问，请更改文件的共享状态。"
                : "要分享并提供对文件的访问，请更改共享状态或创建一个临时访问链接。",

        "hint link access": ({ isPublic, expiration }) =>
            isPublic
                ? "只要文件是公开的，您的链接就可用。"
                : `此链接将在 ${expiration} 内提供对您的数据的访问权限。`,
        "label input link": "访问链接"
    },
    SelectTime: {
        "validity duration label": "有效期"
    },
    MySecrets: {
        "page title - my secrets": "我的密钥",
        "what this page is used for - my secrets":
            "在此处存储可作为服务中的环境变量访问的密钥.",
        "learn more - my files": "了解有关使用 S3 存储的更多信息,",
        "help content": ({ accountTabLink, docHref }) => (
            <>
                阅读{" "}
                <MuiLink href={docHref} target="_blank">
                    我们的文档
                </MuiLink>
                。&nbsp;
                <MuiLink {...accountTabLink}>配置您的本地 Vault CLI</MuiLink>。
            </>
        )
    },
    ExplorerItem: {
        description: "描述"
    },
    SecretsExplorerItem: {
        description: "描述"
    },
    ExplorerButtonBar: {
        file: "文件",
        delete: "删除",
        "download directory": "下载",
        "upload file": "上传文件",
        "copy path": "复制 S3 对象名称",
        "create new empty directory": "创建目录",
        refresh: "刷新",
        new: "新建",
        share: "分享",
        "alt list view": "显示列表",
        "alt block view": "显示块"
    },
    ExplorerDownloadSnackbar: {
        "download preparation": "下载准备中 ..."
    },
    SecretsExplorerButtonBar: {
        secret: "密码",
        rename: "重命名",
        delete: "删除",
        "create secret": "新的密钥",
        "copy path": "在服务中使用",
        "create new empty directory": "新建文件夹",
        refresh: "刷新",
        "create what": ({ what }) => `新 ${what}`,
        new: "新建"
    },
    Explorer: {
        file: "文档",
        secret: "密码",
        cancel: "取消",
        delete: "删除",
        "do not display again": "不要再显示",
        "untitled what": ({ what }) => `untitled_${what}`,
        directory: "目录",
        multiple: "项目",
        "deletion dialog title": ({ deleteWhat, isPlural }) =>
            `删除${isPlural ? "这些" : "此"}${deleteWhat}？`,
        "deletion dialog body": ({ deleteWhat, isPlural }) => `
        您将要删除${isPlural ? "这些" : "此"}${deleteWhat}。
        此操作可能导致与${isPlural ? "这些" : "此"}${deleteWhat}相关的数据丢失。
        `,
        "already a directory with this name": "已经有一个同名的文件夹",
        "can't be empty": "不能为空",
        create: "建立",
        "new directory": "新建文件夹"
    },
    ListExplorerItems: {
        "header name": "名称",
        "header modified date": "修改日期",
        "header size": "大小",
        "header policy": "策略"
    },
    SecretsExplorer: {
        file: "文档",
        secret: "密码",
        cancel: "取消",
        delete: "删除",
        "do not display again": "不要再显示",
        "untitled what": ({ what }) => `untitled_${what}`,
        directory: "目录",
        "deletion dialog title": ({ deleteWhat }) => `删除 ${deleteWhat} ?`,
        "deletion dialog body": ({ deleteWhat }) => `
            您即将删除 ${deleteWhat} 服务.
            此操作将导致与此 ${deleteWhat} 服务相关的数据的潜在丢失
            `,
        "already a directory with this name": "已经有一个同名的文件夹",
        "can't be empty": "不能为空",
        create: "建立",
        "new directory": "新建文件夹"
    },
    ExplorerItems: {
        "empty directory": "此目录为空"
    },

    SecretsExplorerItems: {
        "empty directory": "此目录为空"
    },
    MySecretsEditor: {
        "do not display again": "不要再显示",
        "add an entry": "添加变量",
        "environnement variable default name": "NEW_VARENV",
        "table of secret": "密钥表",

        "key column name": "变量名",
        "value column name": "变量值",
        "unavailable key": "已被使用",
        "invalid key empty string": "名字是必需的",
        "invalid key _ not valid": "不可以只有 _",
        "invalid key start with digit": "不能以数字开头",
        "invalid key invalid character": "无效字符",
        "use this secret": "在服务中使用",

        "use secret dialog title": "在服务中使用",
        "use secret dialog subtitle": "密钥路径已被复制",
        "use secret dialog body": `启动服务（RStudio，Jupyter）时，
                                    如果在"VAULT"选项卡中，将路径粘贴到提供的字段中。
                                    您的键值将被作为环境变量.`,
        "use secret dialog ok": "我知道了"
    },
    MySecretsEditorRow: {
        "key input desc": "环境变量名称",
        "value input desc": "环境变量值"
    },
    ExplorerUploadModalDropArea: {
        "browse files": "浏览您的文件",
        "drag and drop or": "拖拽，放置或"
    },
    ExplorerUploadProgress: {
        over: "over",
        importing: "导入"
    },
    ExplorerUploadModal: {
        "import files": "导入文件",
        cancel: "取消",
        minimize: "最小化"
    },
    Header: {
        login: "登录",
        logout: "登出",
        project: "项目",
        region: "区域"
    },
    LeftBar: {
        reduce: "缩小",
        home: "我的主页",
        account: "我的账号",
        projectSettings: "项目设置",
        catalog: "服务目录",
        myServices: "我的服务",
        mySecrets: "我的密钥",
        myFiles: "我的文档",
        "divider: services features": "服务功能",
        "divider: external services features": "外部服务功能",
        "divider: onyxia instance specific features": "Onyxia实例特定功能",
        dataExplorer: "数据浏览器",
        fileExplorer: "文件浏览器",
        dataCollection: "集合浏览器",
        sqlOlapShell: "SQL OLAP 外壳"
    },
    AutoLogoutCountdown: {
        "are you still there": "你还在吗？",
        "you'll soon be automatically logged out": "你将很快被自动登出。"
    },
    Page404: {
        "not found": "网页未找到"
    },
    PortraitModeUnsupported: {
        instructions: "要在您的手机中使用此应用程序，请激活旋转传感器并转动您的手机"
    },
    MaybeAcknowledgeConfigVolatilityDialog: {
        "dialog title": "请注意，配置是易变的",
        "dialog body": `此Onyxia实例不实现用于存储配置的任何持久性机制。
            所有配置都存储在浏览器的本地存储中。这意味着，如果您清除了浏览器的本地存储
            或更换浏览器，您将丢失所有配置。`,
        "do not show next time": "下次不再显示此消息",
        cancel: "取消",
        "I understand": "我明白了"
    },
    Home: {
        "title authenticated": ({ userFirstname }) => `你好 ${userFirstname}!`,
        title: "欢迎来到 datalab",
        login: "登录",
        "new user": "您是datalab的新用户?",
        subtitle: "我们支持 Python 或 R，并为您提供各种数据服务和您需要的所有计算能力!",
        cardTitle1: "灵活的工作环境和按需分配的服务",
        cardTitle2: "一个为您服务的，活跃的和热情的社区",
        cardTitle3: "快速、灵活、在线的数据存储空间",
        cardText1:
            "分析数据、执行分布式计算并提供大量数据服务. 保证您可以预订您需要的超大计算能力",
        cardText2: "充分利用我们向您提供的资源: 教程, 培训和交流群.",
        cardText3: "轻松访问您的个人数据以及您的项目提供给您的数据 - S3 API",
        cardButton1: "查阅目录",
        cardButton2: "加入社区",
        cardButton3: "查看数据"
    },
    Catalog: {
        header: "服务目录",
        "no result found": ({ forWhat }) => `没有找到关于 ${forWhat} 的结果`,
        "search results": "搜索结果",
        search: "收索服务",
        "title all catalog": "全部"
    },
    CatalogChartCard: {
        launch: "启动",
        "learn more": "了解更多"
    },
    CatalogNoSearchMatches: {
        "no service found": "没有找到服务",
        "no result found": ({ forWhat }) => `没有找到关于 ${forWhat} 的结果`,
        "check spelling": "检查服务名称是否拼写正确或尝试扩大您的搜索范围",
        "go back": "返回主要服务"
    },
    Launcher: {
        sources: ({
            helmChartName,
            helmChartRepositoryName,
            labeledHelmChartSourceUrls
        }) => (
            <>
                Helm 图表{" "}
                {
                    <MaybeLink href={labeledHelmChartSourceUrls.helmChartSourceUrl}>
                        {helmChartName}
                    </MaybeLink>
                }{" "}
                属于 Helm 图表仓库{" "}
                {
                    <MaybeLink
                        href={labeledHelmChartSourceUrls.helmChartRepositorySourceUrl}
                    >
                        {helmChartRepositoryName}
                    </MaybeLink>
                }
                。
                {labeledHelmChartSourceUrls.dockerImageSourceUrl !== undefined && (
                    <>
                        {" "}
                        它基于 Docker 镜像{" "}
                        {
                            <MuiLink
                                href={labeledHelmChartSourceUrls.dockerImageSourceUrl}
                                target="_blank"
                            >
                                {helmChartName}
                            </MuiLink>
                        }
                        。
                    </>
                )}
            </>
        ),
        "download as script": "下载脚本",
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
            >{`我们设计了命令栏，目的是让您能够全面掌控您的 Kubernetes 部署。
以下是您需要了解的信息：

#### 这些 Helm 命令是什么？

这些命令是 Onyxia API 将代表您在您的 Kubernetes 命名空间中执行的确切 Helm 命令。
这使您能够了解在您与 UI 交互时后台正在发生什么。

#### 实时更新

当您与 UI 交互时，Helm 命令将自动更新以反映您正在做的事情。

#### 我为什么应该关心？

- **透明度：** 我们认为您有权知道在您的环境中正在执行哪些操作。
- **学习：** 理解这些命令可以提供对 Kubernetes 和 Helm 的深入了解，增进您的知识。
- **手动执行：** 您可以将这些命令复制并粘贴到具有对 Kubernetes 有写入权限的终端中，从而手动启动服务。

#### 我如何手动运行这些命令？

${k8CredentialsHref === undefined ? "" : "有两种方式可以运行这些命令：  "}

${
    k8CredentialsHref === undefined
        ? ""
        : `
- **本地终端：** 转到 [\`我的账户 -> Kubernetes 标签页\`](${k8CredentialsHref})。
  在这里，您将找到允许您从本地终端在您的 Kubernetes 命名空间中运行命令的凭证。
`
}

- 如果此 Onyxia 实例提供了如 VSCode 或 Jupyter 这样的服务，您可以在这些服务内部打开一个终端并在那里运行命令。
  对于构建或销毁命令，您需要使用 Kubernetes 角色 \`admin\` 或 \`edit\` 启动您的服务。

通过手动执行命令，您仍然可以在 [\`我的服务\`](${myServicesHref}) 页面中看到该服务，就像它是通过 UI 启动的一样。

您可以在 [\`我的账户 -> 界面偏好标签页\`](${interfacePreferenceHref}) 中禁用命令栏。

随意探索并掌握您的 Kubernetes 部署！
        `}</Markdown>
        ),
        form: "表单",
        editor: "文本编辑器"
    },
    AcknowledgeSharingOfConfigConfirmDialog: {
        "acknowledge sharing of config confirm dialog title": "请注意，配置是共享的",
        "acknowledge sharing of config confirm dialog subtitle": ({
            groupProjectName
        }) => `如果您保存
        此配置，项目 ${groupProjectName} 的每个成员都将能够启动它。`,
        "acknowledge sharing of config confirm dialog body": `尽管 Onyxia 没有自动注入任何个人信息，
        请注意不要在可恢复的配置中分享任何敏感信息。`,
        cancel: "取消",
        "i understand, proceed": "我明白了，继续"
    },
    AutoLaunchDisabledDialog: {
        ok: "是",
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
    FormFieldWrapper: {
        "reset to default": "重置为默认值"
    },
    ConfigurationTopLevelGroup: {
        miscellaneous: "杂项",
        "Configuration that applies to all charts": "适用于所有图表的配置",
        "Top level configuration values": "顶级配置值"
    },
    YamlCodeBlockFormField: {
        "not an array": "需要是数组",
        "not an object": "需要是对象",
        "not valid yaml": "无效的 YAML/JSON"
    },
    TextFormField: {
        "not matching pattern": ({ pattern }) => `不符合模式 ${pattern}`,
        "toggle password visibility": "切换密码可见性"
    },
    FormFieldGroupComponent: {
        add: "添加"
    },
    AutoInjectSwitch: {
        tooltip: ({ isAutoInjected }) => (
            <>
                如果启用，该配置将自动注入到你的服务中。
                即使该选项处于禁用状态，你仍然可以在启动 服务时手动添加它。
                <br />
                <br />
                当前状态： <strong>{isAutoInjected ? "已启用" : "已禁用"}</strong>
            </>
        )
    },
    NumberFormField: {
        "below minimum": ({ minimum }) => `必须大于或等于 ${minimum}`,
        "not a number": "不是数字",
        "not an integer": "不是整数"
    },
    NoLongerBookmarkedDialog: {
        "no longer bookmarked dialog title": "更改未保存",
        "no longer bookmarked dialog body": "再次单击书签符号以更新您保存的配置.",
        ok: "是"
    },
    MyService: {
        "page title": ({ helmReleaseFriendlyName }) => `${helmReleaseFriendlyName} 监控`
    },
    PodLogsTab: {
        "not necessarily first logs": "这不一定是第一批日志，较旧的日志可能已被清除",
        "new logs are displayed in realtime": "新日志实时显示"
    },
    MyServiceButtonBar: {
        back: "返回",
        "external monitoring": "外部监控",
        "helm values": "Helm 值",
        reduce: "减少"
    },
    LauncherMainCard: {
        "friendly name": "自定义名称",
        launch: "启动",
        "problem with": "问题：",
        cancel: "取消",
        "copy auto launch url": "复制自动启动 URL",
        "copy auto launch url helper": ({
            chartName
        }) => `复制 URL，使任何这个 Onyxia 实例的用户都能够
            在他们的 namespace 中以这种配置启动一个 ${chartName}`,
        "share the service": "分享服务",
        "share the service - explain": "让其他组员可以访问该服务",
        "restore all default": "恢复默认配置",
        "bookmark button": ({ isBookmarked }) => `${isBookmarked ? "移除" : "保存"} 配置`,
        "bookmark button tooltip": ({ myServicesSavedConfigsExtendedLink }) => (
            <>
                已保存的配置可以从&nbsp;
                <MuiLink {...myServicesSavedConfigsExtendedLink} target="_blank">
                    我的服务
                </MuiLink>{" "}
                页面快速重新启动
            </>
        ),
        "version select label": "版本",
        "version select helper text": ({
            helmCharName,
            helmRepositoryName,
            labeledHelmChartSourceUrls
        }) => (
            <>
                {
                    <MaybeLink href={labeledHelmChartSourceUrls.helmChartSourceUrl}>
                        {helmCharName}
                    </MaybeLink>
                }{" "}
                helm 图表的版本 属于{" "}
                {
                    <MaybeLink
                        href={labeledHelmChartSourceUrls.helmChartRepositorySourceUrl}
                    >
                        {helmRepositoryName}
                    </MaybeLink>
                }{" "}
                helm 图表仓库。
            </>
        ),
        "save changes": "保存更改",
        "copied to clipboard": "已复制到剪贴板！",
        "s3 configuration": "S3 配置",
        "s3 configuration - explain": ({ projectS3ConfigLink }) => (
            <>
                用于此服务的 S3 配置。 <MuiLink {...projectS3ConfigLink}>S3 配置</MuiLink>
                。
            </>
        )
    },
    Footer: {
        "terms of service": "使用条款",
        "change language": "切换语言",
        "dark mode switch": "黑暗模式切换" // or maybe 黑暗模式开关
    },
    MyServices: {
        text1: "我的服务",
        text2: "快速启动、查看和管理您正在运行的各种服务。",
        text3: "建议您在每次工作会话后删除您的服务.",
        "running services": "正在运行的服务"
    },
    ClusterEventsDialog: {
        title: "事件",
        subtitle: (
            <>
                Kubernetes 命名空间的事件，这是一个来自 <code>kubectl get events</code>
                的实时流
            </>
        )
    },
    MyServicesConfirmDeleteDialog: {
        "confirm delete title": "您确定?",
        "confirm delete subtitle": "确保您的服务不包括未保存的工作。",
        "confirm delete body": "在继续之前不要忘记将您的代码推送到 GitHub 或 GitLab.",
        "confirm delete body shared services":
            "请注意，您的某些服务正在与项目的其他成员共享.",
        cancel: "取消",
        confirm: "是的, 删除"
    },
    MyServicesButtonBar: {
        refresh: "刷新",
        launch: "新的服务",
        trash: "删除所有",
        "trash my own": "删除您的所有服务"
    },
    MyServicesCard: {
        service: "服务",
        "running since": "开始于：",
        open: "打开",
        readme: "自述文件",
        "reminder to delete services": "请在使用后删除您的服务。",
        status: "状态",
        "container starting": "容器启动中",
        failed: "失败",
        "suspend service tooltip": "暂停服务并释放资源",
        "resume service tooltip": "恢复服务",
        suspended: "已暂停",
        suspending: "正在暂停",
        "share tooltip - belong to someone else": ({
            projectName,
            ownerUsername,
            focusColor
        }) => (
            <>
                该服务由<span style={{ color: focusColor }}>{ownerUsername}</span>共享给
                <span style={{ color: focusColor }}>{projectName}</span>项目成员。
            </>
        ),
        "share tooltip - belong to you, shared": ({ projectName, focusColor }) => (
            <>
                该服务已共享给<span style={{ color: focusColor }}>{projectName}</span>
                项目成员。点击停止共享。
            </>
        ),
        "share tooltip - belong to you, not shared": ({ projectName, focusColor }) => (
            <>
                只有您可以访问此服务。点击共享给
                <span style={{ color: focusColor }}>
                    {projectName}
                </span>项目成员。
            </>
        )
    },
    MyServicesRestorableConfigOptions: {
        edit: "编辑服务",
        "copy link": "复制链接",
        "remove bookmark": "删除书签",
        "move down": "下移",
        "move up": "上移",
        "move to top": "移至顶部",
        "move to bottom": "移至底部"
    },
    MyServicesRestorableConfig: {
        edit: "编辑服务",
        launch: "启动服务"
    },
    MyServicesRestorableConfigs: {
        saved: "已经保存",
        expand: "展开"
    },
    ReadmeDialog: {
        ok: "是",
        return: "返回"
    },
    CopyOpenButton: {
        "first copy the password": "点击以复制密码...",
        "open the service": "打开服务 🚀"
    },
    MyServicesCards: {
        "running services": "正在运行的服务"
    },
    NoRunningService: {
        "launch one": "点击来启动此服务",
        "no services running": "You don't have any service running"
    },
    CircularUsage: {
        max: "最大",
        used: "已用",
        "quota card title": ({ what, isLimit }) => {
            const whatTranslated = (() => {
                switch (what) {
                    case "memory":
                        return "RAM";
                    case "cpu":
                        return "CPU";
                    case "storage":
                        return "存储";
                    case "count/pod":
                        return "Kubernetes 容器";
                    case "nvidia.com/gpu":
                        return "Nvidia GPU";
                    default:
                        return capitalize(what);
                }
            })();

            return `${whatTranslated} - ${isLimit ? "限额" : "请求"}`;
        }
    },
    Quotas: {
        "show more": "显示更多",
        "resource usage quotas": "资源使用配额",
        "current resource usage is reasonable": "您当前的资源使用是合理的。"
    },
    DataExplorer: {
        "page header title": "数据浏览器",
        "page header help title": "直接在您的浏览器中预览您的 Parquet 和 CSV 文件！",
        "page header help content": ({ demoParquetFileLink }) => (
            <>
                只需输入数据文件的 <code>https://</code> 或 <code>s3://</code> URL
                即可预览。
                <br />
                文件不会完全下载；您在翻阅页面时，其内容会实时流式传输。
                <br />
                您可以复制地址栏中的
                URL，分享文件的永久链接，甚至是文件中某个特定行的链接。
                <br />
                不知道从哪里开始？尝试这个{" "}
                <MuiLink {...demoParquetFileLink}>
                    演示文件
                </MuiLink>！
            </>
        ),
        column: "列",
        density: "密度",
        "download file": "下载文件",
        "resize table": "调整大小",
        "unsupported file type": ({ supportedFileTypes }) =>
            `不支持的数据格式。支持的类型有：${supportedFileTypes.join(", ")}。`,
        "no s3 client": "未配置 S3 客户端。请前往设置中为资源管理器启用一个。",
        "unsupported protocol": "不支持的 URL。支持的协议为 https:// 和 s3://。",
        "https fetch error": "无法获取 HTTPS 文件。",
        "query error": "DuckDB 查询错误。"
    },
    UrlInput: {
        load: "加载",
        reset: "清空"
    },
    CommandBar: {
        ok: "是"
    },
    formattedDate: {
        past1: ({ divisorKey }) => {
            switch (divisorKey) {
                case "now":
                    return "刚刚";
                case "second":
                    return "一秒前";
                case "minute":
                    return "一分钟前";
                case "hour":
                    return "一小时前";
                case "day":
                    return "昨天";
                case "week":
                    return "上周";
                case "month":
                    return "上个月";
                case "year":
                    return "去年";
            }
        },
        pastN: ({ divisorKey }) => {
            switch (divisorKey) {
                case "now":
                    return "刚刚";
                case "second":
                    return "# 秒前";
                case "minute":
                    return "# 分钟前";
                case "hour":
                    return "# 小时前";
                case "day":
                    return "# 天前";
                case "week":
                    return "# 周前";
                case "month":
                    return "# 个月前";
                case "year":
                    return "# 年前";
            }
        },
        future1: ({ divisorKey }) => {
            switch (divisorKey) {
                case "now":
                    return "刚刚";
                case "second":
                    return "一秒后";
                case "minute":
                    return "一分钟后";
                case "hour":
                    return "一小时后";
                case "day":
                    return "明天";
                case "week":
                    return "下周";
                case "month":
                    return "下个月";
                case "year":
                    return "明年";
            }
        },
        futureN: ({ divisorKey }) => {
            switch (divisorKey) {
                case "now":
                    return "刚刚";
                case "second":
                    return "# 秒后";
                case "minute":
                    return "# 分钟后";
                case "hour":
                    return "# 小时后";
                case "day":
                    return "# 天后";
                case "week":
                    return "# 周后";
                case "month":
                    return "# 个月后";
                case "year":
                    return "# 年后";
            }
        },
        singular: ({ divisorKey }) => {
            switch (divisorKey) {
                case "second":
                    return "1秒";
                case "minute":
                    return "1分钟";
                case "hour":
                    return "1小时";
                case "day":
                    return "1天";
                case "week":
                    return "1周";
                case "month":
                    return "1个月";
                case "year":
                    return "1年";
            }
        },
        plural: ({ divisorKey }) => {
            switch (divisorKey) {
                case "second":
                    return "#秒";
                case "minute":
                    return "#分钟";
                case "hour":
                    return "#小时";
                case "day":
                    return "#天";
                case "week":
                    return "#周";
                case "month":
                    return "#个月";
                case "year":
                    return "#年";
            }
        }
    },
    CopyToClipboardIconButton: {
        "copied to clipboard": "已复制！",
        "copy to clipboard": "复制到剪贴板"
    },
    CustomDataGrid: {
        "empty directory": "此目录为空",
        "label rows count": ({ count }) => {
            return `已选择 ${count} 项`;
        },
        "label rows per page": "每页项目数"
    },
    CustomDataGridToolbarDensitySelector: {
        toolbarDensity: "密度",
        toolbarDensityStandard: "标准",
        toolbarDensityComfortable: "舒适",
        toolbarDensityCompact: "紧凑"
    },
    CustomDataGridToolbarColumnsButton: {
        toolbarColumnsLabel: "列"
    },
    DatasetCard: {
        publishedOn: "发布于",
        datasetPage: "数据集页面",
        license: "许可证：",
        format: "格式",
        size: "大小",
        distributions: "分发",
        visualize: "可视化",
        unknown: "未知"
    },
    DataCollection: {
        "page header help title": "只需输入您的 DCAT JSON-LD 模式的 https:// URL",
        "page header title": "数据目录",
        "page header help content": ({ demoCatalogLink }) => (
            <>
                只需输入数据目录的 <code>https://</code> URL 即可进行预览。
                <br />
                不知道从哪里开始？试试这个{" "}
                <MuiLink {...demoCatalogLink}>演示目录</MuiLink>！
            </>
        ),
        "https fetch error": "无法获取 HTTPS 资源。",
        "invalid json response": "响应不是有效的 JSON。",
        "json-ld compact error": "无法压缩 JSON-LD 响应。",
        "json-ld frame error": "无法对 JSON-LD 响应进行框架处理。",
        "datasets parsing error": "无法解析目录中的数据集。"
    }
    /* spell-checker: enable */
};
