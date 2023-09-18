
import { assert, type Equals } from "tsafe/assert";
import { objectKeys } from "tsafe/objectKeys";
import * as assess_release_criteria from "./assess_release_criteria";
import * as release_helm_chart from "./release_helm_chart";

export const actions = {
    assess_release_criteria,
    release_helm_chart
} as const;

const actionNames = objectKeys(actions);

export type ActionName= (typeof actionNames)[number];