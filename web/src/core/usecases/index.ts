import * as autoLogoutCountdown from "./autoLogoutCountdown";
import * as catalog from "./catalog";
import * as clusterEventsMonitor from "./clusterEventsMonitor";
import * as deploymentRegionManagement from "./deploymentRegionManagement";
import * as fileExplorer from "./fileExplorer";
import * as secretExplorer from "./secretExplorer";
import * as launcher from "./launcher";
import * as podLogs from "./podLogs";
import * as restorableConfigManagement from "./restorableConfigManagement";
import * as serviceDetails from "./serviceDetails";
import * as serviceManagement from "./serviceManagement";
import * as userAuthentication from "./userAuthentication";
import * as userProfileForm from "./userProfileForm";
import * as userConfigs from "./userConfigs";
import * as secretsEditor from "./secretsEditor";
import * as s3CodeSnippets from "./s3CodeSnippets";
import * as k8sCodeSnippets from "./k8sCodeSnippets";
import * as vaultCredentials from "./vaultCredentials";
import * as sqlOlapShell from "./sqlOlapShell";
import * as dataExplorer from "./dataExplorer";
import * as projectManagement from "./projectManagement";
import * as viewQuotas from "./viewQuotas";
import * as dataCollection from "./dataCollection";

import * as s3ProfilesManagement from "./_s3Next/s3ProfilesManagement";
import * as s3ProfilesCreationUiController from "./_s3Next/s3ProfilesCreationUiController";
import * as s3ExplorerRootUiController from "./_s3Next/s3ExplorerRootUiController";

export const usecases = {
    autoLogoutCountdown,
    catalog,
    clusterEventsMonitor,
    deploymentRegionManagement,
    fileExplorer,
    secretExplorer,
    launcher,
    podLogs,
    restorableConfigManagement,
    serviceDetails,
    serviceManagement,
    userAuthentication,
    userProfileForm,
    userConfigs,
    secretsEditor,
    s3CodeSnippets,
    k8sCodeSnippets,
    vaultCredentials,
    sqlOlapShell,
    dataExplorer,
    projectManagement,
    viewQuotas,
    dataCollection,
    // Next
    s3ProfilesManagement,
    s3ProfilesCreationUiController,
    s3ExplorerRootUiController
};
