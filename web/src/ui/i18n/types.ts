import type { GenericTranslations } from "i18nifty";
import type { Language } from "core";
import { assert, type Equals } from "tsafe/assert";

export type { Language };

//List the languages you with to support
export const languages = ["en", "fr", "zh-CN", "no", "fi", "nl", "it", "de"] as const;

assert<Equals<(typeof languages)[number], Language>>();

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
    | typeof import("ui/shared/Header").i18n
    | typeof import("ui/App/App").i18n
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
    | typeof import("ui/pages/catalog/CatalogLauncher/CatalogLauncher").i18n
    | typeof import("ui/pages/catalog/CatalogExplorer/CatalogExplorerCards").i18n
    | typeof import("ui/pages/catalog/CatalogExplorer/CatalogExplorerCards/CatalogExplorerCard").i18n
    | typeof import("ui/pages/catalog/Catalog").i18n
    | typeof import("ui/App/Footer").i18n
    | typeof import("ui/pages/catalog/CatalogLauncher/CatalogLauncherMainCard").i18n
    | typeof import("ui/pages/catalog/CatalogLauncher/CatalogLauncherConfigurationCard").i18n
    | typeof import("ui/pages/myServices/MyServices").i18n
    | typeof import("ui/pages/myServices/MyServicesButtonBar").i18n
    | typeof import("ui/pages/myServices/MyServicesCards/MyServicesCard/MyServicesCard").i18n
    | typeof import("ui/pages/myServices/MyServicesCards/MyServicesCard/MyServicesRunningTime").i18n
    | typeof import("ui/pages/myServices/MyServicesCards/MyServicesCard/ReadmeAndEnvDialog/ReadmeAndEnvDialog").i18n
    | typeof import("ui/pages/myServices/MyServicesCards/MyServicesCard/ReadmeAndEnvDialog/CopyOpenButton").i18n
    | typeof import("ui/pages/myServices/MyServicesSavedConfigs/MyServicesSavedConfig/MyServicesSavedConfigOptions").i18n
    | typeof import("ui/pages/myServices/MyServicesSavedConfigs/MyServicesSavedConfig").i18n
    | typeof import("ui/pages/myServices/MyServicesSavedConfigs").i18n
    | typeof import("ui/pages/myServices/MyServicesCards").i18n
    | typeof import("ui/pages/myServices/MyServicesCards/NoRunningService").i18n
    | typeof import("ui/shared/CommandBar").i18n;

export type Translations<L extends Language> = GenericTranslations<
    ComponentKey,
    Language,
    typeof fallbackLanguage,
    L
>;
