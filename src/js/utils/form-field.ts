import Mustache from 'mustache';
import type { RootState } from "js/../libs/setup";
import { getEnv } from "js/env";

const env = getEnv();

// Disable mustache html escaping
Mustache.escape = text => text;

export const getFieldSafeAttr = (field: Record<string, Field>) => {
	const media = (field.media && field.media.type && field.media.type) || '';
	return !field['x-form']
		? { ...field, hidden: false, media }
		: { ...field, ...field['x-form'], media };
};

const formatUser = (
	user: RootState["user"], 
	userProfileInVaultState: RootState["userProfileInVault"]
) => ({
	"user": {
		"idep": user.IDEP,
		"name": user.USERNAME,
		"email": user.USERMAIL,
		"password": userProfileInVaultState.userServicePassword.value,
		"key": user.USERKEY,
		"ip": user.IP,
	},
	"git": {
		"name": userProfileInVaultState.gitName.value,
		"email": user.USERMAIL,
		"credentials_cache_duration": userProfileInVaultState.gitCredentialCacheDuration.value
	},
	"status": user.STATUS,
	"keycloak": { ...user.KEYCLOAK },
	"kubernetes": env.KUBERNETES !== undefined ? { ...env.KUBERNETES } : undefined,
	"vault": { ...user.VAULT },
	"kaggleApiToken": userProfileInVaultState.kaggleApiToken.value,
	"s3": { ...user.S3 },
});
 



export const fromUser = 
	(user: RootState["user"], userProfileInVaultState: RootState["userProfileInVault"]) => 
		(field: Record<string, Field>) => {
			if (!field['x-form'] || !field['x-form'].value) return '';
			const { value } = field['x-form'];
			const formattedUser = formatUser(user, userProfileInVaultState);
			return Mustache.render(value, formattedUser);
		};

export type Field = {
	value: string;
	hidden: boolean;
	type: string;
};

export const filterOnglets = <T extends { description: string; nom: string; fields: { field: Record<string, Pick<Field, "hidden">> }[]; }[]>( onglets: T): T =>
	onglets.filter(
		({ fields }) =>
			fields.filter(({ field }) => !field['x-form'] || !field['x-form'].hidden)
				.length > 0
	) as any;
