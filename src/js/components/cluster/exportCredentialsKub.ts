import type { State as UserState } from "js/redux/user";
import { getEnv } from "js/env";

const env = getEnv();

const exportTypes = [
	{
		id: 'commandline',
		label: 'init-kub.sh',
		fileName: 'init-kub.sh',
		text: (c: UserState) =>
			`#!/bin/sh
kubectl config set-cluster ${env.KUBERNETES?.KUB_SERVER_NAME} --server=${env.KUBERNETES?.KUB_SERVER_URL}
kubectl config set-credentials ${c.IDEP} --token ${c.KEYCLOAK!.KC_ACCESS_TOKEN} 
kubectl config set-context ${env.KUBERNETES?.KUB_SERVER_NAME} --user=${c.IDEP} --cluster=${env.KUBERNETES?.KUB_SERVER_NAME} --namespace=${c.IDEP}
kubectl config use-context ${env.KUBERNETES?.KUB_SERVER_NAME}`,
	},
];

export default exportTypes;
