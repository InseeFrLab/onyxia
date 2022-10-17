import { creatOrFallbackOidcClient } from "core/secondaryAdapters/keycloakOidcClient";
import { assert } from "tsafe/assert";

import type { ThunkAction, ThunksExtraArgument } from "core/setup";
import { selectors as deploymentRegionSelectors } from "./deploymentRegion";
import { selectors as projectSelectionSelectors } from "./projectSelection";
import { thunks as userAuthenticationThunk } from "./userAuthentication";

type SliceContext = {
    /** undefined when not authenticated */
    k8sClusterParams: K8sClusterParams | undefined;
};

const { getSliceContext, setSliceContext } = (() => {
    const weakMap = new WeakMap<ThunksExtraArgument, SliceContext>();

    function getSliceContext(extraArg: ThunksExtraArgument): SliceContext {
        const sliceContext = weakMap.get(extraArg);

        assert(sliceContext !== undefined, "Slice context not initialized");

        return sliceContext;
    }

    function setSliceContext(
        extraArg: ThunksExtraArgument,
        sliceContext: SliceContext,
    ): void {
        weakMap.set(extraArg, sliceContext);
    }

    return { getSliceContext, setSliceContext };
})();

const privateThunks = {
    "initialize":
        (): ThunkAction =>
        async (...args) => {
            const [dispatch, getState, extraArgs] = args;
            const { oidcClient, createStoreParams } = extraArgs;

            const { kubernetes } = deploymentRegionSelectors.selectedDeploymentRegion(
                getState(),
            );

            const project = projectSelectionSelectors.selectedProject(getState());

            assert(
                kubernetes !== undefined && kubernetes.keycloakParams !== undefined,
                "There is no specific kubernetes config in the region",
            );
            assert(oidcClient.isUserLoggedIn);
            assert(createStoreParams.userAuthenticationParams.method === "keycloak");

            const kubernetesOidcClient = await creatOrFallbackOidcClient({
                "fallback": {
                    "keycloakParams":
                        createStoreParams.userAuthenticationParams.keycloakParams,
                    oidcClient,
                },
                "keycloakParams": kubernetes.keycloakParams,
                "evtUserActivity": createStoreParams.evtUserActivity,
            });

            assert(kubernetesOidcClient.isUserLoggedIn);

            const user = dispatch(userAuthenticationThunk.getUser());
            const k8sClusterParams = {
                "K8S_CLUSTER": kubernetes.url,
                "K8S_USER": user.username,
                "K8S_SERVER_URL": kubernetes.url,
                "K8S_NAMESPACE": project.id,
                "K8S_TOKEN": kubernetesOidcClient.accessToken,
                "K8S_EXPIRATION": kubernetesOidcClient.expirationTime * 1000,
            };
            setSliceContext(extraArgs, { k8sClusterParams });
        },
};
export const reducer = null;
type K8sClusterParams = {
    "K8S_CLUSTER": string;
    "K8S_USER": string;
    "K8S_SERVER_URL": string;
    "K8S_NAMESPACE": string;
    "K8S_TOKEN": string;
    "K8S_EXPIRATION": number;
};

const exportK8sCredentials = [
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

type ExportContent = {
    scriptContent: string;
    fileName: string;
};

export const name = "initScriptsGenerator";

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

    "getK8sParamsForProjectBucket":
        (): ThunkAction<K8sClusterParams> =>
        (...args) => {
            const [, , extraArgs] = args;
            const k8sClusterParams = getSliceContext(extraArgs).k8sClusterParams;
            assert(k8sClusterParams !== undefined);
            return k8sClusterParams;
        },

    "getScriptLabels": (): ThunkAction<string[]> => () => {
        return exportK8sCredentials.map(({ label }) => label);
    },
    "initialize":
        (): ThunkAction =>
        async (...args) => {
            const [dispatch] = args;
            dispatch(privateThunks.initialize());
        },
};
