import * as core from "@actions/core";
import { actions } from "./actions";
import { getActionName } from "./inputHelper";

(async () => {

    try {

        await actions[getActionName()].runProduction();

    } catch (error) {

        core.setFailed(String(error));

    }

})();

