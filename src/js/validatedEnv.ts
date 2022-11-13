import memoizee from "memoizee";
import { getEnv } from "env";

export const getValidatedEnv = memoizee(() => ({
    "API": {
        "BASE_URL": getEnv().ONYXIA_API_URL
    },
    "CONTENT": {
        "SERVICES_URL": "",
        "TRAININGS_URL": ""
    },
    "APP": {
        "CONTACT": "",
        "WARNING_MESSAGE": "",
        "INFO_MESSAGE": ""
    },
    "KUBERNETES": {
        "KUB_SERVER_NAME": "",
        "KUB_SERVER_URL": ""
    },
    "VAULT": {
        "BASE_URI": "",
        "ENGINE": "",
        "ROLE": ""
    },
    "AUTHENTICATION": {
        /*
        "TYPE": "oidc",
        "OIDC": {
            "clientId": getEnvVar("AUTH_OIDC_CLIENT_ID"),
            "realm": getEnvVar("AUTH_OIDC_REALM"),
            "url": getEnvVar("AUTH_OIDC_URL"),
        },
        */
        "TYPE": "none"
    },
    /*
    "MINIO": {
        "BASE_URI": getEnv().MINIO_URL,
        "END_POINT": getEnv().MINIO_URL.split("//")[1].split(":")[0],
        "PORT": (() => {
            const str = getEnv().MINIO_URL.split(":")[1];

            return str === undefined
                ? getEnv().MINIO_URL.split("://")[1].toLowerCase() === "https"
                    ? 443
                    : 80
                : parseInt(str);
        })(),
        "MINIMUM_DURATION": 36000000,
    },
    */
    "FOOTER": {
        "ONYXIA": {
            "GIT": "",
            "CHAT_ROOM": ""
        },
        "SWAGGER_API": "",
        "MONITORING_URL": ""
    }
}));
