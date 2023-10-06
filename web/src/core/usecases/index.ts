import * as catalogExplorer from "./catalogExplorer";
import * as deploymentRegion from "./deploymentRegion";
import * as fileExplorer from "./fileExplorer";
import * as secretExplorer from "./secretExplorer";
import * as launcher from "./launcher";
import * as projectConfigs from "./projectConfigs";
import * as publicIp from "./publicIp";
import * as restorablePackageConfigs from "./restorablePackageConfigs";
import * as serviceManager from "./serviceManager";
import * as userAuthentication from "./userAuthentication";
import * as userConfigs from "./userConfigs";
import * as secretsEditor from "./secretsEditor";
import * as s3Credentials from "./s3Credentials";
import * as k8sCredentials from "./k8sCredentials";
import * as vaultCredentials from "./vaultCredentials";
import * as userAccountManagement from "./userAccountManagement";

export const usecases = {
    catalogExplorer,
    deploymentRegion,
    fileExplorer,
    secretExplorer,
    launcher,
    projectConfigs,
    publicIp,
    restorablePackageConfigs,
    serviceManager,
    userAuthentication,
    userConfigs,
    secretsEditor,
    s3Credentials,
    k8sCredentials,
    vaultCredentials,
    userAccountManagement
};
