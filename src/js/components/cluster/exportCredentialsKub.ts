import type { State as UserState } from "js/redux/user";
import type { TokenState } from "lib/useCases/buildContract";
import { getEnv } from "js/env";

const env = getEnv();

const exportTypes = [
	{
		id: 'commandline',
		label: 'init-kub.sh',
		fileName: 'init-kub.sh',
		text: (user: UserState, tokenState: Pick<TokenState, "oidcTokens"> ) =>
			`#!/bin/sh
kubectl config set-cluster ${env.KUBERNETES?.KUB_SERVER_NAME} --server=${env.KUBERNETES?.KUB_SERVER_URL}
kubectl config set-credentials ${user.IDEP} --token ${tokenState.oidcTokens.accessToken} 
kubectl config set-context ${env.KUBERNETES?.KUB_SERVER_NAME} --user=${user.IDEP} --cluster=${env.KUBERNETES?.KUB_SERVER_NAME} --namespace=${user.IDEP}
kubectl config use-context ${env.KUBERNETES?.KUB_SERVER_NAME}`,
	},
];

export default exportTypes;
