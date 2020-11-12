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
	userProfileInVoltState: RootState["userProfileInVolt"]
) => ({
	"user": {
		"idep": user.IDEP,
		"name": user.USERNAME,
		"email": user.USERMAIL,
		"password": userProfileInVoltState.userServicePassword.value,
		"key": user.USERKEY,
		"ip": user.IP,
	},
	"git": {
		"name": userProfileInVoltState.gitName.value,
		"email": userProfileInVoltState.email.value,
		"credentials_cache_duration": userProfileInVoltState.gitCredentialCacheDuration.value
	},
	"status": user.STATUS,
	"keycloak": { ...user.KEYCLOAK },
	"kubernetes": env.KUBERNETES !== undefined ? { ...env.KUBERNETES } : undefined,
	"vault": { ...user.VAULT },
	"kaggleApiToken": userProfileInVoltState.kaggleApiToken.value,
	"s3": { ...user.S3 },
});
 



export const fromUser = 
	(user: RootState["user"], userProfileInVoltState: RootState["userProfileInVolt"]) => 
		(field: Record<string, Field>) => {
			if (!field['x-form'] || !field['x-form'].value) return '';
			const { value } = field['x-form'];
			const formattedUser = formatUser(user, userProfileInVoltState);
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
