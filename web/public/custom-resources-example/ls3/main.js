import { createHomeLS3 } from "./HomeLS3.js";
import { registerPageContainerListener } from "./registerPageContainerListener.js";

/** @typedef {import("../../../src/pluginSystem").Onyxia} Onyxia */

/** @param {Onyxia} onyxia */
export async function main(onyxia) {

    const { HomeLS3 } = await onyxia.import("ui/shared/HomeLS3");
    //const { HomeLS3 } = await createHomeLS3(onyxia);

    console.log("===>", import.meta.url);

    registerPageContainerListener("home", element => {

        element.innerHTML = "";

        onyxia.mountComponent({
            Component: HomeLS3,
            container: element
        });

    });

}
