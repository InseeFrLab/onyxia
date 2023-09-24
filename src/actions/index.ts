
import { assert, type Equals } from "tsafe/assert";
import { objectKeys } from "tsafe/objectKeys";
import * as prepare_release from "./prepare_release";
import * as release_helm_chart from "./release_helm_chart";

export const actions = {
    prepare_release,
    release_helm_chart
} as const;

const actionNames = objectKeys(actions);

export type ActionName= (typeof actionNames)[number];