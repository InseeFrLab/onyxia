

import { Evt } from "evt";
import memoize from "memoizee";
import publicIpLib from "public-ip";

/** Memoized, can be called to pre fetch the IP */
const getPublicIpMemoized = memoize(
    () => publicIpLib.v4().catch(() => "0.0.0.0"),
    { "promise": true }
);

let isInit = false;

export function getPublicIp() {

    if (!isInit) {

        isInit = true;

        Evt.from(window, "online")
            .attach(() => getPublicIpMemoized.clear());

    }

    return getPublicIpMemoized();

}
