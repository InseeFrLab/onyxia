import * as account from "./account";
import * as catalog from "./catalog";
import * as home from "./home";
import * as myFiles from "./myFiles";
import * as mySecrets from "./mySecrets";
import * as myServices from "./myServices";
import * as page404 from "./page404";
import * as terms from "./terms";

import { objectKeys } from "tsafe/objectKeys";
import type { UnionToIntersection } from "tsafe";
import type { RouterOpts } from "type-route";

export const pages = {
    account,
    catalog,
    home,
    myFiles,
    mySecrets,
    myServices,
    page404,
    terms
};

export const routeDefs = {} as UnionToIntersection<
    (typeof pages)[keyof typeof pages]["routeDefs"]
>;

objectKeys(pages).forEach(pageName =>
    Object.assign(routeDefs, pages[pageName].routeDefs)
);

export const routerOpts = {
    "queryStringSerializer": catalog.queryStringSerializer
} satisfies RouterOpts;
