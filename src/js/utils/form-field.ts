import Mustache from 'mustache';
import type { RootState } from "lib/setup";
import { getValidatedEnv } from "app/validatedEnv";
import type { AppConstant } from "lib/useCases/appConstants";
import type { OidcTokens } from "lib/ports/OidcClient";
import type { UserConfigs } from "lib/useCases/userConfigs";


// Disable mustache html escaping
Mustache.escape = text => text;

export const getFieldSafeAttr = (field: Record<string, Field>) => {
	const media = (field.media && field.media.type && field.media.type) || '';
	return !field['x-form']
		? { ...field, hidden: false, media }
		: { ...field, ...field['x-form'], media };
};


export type BuildMustacheViewParams = {
	s3: NonNullable<RootState["user"]["s3"]>;
	ip: string;
	userProfile: AppConstant.LoggedIn["userProfile"];
	userConfigs: UserConfigs;
	keycloakConfig: AppConstant["keycloakConfig"];
	vaultClientConfig: AppConstant["vaultClientConfig"];
	oidcTokens: OidcTokens;
	vaultToken: string;
};


const buildMustacheView = (params: BuildMustacheViewParams) => {

	const env = getValidatedEnv();

	const {
		s3, ip, userProfile,
		userConfigs,
		vaultClientConfig, oidcTokens, vaultToken
	} = params;

	return {
		"user": {
			"idep": userProfile.idep,
			"name": userProfile.nomComplet,
			"email": userProfile.email,
			"password": userConfigs.userServicePassword,
			"key": "https://example.com/placeholder.gpg",
			"ip": ip,
		},
		"git": {
			"name": userConfigs.gitName,
			"email": userConfigs.gitEmail,
			"credentials_cache_duration": userConfigs.gitCredentialCacheDuration
		},
		"status": "",
		"keycloak": {
			"KC_ID_TOKEN": oidcTokens.idToken,
			"KC_REFRESH_TOKEN": oidcTokens.refreshToken,
			"KC_ACCESS_TOKEN": oidcTokens.accessToken
		},
		"kubernetes": env.KUBERNETES !== undefined ? { ...env.KUBERNETES } : undefined,
		"vault": {
			"VAULT_ADDR": vaultClientConfig.baseUri,
			"VAULT_TOKEN": vaultToken,
			"VAULT_MOUNT": vaultClientConfig.engine,
			"VAULT_TOP_DIR": userProfile.idep,
		},
		"kaggleApiToken": userConfigs.kaggleApiToken,
		"s3": {
			...s3,
			"AWS_BUCKET_NAME": userProfile.idep
		}
	};

};




//TODO: Rename
export const mustacheRender = (
	field: { 'x-form'?: { value: string; } },
	buildMustacheViewParams: BuildMustacheViewParams
) => {

	const { value: template = "" } = field?.["x-form"] ?? {};

	return Mustache.render(
		template,
		buildMustacheView(buildMustacheViewParams)
	);
};

export type Field = {
	value: string;
	hidden: boolean;
	type: string;
};

export const filterOnglets = <T extends { description: string; nom: string; fields: { field: Record<string, Pick<Field, "hidden">> }[]; }[]>(onglets: T): T =>
	onglets.filter(
		({ fields }) =>
			fields.filter(({ field }) => !field['x-form'] || !field['x-form'].hidden)
				.length > 0
	) as any;
