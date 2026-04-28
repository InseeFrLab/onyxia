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
        git: "Git",
        "user-interface": "变换显示模式",
        k8sCodeSnippets: "Kubernetes",
        text1: "我的账号",
        text2: "访问我的账号信息",
        text3: "设置您的用户名, 电子邮件, 密码和访问令牌",
        "personal tokens tooltip": "服务的访问令牌",
        vault: "Vault",
        ai: "AI"
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
    AccountAiGatewayTab: {
        "credentials section title": "AI 网关凭据",
        "credentials section helper": ({ webUiUrl }) => (
            <>
                您的 OIDC 会话使您可以无缝访问 AI 网关。{" "}
                <MuiLink href={webUiUrl} target="_blank">
                    打开 AI 网关
                </MuiLink>
            </>
        ),
        "api base url": "API 基础 URL",
        token: "令牌",
        "model section title": "默认模型",
        "model section helper": "当您启动支持 AI 辅助的服务时，将预先配置此模型。",
        "model label": "模型",
        "no account": ({ webUiUrl }) => (
            <>
                您还没有 AI 网关账户。请先登录{" "}
                <MuiLink href={webUiUrl} target="_blank">
                    {webUiUrl}
                </MuiLink>{" "}
                以创建您的账户。
            </>
        )
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
    ConfirmOverwriteDialog: {
        "dialog title": "文件已存在",
        "dialog body": "是否要覆盖现有文件？",
        "no, keep the existing file": "否，保留现有文件",
        "yes, overwrite": "是，覆盖"
    },
    ConfirmCustomS3ConfigDeletionDialog: {
        "dialog title": "确认删除自定义 S3 配置？",
        cancel: "取消",
        yes: "是"
    },
    DisplayErrorDialog: {
        error: "错误",
        ok: "确定"
    },
    S3Explorer: {
        "page header title": "数据存储",
        "create profile": "创建配置文件",
        back: "返回",
        upload: "上传",
        "create new folder": "创建新文件夹",
        "download file": "下载文件"
    },
    S3ShareObjectDialogContainer: {
        "dialog title": "共享对象"
    },
    S3BookmarksBar: {
        "s3 bookmarks aria label": "S3 书签",
        "show more bookmarks": "显示更多书签"
    },
    S3BookmarkItem: {
        "open bookmark": "打开书签",
        "open bucket": "打开存储桶",
        "bookmark actions": "书签操作",
        rename: "重命名",
        delete: "删除",
        "rename bookmark": "重命名书签",
        "delete bookmark": "删除书签"
    },
    S3BookmarksEntryPointList: {
        "s3 bookmark entry points aria label": "S3 书签入口",
        bookmarks: "书签",
        "no bookmarks yet": "暂无书签。",
        "storage locations": "存储位置"
    },
    S3DialogCopyField: {
        "generating url": "正在生成 URL...",
        copy: "复制",
        copied: "已复制"
    },
    S3DialogItemSummary: {
        public: "公开"
    },
    S3ProfileSelect: {
        "select s3 profile aria label": "选择 S3 配置文件",
        "profile settings aria label": "配置文件设置",
        "s3 profiles aria label": "S3 配置文件",
        "new s3 profile": "新建 S3 配置文件"
    },
    S3SelectionActionBar: {
        download: "下载",
        delete: "删除",
        "copy s3 uri": "复制 S3 URI",
        copied: "已复制",
        "copy s3 uri tooltip": ({ s3UriStr }) => `复制 "${s3UriStr}"`,
        "add to bookmarks": "添加到书签",
        "delete from bookmarks": "从书签中删除",
        share: "共享",
        "make public": "设为公开",
        "make private": "设为私有",
        "one selected": "已选择 1 项",
        "many selected": ({ count }) => `已选择 ${count} 项`,
        "clear selection": "清除选择"
    },
    ConfirmAbortUploadDialog: {
        "dialog title": "取消上传？",
        "dialog body": "上传尚未完成。要取消上传吗？",
        "continue upload": "继续上传",
        "cancel upload": "取消上传"
    },
    S3Uploads: {
        "uploading count": ({ count }) => `正在上传 ${count} 个项目...`,
        "upload count": ({ count }) => `${count} 个上传`,
        "expand uploads": "展开上传",
        "collapse uploads": "折叠上传",
        "close uploads": "关闭上传",
        "uploading status": "正在上传...",
        completed: "已完成",
        error: "错误",
        "uploaded size of total size": ({ uploadedSize, totalSize }) =>
            `${uploadedSize} / ${totalSize}`,
        of: "共",
        "open uploaded directory": "打开已上传目录",
        "cancel upload": "取消上传",
        "retry upload": "重试上传"
    },
    CustomNoRowsOverlay: {
        "no rows": "无行"
    },
    DataTextEditor: {
        "not a valid format": ({ format }) => `不是有效格式: ${format}`,
        format: "格式",
        "all defaults": "全部默认值",
        schema: "架构"
    },
    JsonSchemaDialog: {
        "json schema": "JSON 架构",
        ok: "确定"
    },
    SelectFormField: {
        "empty string": "(空字符串)"
    },
    CreateOrRenameBookmarkDialog: {
        "dialog title": "书签名称",
        "add dialog title": "将此位置添加到书签",
        "rename dialog title": "重命名书签",
        "dialog subtitle": "保存此 S3 位置，以便之后更快访问。",
        "bookmarkName textField label": "名称",
        "bookmarkName textField empty error": "书签名称不能为空",
        "copy s3 path aria label": "复制 S3 路径",
        cancel: "取消",
        ok: "确定",
        "add to bookmarks": "添加到书签",
        "rename bookmark": "重命名书签"
    },
    DirectoryCreationDialog: {
        "dialog title": "创建文件夹",
        "dialog subtitle": "在此位置创建一个类似文件夹的前缀",
        "dialog body":
            "S3 不会将文件夹存储为真实对象。此操作只会从当前位置打开一个新的前缀片段，以便你在其下上传对象。只有当至少一个对象使用该前缀时，这个文件夹才会显示；空文件夹在 S3 中并不存在。",
        "folderName textField label": "文件夹名称",
        "folderName textField empty error": "文件夹名称不能为空",
        "folderName textField duplicate error": "文件夹名称已存在",
        cancel: "取消",
        "create folder": "创建文件夹"
    },
    MakePrefixPublicDialog: {
        "dialog title": "公开前缀",
        "make public dialog title": "公开此前缀？",
        "make private dialog title": "将此前缀设为私有？",
        "make public dialog body main":
            "此前缀中的所有文件都将可通过链接访问，包括当前和未来的内容。",
        "make public dialog body alternative":
            "如果只想共享特定文件或限制访问时间，请改为创建共享链接。",
        "make private dialog body main":
            "此前缀中的所有文件都可通过链接访问，包括当前和未来的内容。将此前缀设为私有会移除公开访问。",
        "make private dialog body alternative":
            "如果只想共享特定文件或限制访问时间，请改为创建共享链接。",
        "dialog body": ({ s3Uri, s3UriClassName }) => (
            <>
                你即将公开 <span className={s3UriClassName}>{s3Uri}</span>
                。任何人都可以列出并下载此前缀中当前和未来的所有对象。
                <br />
                <br />
                你分享的此前缀中对象的下载链接将永不过期。
            </>
        ),
        cancel: "取消",
        "make public": "公开",
        "make private": "设为私有"
    },
    S3ExplorerMainView: {
        "create prefix dialog title": "创建前缀",
        "create prefix dialog subtitle": "在当前 S3 位置内创建一个新前缀。",
        "prefix name field label": "前缀名称",
        "prefix name empty error": "前缀名称不能为空。",
        cancel: "取消",
        "create prefix": "创建前缀",
        "delete selection dialog title": "删除所选项",
        "delete selection dialog subtitle": "此操作会永久删除所选项目。",
        "delete selection dialog body": ({ count }) =>
            `你即将删除 ${count} 个所选项目。删除前缀也会删除其中的所有内容。`,
        delete: "删除",
        share: "共享",
        download: "下载",
        "copy s3 uri": "复制 S3 URI",
        copied: "已复制",
        "copy s3 uri tooltip": ({ s3UriStr }) => `复制 "${s3UriStr}"`,
        "add to bookmarks": "添加到书签",
        "delete from bookmarks": "从书签中删除",
        "make public": "公开",
        "make private": "设为私有",
        folder: "文件夹",
        object: "对象",
        "folder is public": "文件夹是公开的",
        "folder is private": "文件夹是私有的",
        today: "今天",
        yesterday: "昨天",
        "access denied": "访问被拒绝",
        "bucket not found": "未找到存储桶",
        "access denied description": "你没有权限列出此 S3 位置。",
        "bucket not found description":
            "请求的存储桶不存在，或无法使用当前配置文件访问。",
        "select item": ({ itemName }) => `选择 ${itemName}`,
        "select all items": "选择所有项目",
        public: "公开",
        deleting: "正在删除...",
        uploading: "正在上传",
        "drag and drop to import files": "拖放以导入文件",
        "go back": "返回",
        "no objects found": "未找到对象",
        "no objects found description": ({ s3UriStr }) =>
            `没有键以 "${s3UriStr}" 开头的对象。`,
        "this prefix is empty": "此前缀为空",
        "empty prefix description": "上传文件或创建文件夹以开始填充此位置。",
        "empty prefix upload description": "在此上传文件，或将文件拖放到此区域。",
        "upload files": "上传文件",
        "upload files here": "在此上传文件",
        "drop files here hint": "将文件拖放到此区域中的任意位置即可上传。",
        "new folder": "新建文件夹",
        name: "名称",
        "last modified": "最后修改",
        size: "大小"
    },
    S3ShareObjectDialog: {
        "generating public URL": "正在生成公开 URL...",
        "copy public URL aria label": "复制公开 URL",
        "signed URL with limited validity period": "带有限有效期的签名 URL",
        "signed link validity aria label": "签名链接有效期",
        "generating signed URL": "正在生成签名 URL...",
        "copy signed URL aria label": "复制签名 URL",
        "public sharing note":
            "任何拥有该 URL 的人都可以访问此对象。由于该对象位于公开前缀中，因此链接永不过期。",
        "signed URL expiration note":
            "若要共享永不过期的 URL，请公开此对象的某个上级前缀。",
        "validity duration one hour": "1 小时",
        "validity duration one day": "1 天",
        "validity duration one week": "1 周",
        "selected duration": "所选时长"
    },
    S3ProfileDialog: {
        "detail title": "S3 配置文件详情",
        "create title": "新建自定义 S3 配置文件",
        "edit title": "编辑自定义 S3 配置文件",
        "close aria label": "关闭 S3 配置文件对话框"
    },
    S3ProfileDetails: {
        "read only": "只读",
        custom: "自定义",
        edit: "编辑",
        delete: "删除",
        "connection details title": "连接详情",
        "connection details subtitle": "在资源管理器外配置 S3 客户端时使用这些值。",
        "endpoint url label": "端点 URL",
        "default region label": "默认区域",
        "access credentials title": "访问凭据",
        "access credentials anonymous subtitle":
            "此配置文件不公开凭据。当目标存储桶允许时，请使用匿名 S3 访问。",
        "access credentials subtitle": "复制正在配置的客户端所需的值。",
        "access key id label": "访问密钥 ID",
        "secret access key label": "秘密访问密钥",
        "session token label": "会话令牌",
        "environment variable": "环境变量",
        "no expiration": "这些凭据未提供过期时间。",
        expires: ({ expirationTime }) => `过期时间：${expirationTime}。`,
        renewing: "正在续期...",
        "renew tokens": "续期令牌",
        "init script title": "在 Datalab 服务外访问你的存储",
        "init script subtitle": "下载或复制所选编程语言的初始化脚本。",
        "technology aria label": "技术",
        download: "下载",
        "select s3 profile aria label": "选择 S3 配置文件",
        "s3 profiles aria label": "S3 配置文件",
        "new s3 profile": "新建 S3 配置文件",
        "copy aria label": ({ what }) => `复制${what}`,
        copied: "已复制",
        copy: "复制"
    },
    S3ProfileForm: {
        "must be an url": "请输入有效的 URL。",
        "is required": "此字段为必填项。",
        "not a valid access key id": "请输入有效的访问密钥 ID。",
        "profile name already used": "此配置文件名称已被使用。",
        "connection details title": "连接详情",
        "connection details subtitle": "定义资源管理器使用的配置文件名称和 S3 端点。",
        "profile name label": "配置文件名称",
        "s3 service url label": "S3 服务 URL",
        "s3 service url helper": "示例：https://minio.lab.example.net",
        "default region label": "默认区域",
        "default region helper": "示例：eu-west-1，如不确定请留空",
        "url style title": "URL 样式",
        "url style subtitle": "指定 S3 服务器如何生成文件下载 URL。",
        "path style": "路径样式",
        "virtual hosted style": "虚拟主机样式",
        example: "示例",
        "account credentials title": "账户凭据",
        "account credentials subtitle": "选择此配置文件使用匿名访问还是显式凭据。",
        "anonymous access": "匿名访问",
        "access key id label": "访问密钥 ID",
        "access key id helper": "示例：ASIAIOSFODNN7EXAMPLE",
        "secret access key label": "秘密访问密钥",
        "secret access key helper": "示例：wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
        "session token label": "会话令牌",
        "session token helper": "可选。如果你的凭据不包含会话令牌，请留空。",
        cancel: "取消",
        "save configuration": "保存配置",
        "create profile": "创建配置文件"
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
    SecretsExplorerItem: {
        description: "描述"
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
    Header: {
        login: "登录",
        logout: "登出",
        region: "区域"
    },
    ProjectSelect: {
        project: "项目"
    },
    LeftBar: {
        reduce: "缩小",
        home: "我的主页",
        account: "我的账号",
        catalog: "服务目录",
        myServices: "我的服务",
        mySecrets: "我的密钥",
        "divider: services features": "服务功能",
        "divider: external services features": "外部服务功能",
        "divider: onyxia instance specific features": "Onyxia实例特定功能",
        dataExplorer: "数据浏览器",
        dataCollection: "集合浏览器",
        s3Explorer: "数据存储",
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
        global: "global",
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
        "toggle password visibility": "切换密码可见性",
        loading: "正在加载..."
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
        "new logs are displayed in realtime": "新日志实时显示",
        follow: "跟随"
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
        ),
        close: "关闭"
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
        "trash my own": "删除您的所有服务",
        events: "事件"
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
        reset: "清空",
        "data source": "数据源"
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
    },
    S3UriBar: {
        explore: "浏览..",
        "copy s3 path": "复制 S3 路径",
        copied: "已复制",
        "copied path": ({ s3Uri }) => `已复制路径：${s3Uri}`,
        "add to bookmarks": "添加到书签",
        "delete from bookmarks": "从书签中删除",
        "pinned storage location": "已固定的存储位置",
        bookmarked: "已添加书签",
        "edit s3 uri": "编辑 S3 URI",
        prefix: "前缀",
        "admin bookmark": "管理员书签",
        bookmark: "书签",
        object: "对象",
        public: "公开",
        "go to s3 uri": ({ s3Uri, isPublic }) =>
            `${isPublic ? "公开。 " : ""}转到 ${s3Uri}`,
        "s3 uri": "S3 URI",
        "edit from s3 root": "从 S3 根目录编辑",
        "edit object key": "编辑对象键",
        "object key": "对象键",
        listing: "正在列出..."
    }
};
