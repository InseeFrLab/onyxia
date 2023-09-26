
import { objectKeys } from "tsafe/objectKeys";
import * as prepare_release from "./prepare_release";
import * as release_helm_chart from "./release_helm_chart";
import * as checkout from "./checkout";

export const actions = {
    prepare_release,
    release_helm_chart,
    checkout
} as const;

const actionNames = objectKeys(actions);

export type ActionName= (typeof actionNames)[number];