type K8s = {
    "K8S_CLUSTER": string;
    "K8S_USER": string;
    "K8S_SERVER_URL": string;
    "K8S_NAMESPACE": string;
    "K8S_TOKEN": string;
    "K8S_EXPIRATION": string;
};

export const exportK8sCredentials = [
    {
        id: "bash",
        label: "bash",
        fileName: "init-kub.sh",
        text: (c: K8s) =>
            `#!/bin/bash
kubectl config set-cluster ${c.K8S_CLUSTER} --server=${c.K8S_SERVER_URL}
kubectl config set-credentials ${c.K8S_USER} --token ${c.K8S_TOKEN} 
kubectl config set-context ${c.K8S_CLUSTER} --user=${c.K8S_USER} --cluster=${c.K8S_CLUSTER} --namespace=${c.K8S_NAMESPACE}
kubectl config use-context ${c.K8S_CLUSTER}
`,
    },
    {
        id: "shell",
        label: "shell",
        fileName: "init-kub.sh",
        text: (c: K8s) =>
            `#!/bin/sh
kubectl config set-cluster ${c.K8S_CLUSTER} --server=${c.K8S_SERVER_URL}
kubectl config set-credentials ${c.K8S_USER} --token ${c.K8S_TOKEN} 
kubectl config set-context ${c.K8S_CLUSTER} --user=${c.K8S_USER} --cluster=${c.K8S_CLUSTER} --namespace=${c.K8S_NAMESPACE}
kubectl config use-context ${c.K8S_CLUSTER}
`,
    },
];
