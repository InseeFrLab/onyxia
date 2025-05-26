import * as autoLogoutCountdown from "./autoLogoutCountdown";
import * as catalog from "./catalog";
import * as clusterEventsMonitor from "./clusterEventsMonitor";
import * as deploymentRegionManagement from "./deploymentRegionManagement";
import * as fileExplorer from "./fileExplorer";
import * as secretExplorer from "./secretExplorer";
import * as launcher from "./launcher";
import * as podLogs from "./podLogs";
import * as restorableConfigManagement from "./restorableConfigManagement";
import * as s3ConfigConnectionTest from "./s3ConfigConnectionTest";
import * as s3ConfigCreation from "./s3ConfigCreation";
import * as s3ConfigManagement from "./s3ConfigManagement";
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
    s3ConfigConnectionTest,
    s3ConfigCreation,
    s3ConfigManagement,
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
    viewQuotas
};
