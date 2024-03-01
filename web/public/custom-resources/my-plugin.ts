
// Can be transpiled to JavaScript with the following command: 
// node -e "require('child_process').exec('npx tsc --module commonjs --esModuleInterop false --noEmitOnError false --isolatedModules my-plugin.ts', ()=>{})"
import type { Onyxia } from "../../src/pluginSystem";

window.addEventListener("onyxiaready", () => {

    const onyxia: Onyxia = (window as any).onyxia;


    onyxia.addEventListener(eventName => {
        switch (eventName) {
            case "theme updated":
                console.log("Onyxia theme updated: ", onyxia.theme);
                break;
            case "language changed":
                console.log(`Language changed to ${onyxia.lang}`);
                break;
            case "route changed":
                console.log(`Route changed: ${onyxia.route.name}`);
                break;
            case "route params changed":
                console.log(`Route params changed: `, onyxia.route.params);
                break;
            default:
        }
    });

    console.log("Onyxia Global API ready", onyxia);

});