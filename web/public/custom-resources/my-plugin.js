
console.log("Initializing Onyxia plugin at /custom-resources/my-plugin.js");

window.addEventListener("onyxiaready", ()=> {

    const onyxia = window.onyxia;

    onyxia.addEventListener(eventName=> {
        switch(eventName){
            case "theme updated": 
                console.log("Onyxia theme updated: ", onyxia.theme);
                break;
            case "lang updated": 
                console.log(`Language changed to ${onyxia.lang}`);
                break;
            default:
                // Never
        }

    });

    console.log("Onyxia Global API ready", onyxia);

});