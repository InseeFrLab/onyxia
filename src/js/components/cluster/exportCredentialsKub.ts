import { getValidatedEnv } from "js/validatedEnv";

const env = getValidatedEnv();

const exportTypes = [
    {
        id: "commandline",
        label: "init-kub.sh",
        fileName: "init-kub.sh",
        text: (params: { oidcAccessToken: string; idep: string }) =>
            `#!/bin/sh
kubectl config set-cluster ${env.KUBERNETES?.KUB_SERVER_NAME} --server=${env.KUBERNETES?.KUB_SERVER_URL}
kubectl config set-credentials ${params.idep} --token ${params.oidcAccessToken} 
kubectl config set-context ${env.KUBERNETES?.KUB_SERVER_NAME} --user=${params.idep} --cluster=${env.KUBERNETES?.KUB_SERVER_NAME} --namespace=${params.idep}
kubectl config use-context ${env.KUBERNETES?.KUB_SERVER_NAME}`
    }
];

export default exportTypes;
