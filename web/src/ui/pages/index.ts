import { type RouterOpts, mergeRouteDefs } from "type-route";

import * as account from "./account";
import * as catalog from "./catalog";
import * as launcher from "./launcher";
import * as home from "./home";
import * as myFiles from "./fileExplorer";
import * as mySecrets from "./mySecrets";
import * as myService from "./myService";
import * as myServices from "./myServices";
import * as page404 from "./page404";
import * as projectSettings from "./projectSettings";
import * as document from "./document";
import * as sqlOlapShell from "./sqlOlapShell";
import * as dataExplorer from "./dataExplorer";
import * as fileExplorer from "./fileExplorerEntry";
import * as dataCollection from "./dataCollection";

export const pages = {
    account,
    catalog,
    launcher,
    home,
    myFiles,
    mySecrets,
    myService,
    myServices,
    page404,
    projectSettings,
    document,
    sqlOlapShell,
    dataExplorer,
    fileExplorer,
    dataCollection
};

export const { routeDefs } = mergeRouteDefs({ pages });

export const routerOpts = {
    queryStringSerializer: launcher.queryStringSerializer
} satisfies RouterOpts;
