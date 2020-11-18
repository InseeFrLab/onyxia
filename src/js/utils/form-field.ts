import Mustache from 'mustache';
import type { RootState } from "js/../libs/setup";
import { getEnv } from "js/env";
import type { KeycloakConfig, VaultConfig } from "js/../libs/useCases/buildContract";
import type { OidcTokens } from "js/../libs/ports/KeycloakClient";

const env = getEnv();

// Disable mustache html escaping
Mustache.escape = text => text;

export const getFieldSafeAttr = (field: Record<string, Field>) => {
	const media = (field.media && field.media.type && field.media.type) || '';
	return !field['x-form']
		? { ...field, hidden: false, media }
		: { ...field, ...field['x-form'], media };
};

export type BuildMustacheViewParams = {
	user: RootState["user"];
	userProfileInVaultState: RootState["userProfileInVault"];
	keycloakConfig: KeycloakConfig;
	vaultConfig: VaultConfig;
	oidcTokens: OidcTokens;
	vaultToken: string;
};


//TODO: Rename
const buildMustacheView = (params: BuildMustacheViewParams) => {

	const {
		user, userProfileInVaultState,
		vaultConfig, oidcTokens, vaultToken
	} = params;

	return {
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
		"keycloak": {
			"KC_ID_TOKEN": oidcTokens.idToken,
			"KC_REFRESH_TOKEN": oidcTokens.refreshToken,
			"KC_ACCESS_TOKEN": oidcTokens.accessToken
		},
		"kubernetes": env.KUBERNETES !== undefined ? { ...env.KUBERNETES } : undefined,
		"vault": {
			"VAULT_ADDR": vaultConfig.baseUri,
			"VAULT_TOKEN": vaultToken,
			"VAULT_MOUNT": vaultConfig.engine,
			"VAULT_TOP_DIR": user.IDEP,
		},
		"kaggleApiToken": userProfileInVaultState.kaggleApiToken.value,
		"s3": { ...user.S3 },
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
