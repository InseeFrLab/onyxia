import type { GenericTranslations } from "i18nifty";
import type { Language } from "core";
import { languages } from "./z";
export type { Language };
export { languages };

//If the user's browser language doesn't match any
//of the languages above specify the language to fallback to:
export const fallbackLanguage = "en";

export type ComponentKey =
    | import("ui/pages/mySecrets/Page").I18n
    | import("ui/pages/mySecrets/SecretsExplorer").I18n
    | import("ui/pages/mySecrets/MySecretsEditor").I18n
    | import("ui/pages/mySecrets/SecretsExplorer/SecretsExplorerButtonBar").I18n
    | import("ui/pages/mySecrets/SecretsExplorer/SecretsExplorerItems").I18n
    | import("ui/pages/mySecrets/SecretsExplorer/SecretsExplorerItems/SecretsExplorerItem").I18n
    | import("ui/pages/mySecrets/MySecretsEditor/MySecretsEditorRow").I18n
    | import("ui/pages/s3Explorer/dialogs/ConfirmBucketCreationAttemptDialog").I18n
    | import("ui/pages/s3Explorer/dialogs/ConfirmOverwriteDialog").I18n
    | import("ui/pages/s3Explorer/dialogs/CreateOrRenameBookmarkDialog").I18n
    | import("ui/pages/s3Explorer/dialogs/DirectoryCreationDialog").I18n
    | import("ui/pages/s3Explorer/dialogs/MakePrefixPublicDialog").I18n
    | import("ui/pages/s3Explorer/dialogs/ConfirmCustomS3ConfigDeletionDialog").I18n
    | import("ui/pages/s3Explorer/dialogs/DisplayErrorDialog").I18n
    | import("ui/shared/codex/S3ExplorerMainView/S3ExplorerMainView").I18n
    | import("ui/shared/codex/S3ShareObjectDialog").I18n
    | import("ui/pages/s3Explorer/dialogs/S3ShareObjectDialog").I18n
    | import("ui/pages/s3Explorer/dialogs/S3ProfileDialog").I18n
    | import("ui/pages/s3Explorer/Page").I18n
    | import("ui/shared/codex/S3Bookmarks/S3BookmarksBar").I18n
    | import("ui/shared/codex/S3Bookmarks/S3BookmarksBarItem/S3BookmarksBarItem").S3BookmarkItemI18n
    | import("ui/shared/codex/S3Bookmarks/S3BookmarksEntryPointItem").I18n
    | import("ui/shared/codex/S3DialogPrimitives").I18n
    | import("ui/shared/codex/S3ProfileSelect").I18n
    | import("ui/shared/codex/S3SelectionActionBar").I18n
    | import("ui/shared/codex/S3Uploads/ConfirmAbortUploadDialog").I18n
    | import("ui/shared/codex/S3Uploads/S3Uploads").I18n
    | import("ui/shared/codex/s3ProfileDialog/S3ProfileDetails").I18n
    | import("ui/shared/codex/s3ProfileDialog/S3ProfileForm").I18n
    | import("ui/App/Header/Header").I18n
    | import("ui/App/Header/ProjectSelect").I18n
    | import("ui/App/LeftBar").I18n
    | import("ui/App/AutoLogoutCountdown").I18n
    | import("ui/pages/page404/Page").I18n
    | import("ui/shared/PortraitModeUnsupported").I18n
    | import("ui/shared/MaybeAcknowledgeConfigVolatilityDialog").I18n
    | import("ui/pages/home/Page").I18n
    | import("ui/shared/SettingField").I18n
    | import("ui/pages/account/Page").I18n
    | import("ui/pages/account/AccountProfileTab/AccountProfileTab").I18n
    | import("ui/pages/account/AccountProfileTab/UserProfileForm").I18n
    | import("ui/pages/account/AccountProfileTab/ConfirmNavigationDialog").I18n
    | import("ui/pages/account/AccountGitTab").I18n
    | import("ui/pages/account/AccountKubernetesTab").I18n
    | import("ui/pages/account/AccountUserInterfaceTab").I18n
    | import("ui/pages/account/AccountVaultTab").I18n
    | import("ui/pages/account/AccountAiTab/AccountAiTab").I18n
    | import("ui/pages/account/AccountAiTab/ProviderValueField").I18n
    | import("ui/pages/account/AccountAiTab/ModelsSection").I18n
    | import("ui/pages/account/AccountAiTab/CustomProviderFormDialog").I18n
    | import("ui/App/Footer").I18n
    | import("ui/pages/catalog/Page").I18n
    | import("ui/pages/catalog/CatalogChartCard").I18n
    | import("ui/pages/catalog/CatalogNoSearchMatches").I18n
    | import("ui/pages/launcher/Page").I18n
    | import("ui/pages/launcher/LauncherMainCard").I18n
    | import("ui/pages/launcher/LauncherDialogs/AcknowledgeSharingOfConfigConfirmDialog").I18n
    | import("ui/pages/launcher/LauncherDialogs/AutoLaunchDisabledDialog").I18n
    | import("ui/pages/launcher/LauncherDialogs/NoLongerBookmarkedDialog").I18n
    | import("ui/pages/launcher/RootFormComponent/formFields/shared/FormFieldWrapper").I18n
    | import("ui/pages/launcher/RootFormComponent/ConfigurationTopLevelGroup").I18n
    | import("ui/pages/launcher/RootFormComponent/formFields/YamlCodeBlockFormField").I18n
    | import("ui/pages/launcher/RootFormComponent/formFields/TextFormField").I18n
    | import("ui/pages/launcher/RootFormComponent/formFields/SelectFormField").I18n
    | import("ui/pages/launcher/RootFormComponent/formFields/NumberFormField").I18n
    | import("ui/pages/launcher/RootFormComponent/FormFieldGroupComponent/FormFieldGroupComponent").I18n
    | import("ui/pages/launcher/RootFormComponent/FormFieldGroupComponent/AutoInjectSwitch").I18n
    | import("ui/pages/myService/Page").I18n
    | import("ui/pages/myService/PodLogsTab").I18n
    | import("ui/pages/myService/MyServiceButtonBar").I18n
    | import("ui/pages/myServices/Page").I18n
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
    | import("ui/pages/dataExplorer/Page").I18n
    | import("ui/pages/dataCollection/DatasetCard").I18n
    | import("ui/pages/dataCollection/Page").I18n
    | import("ui/pages/dataExplorer/UrlInput").I18n
    | import("ui/shared/codex/S3UriBar").I18n
    | import("ui/shared/CommandBar").I18n
    | import("ui/shared/formattedDate/type").I18n
    | import("ui/shared/CopyToClipboardIconButton").I18n
    | import("ui/shared/Datagrid/CustomDataGrid").I18n
    | import("ui/shared/Datagrid/CustomNoRowsOverlay").I18n
    | import("ui/shared/Datagrid/CustomDataGridToolbarDensitySelector").I18n
    | import("ui/shared/Datagrid/CustomDataGridToolbarColumnsButton").I18n
    | import("ui/shared/textEditor/DataTextEditor/DataTextEditor").I18n
    | import("ui/shared/textEditor/DataTextEditor/JsonSchemaDialog").I18n;

export type Translations<L extends Language> = GenericTranslations<
    ComponentKey,
    Language,
    typeof fallbackLanguage,
    L
>;
