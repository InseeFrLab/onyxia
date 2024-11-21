import * as account from "./account";
import * as catalog from "./catalog";
import * as launcher from "./launcher";
import * as home from "./home";
import * as myFiles from "./myFiles";
import * as mySecrets from "./mySecrets";
import * as myService from "./myService";
import * as myServices from "./myServices";
import * as page404 from "./page404";
import * as projectSettings from "./projectSettings";
import * as terms from "./terms";
import * as sqlOlapShell from "./sqlOlapShell";
import * as dataExplorer from "./dataExplorer";

import { objectKeys } from "tsafe/objectKeys";
import type { UnionToIntersection } from "tsafe";
import type { RouterOpts } from "type-route";

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
    terms,
    sqlOlapShell,
    dataExplorer
};

export const routeDefs = {} as UnionToIntersection<
    (typeof pages)[keyof typeof pages]["routeDefs"]
>;

objectKeys(pages).forEach(pageName =>
    Object.assign(routeDefs, pages[pageName].routeDefs)
);

export const routerOpts = {
    queryStringSerializer: launcher.queryStringSerializer
} satisfies RouterOpts;
