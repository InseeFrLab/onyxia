import type { GenericTranslations } from "i18nifty";
import type { Language } from "core";
import { languages } from "./z";

export type { Language };
export { languages };

//If the user's browser language doesn't match any
//of the languages above specify the language to fallback to:
export const fallbackLanguage = "en";

export type ComponentKey =
    | typeof import("ui/pages/mySecrets/MySecrets").i18n
    | typeof import("ui/pages/mySecrets/SecretsExplorer").i18n
    | typeof import("ui/pages/mySecrets/MySecretsEditor").i18n
    | typeof import("ui/pages/mySecrets/SecretsExplorer/SecretsExplorerButtonBar").i18n
    | typeof import("ui/pages/mySecrets/SecretsExplorer/SecretsExplorerItems").i18n
    | typeof import("ui/pages/mySecrets/SecretsExplorer/SecretsExplorerItems/SecretsExplorerItem").i18n
    | typeof import("ui/pages/mySecrets/MySecretsEditor/MySecretsEditorRow").i18n
    | typeof import("ui/pages/myFiles/MyFiles").i18n
    | typeof import("ui/pages/myFiles/Explorer/Explorer").i18n
    | typeof import("ui/pages/myFiles/Explorer/ExplorerButtonBar").i18n
    | typeof import("ui/pages/myFiles/Explorer/ExplorerItems").i18n
    | typeof import("ui/pages/myFiles/Explorer/ExplorerItems/ExplorerItem").i18n
    | typeof import("ui/pages/myFiles/Explorer/ExplorerUploadModal/ExplorerUploadModalDropArea").i18n
    | typeof import("ui/pages/myFiles/Explorer/ExplorerUploadModal/ExplorerUploadProgress").i18n
    | typeof import("ui/pages/myFiles/Explorer/ExplorerUploadModal/ExplorerUploadModal").i18n
    | typeof import("ui/App/Header/Header").i18n
    | typeof import("ui/App/LeftBar").i18n
    | typeof import("ui/pages/page404/Page404").i18n
    | typeof import("ui/shared/PortraitModeUnsupported").i18n
    | typeof import("ui/pages/home/Home").i18n
    | typeof import("ui/pages/account/AccountField").i18n
    | typeof import("ui/pages/account/Account").i18n
    | typeof import("ui/pages/account/tabs/AccountInfoTab").i18n
    | typeof import("ui/pages/account/tabs/AccountIntegrationsTab").i18n
    | typeof import("ui/pages/account/tabs/AccountStorageTab").i18n
    | typeof import("ui/pages/account/tabs/AccountKubernetesTab").i18n
    | typeof import("ui/pages/account/tabs/AccountUserInterfaceTab").i18n
    | typeof import("ui/pages/account/tabs/AccountVaultTab").i18n
    | typeof import("ui/App/Footer").i18n
    | typeof import("ui/pages/catalog/Catalog").i18n
    | typeof import("ui/pages/catalog/CatalogChartCard").i18n
    | typeof import("ui/pages/catalog/CatalogNoSearchMatches").i18n
    | typeof import("ui/pages/launcher/Launcher").i18n
    | typeof import("ui/pages/launcher/LauncherMainCard").i18n
    | typeof import("ui/pages/launcher/LauncherConfigurationCard").i18n
    | typeof import("ui/pages/launcher/LauncherDialogs/AcknowledgeSharingOfConfigConfirmDialog").i18n
    | typeof import("ui/pages/launcher/LauncherDialogs/AutoLaunchDisabledDialog").i18n
    | typeof import("ui/pages/launcher/LauncherDialogs/NoLongerBookmarkedDialog").i18n
    | typeof import("ui/pages/launcher/LauncherDialogs/SensitiveConfigurationDialog").i18n
    | typeof import("ui/pages/myServices/MyServices").i18n
    | typeof import("ui/pages/myServices/MyServicesConfirmDeleteDialog").i18n
    | typeof import("ui/pages/myServices/MyServicesButtonBar").i18n
    | typeof import("ui/pages/myServices/MyServicesCards/MyServicesCard/MyServicesCard").i18n
    | typeof import("ui/pages/myServices/MyServicesCards/MyServicesCard/MyServicesRunningTime").i18n
    | typeof import("ui/pages/myServices/MyServicesCards/MyServicesCard/ReadmeAndEnvDialog/ReadmeAndEnvDialog").i18n
    | typeof import("ui/pages/myServices/MyServicesCards/MyServicesCard/ReadmeAndEnvDialog/CopyOpenButton").i18n
    | typeof import("ui/pages/myServices/MyServicesRestorableConfigs/MyServicesRestorableConfig/MyServicesRestorableConfigOptions").i18n
    | typeof import("ui/pages/myServices/MyServicesRestorableConfigs/MyServicesRestorableConfig").i18n
    | typeof import("ui/pages/myServices/MyServicesRestorableConfigs").i18n
    | typeof import("ui/pages/myServices/MyServicesCards").i18n
    | typeof import("ui/pages/myServices/MyServicesCards/NoRunningService").i18n
    | typeof import("ui/shared/CommandBar").i18n
    | typeof import("ui/shared/useMoment").i18n;

export type Translations<L extends Language> = GenericTranslations<
    ComponentKey,
    Language,
    typeof fallbackLanguage,
    L
>;
