const exportTypes = [
	{
		id: 'commandeline',
		label: 'command',
		fileName: 'init-kub.sh',
		text: (c) =>
			`#!/bin/sh
kubectl config set-cluster ${c.KUBERNETES.KUB_SERVER_NAME} --server=${c.KUBERNETES.KUB_SERVER_URL}
kubectl config set-credentials ${c.USERNAME} --token ${c.KEYCLOAK.KC_ACCESS_TOKEN} 
kubectl config set-context ${c.KUBERNETES.KUB_SERVER_NAME} --user=${c.USERNAME} --cluster=${c.KUBERNETES.KUB_SERVER_NAME} --namespace=${c.USERNAME}
kubectl config use-context ${c.KUBERNETES.KUB_SERVER_NAME}`,
	},
];

export default exportTypes;
