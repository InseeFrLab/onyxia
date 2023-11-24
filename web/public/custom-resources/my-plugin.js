
console.log("Initializing Onyxia plugin at /custom-resources/my-plugin.js");

window.addEventListener("onyxiaready", ()=> {

    const onyxia = window.onyxia;

    onyxia.addEventListener(eventName=> {
        switch(eventName){
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