import type { GenericTranslations } from "i18nifty";
import type { Language } from "core";
import { languages } from "./z";
export type { Language };
export { languages };

//If the user's browser language doesn't match any
//of the languages above specify the language to fallback to:
export const fallbackLanguage = "en";

export type ComponentKey =
    | import("ui/pages/mySecrets/MySecrets").I18n
    | import("ui/pages/mySecrets/SecretsExplorer").I18n
    | import("ui/pages/mySecrets/MySecretsEditor").I18n
    | import("ui/pages/mySecrets/SecretsExplorer/SecretsExplorerButtonBar").I18n
    | import("ui/pages/mySecrets/SecretsExplorer/SecretsExplorerItems").I18n
    | import("ui/pages/mySecrets/SecretsExplorer/SecretsExplorerItems/SecretsExplorerItem").I18n
    | import("ui/pages/mySecrets/MySecretsEditor/MySecretsEditorRow").I18n
    | import("ui/pages/fileExplorerEntry/FileExplorerEntry").I18n
    | import("ui/pages/fileExplorerEntry/S3Entries/S3EntryCard").I18n
    | import("ui/pages/fileExplorerEntry/FileExplorerDisabledDialog").I18n
    | import("ui/pages/fileExplorer/Explorer/Explorer").I18n
    | import("ui/pages/fileExplorer/Explorer/ExplorerButtonBar").I18n
    | import("ui/pages/fileExplorer/Explorer/ExplorerItems").I18n
    | import("ui/pages/fileExplorer/Explorer/ExplorerItems/ExplorerItem").I18n
    | import("ui/pages/fileExplorer/Explorer/ExplorerUploadModal/ExplorerUploadModalDropArea").I18n
    | import("ui/pages/fileExplorer/Explorer/ExplorerUploadModal/ExplorerUploadProgress").I18n
    | import("ui/pages/fileExplorer/Explorer/ExplorerUploadModal/ExplorerUploadModal").I18n
    | import("ui/pages/fileExplorer/Explorer/ListExplorer/ListExplorerItems").I18n
    | import("ui/pages/fileExplorer/Explorer/ExplorerDownloadSnackbar").I18n
    | import("ui/pages/fileExplorer/ShareFile/ShareDialog").I18n
    | import("ui/pages/fileExplorer/ShareFile/SelectTime").I18n
    | import("ui/App/Header/Header").I18n
    | import("ui/App/LeftBar").I18n
    | import("ui/App/AutoLogoutCountdown").I18n
    | import("ui/pages/page404/Page404").I18n
    | import("ui/shared/PortraitModeUnsupported").I18n
    | import("ui/shared/MaybeAcknowledgeConfigVolatilityDialog").I18n
    | import("ui/pages/home/Home").I18n
    | import("ui/shared/SettingField").I18n
    | import("ui/pages/account/Account").I18n
    | import("ui/pages/account/AccountProfileTab").I18n
    | import("ui/pages/account/AccountGitTab").I18n
    | import("ui/pages/account/AccountStorageTab").I18n
    | import("ui/pages/account/AccountKubernetesTab").I18n
    | import("ui/pages/account/AccountUserInterfaceTab").I18n
    | import("ui/pages/account/AccountVaultTab").I18n
    | import("ui/pages/projectSettings/ProjectSettings").I18n
    | import("ui/pages/projectSettings/ProjectSettingsS3ConfigTab/ProjectSettingsS3ConfigTab").I18n
    | import("ui/pages/projectSettings/ProjectSettingsS3ConfigTab/S3ConfigCard").I18n
    | import("ui/pages/projectSettings/ProjectSettingsS3ConfigTab/S3ConfigDialogs/AddCustomS3ConfigDialog").I18n
    | import("ui/pages/projectSettings/ProjectSettingsS3ConfigTab/TestS3ConnectionButton").I18n
    | import("ui/App/Footer").I18n
    | import("ui/pages/catalog/Catalog").I18n
    | import("ui/pages/catalog/CatalogChartCard").I18n
    | import("ui/pages/catalog/CatalogNoSearchMatches").I18n
    | import("ui/pages/launcher/Launcher").I18n
    | import("ui/pages/launcher/LauncherMainCard").I18n
    | import("ui/pages/launcher/LauncherDialogs/AcknowledgeSharingOfConfigConfirmDialog").I18n
    | import("ui/pages/launcher/LauncherDialogs/AutoLaunchDisabledDialog").I18n
    | import("ui/pages/launcher/LauncherDialogs/NoLongerBookmarkedDialog").I18n
    | import("ui/pages/launcher/RootFormComponent/formFields/shared/FormFieldWrapper").I18n
    | import("ui/pages/launcher/RootFormComponent/ConfigurationTopLevelGroup").I18n
    | import("ui/pages/launcher/RootFormComponent/formFields/YamlCodeBlockFormField").I18n
    | import("ui/pages/launcher/RootFormComponent/formFields/TextFormField").I18n
    | import("ui/pages/launcher/RootFormComponent/formFields/NumberFormField").I18n
    | import("ui/pages/launcher/RootFormComponent/FormFieldGroupComponent/FormFieldGroupComponent").I18n
    | import("ui/pages/myService/MyService").I18n
    | import("ui/pages/myService/PodLogsTab").I18n
    | import("ui/pages/myService/MyServiceButtonBar").I18n
    | import("ui/pages/myServices/MyServices").I18n
    | import("ui/pages/myServices/ClusterEventsDialog").I18n
    | import("ui/pages/myServices/MyServicesConfirmDeleteDialog").I18n
    | import("ui/pages/myServices/MyServicesButtonBar").I18n
    | import("ui/pages/myServices/MyServicesCards/MyServicesCard/MyServicesCard").I18n
    | import("ui/pages/myServices/MyServicesCards/MyServicesCard/ReadmeDialog/ReadmeDialog").I18n
    | import("ui/pages/myServices/MyServicesCards/MyServicesCard/ReadmeDialog/CopyOpenButton").I18n
    | import("ui/pages/myServices/MyServicesRestorableConfigs/MyServicesRestorableConfig/MyServicesRestorableConfigOptions").I18n
    | import("ui/pages/myServices/MyServicesRestorableConfigs/MyServicesRestorableConfig").I18n
    | import("ui/pages/myServices/MyServicesRestorableConfigs").I18n
    | import("ui/pages/myServices/MyServicesCards").I18n
    | import("ui/pages/myServices/MyServicesCards/NoRunningService").I18n
    | import("ui/pages/myServices/Quotas/CircularUsage").I18n
    | import("ui/pages/myServices/Quotas/Quotas").I18n
    | import("ui/pages/dataExplorer/DataExplorer").I18n
    | import("ui/pages/dataExplorer/UrlInput").I18n
    | import("ui/shared/CommandBar").I18n
    | import("ui/shared/formattedDate/type").I18n
    | import("ui/shared/CopyToClipboardIconButton").I18n
    | import("ui/shared/Datagrid/CustomDataGrid").I18n
    | import("ui/shared/Datagrid/CustomDataGridToolbarDensitySelector").I18n
    | import("ui/shared/Datagrid/CustomDataGridToolbarColumnsButton").I18n;

export type Translations<L extends Language> = GenericTranslations<
    ComponentKey,
    Language,
    typeof fallbackLanguage,
    L
>;
