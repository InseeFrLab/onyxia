
import { assert, type Equals } from "tsafe/assert";
import { objectKeys } from "tsafe/objectKeys";
import * as assess_release_criteria from "./assess_release_criteria";

export const actions = {
    assess_release_criteria
} as const;

const actionNames = objectKeys(actions);

export type ActionName= (typeof actionNames)[number];