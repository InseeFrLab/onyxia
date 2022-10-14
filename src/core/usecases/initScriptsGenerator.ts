import type { ThunkAction } from "../setup";
import { createSlice } from "@reduxjs/toolkit";
import { id } from "tsafe/id";
import { K8sClusterParams } from "./launcher";
import { useMemo } from "react";

export const exportK8sCredentials = [
    {
        id: "bash",
        label: "bash",
        fileName: "init-kub.sh",
        text: (c: K8sClusterParams) =>
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
        text: (c: K8sClusterParams) =>
            `#!/bin/sh
kubectl config set-cluster ${c.K8S_CLUSTER} --server=${c.K8S_SERVER_URL}
kubectl config set-credentials ${c.K8S_USER} --token ${c.K8S_TOKEN} 
kubectl config set-context ${c.K8S_CLUSTER} --user=${c.K8S_USER} --cluster=${c.K8S_CLUSTER} --namespace=${c.K8S_NAMESPACE}
kubectl config use-context ${c.K8S_CLUSTER}
`,
    },
];

type InitScriptGeneratorState = string | null;

export type ExportContent = {
    scriptContent: string;
    fileName: string;
};

export const name = "initScriptsGenerator";

export const { reducer, actions } = createSlice({
    name,
    "initialState": id<InitScriptGeneratorState>(null),
    "reducers": {
        "k8sExportCredentials": () => null,
    },
});

export const thunks = {
    "k8sExportCredentials":
        (params: {
            k8sParams: K8sClusterParams;
            scriptLabel: string;
        }): ThunkAction<ExportContent> =>
        () => {
            const { k8sParams, scriptLabel } = params;
            const { text, fileName } = exportK8sCredentials.find(
                ({ label }) => label === scriptLabel,
            )!;

            const scriptContent = text({
                ...k8sParams,
            });

            return { scriptContent, fileName };
        },

    "getScriptLabels": (): ThunkAction<string[]> => () => {
        return useMemo(() => exportK8sCredentials.map(({ label }) => label), []);
    },
};
