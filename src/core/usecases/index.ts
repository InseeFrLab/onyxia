import * as catalogExplorer from "./catalogExplorer";
import * as deploymentRegion from "./deploymentRegion";
import * as fileExplorer from "./fileExplorer";
import * as secretExplorer from "./secretExplorer";
import * as launcher from "./launcher";
import * as projectConfig from "./projectConfigs";
import * as projectSelection from "./projectSelection";
import * as publicIp from "./publicIp";
import * as restorablePackageConfigs from "./restorablePackageConfigs";
import * as runningService from "./runningService";
import * as userAuthentication from "./userAuthentication";
import * as userConfigs from "./userConfigs";
import * as secretsEditor from "./secretsEditor";
import * as s3Credentials from "./s3Credentials";

/* ---------- Legacy ---------- */
import * as myFiles from "js/redux/myFiles";
import * as myLab from "js/redux/myLab";
import * as user from "js/redux/user";
import * as app from "js/redux/app";

export const usecases = {
    myFiles,
    myLab,
    app,
    user,
    catalogExplorer,
    deploymentRegion,
    fileExplorer,
    secretExplorer,
    launcher,
    projectConfig,
    projectSelection,
    publicIp,
    restorablePackageConfigs,
    runningService,
    userAuthentication,
    userConfigs,
    secretsEditor,
    s3Credentials
};
