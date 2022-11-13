export const restApiPaths = {
    "catalogue": "/public/catalog",
    "services": "/public/our-lab/apps",
    "mesServices": "/my-lab/group",
    "userInfo": "/user/info",
    "nouveauService": "/my-lab/app",
    "nouveauGroupe": "/my-lab/group",
    "changerEtatService": "/my-lab/app",
    "myLab": {
        "app": "/my-lab/app"
    },
    "task": "/my-lab/task",
    "cloudShell": "/cloudshell",
    "servicesV2": "/my-lab/services",

    //TODO: Cleanup!
    "myServices": "/my-lab/services",
    "getService": "/my-lab/app",
    "deleteService": "/my-lab/app",
    "getLogs": "/my-lab/ui/logs",
    "configuration": "/public/configuration"
} as const;
