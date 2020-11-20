import Mustache from 'mustache';
import type { RootState } from "lib/setup";
import { getEnv } from "js/env";
import type { KeycloakConfig, VaultConfig } from "lib/useCases/tokens";
import type { OidcTokens } from "lib/ports/KeycloakClient";
import type { UserProfile } from "js/redux/user";
import type { UserProfileInVault } from "lib/useCases/userProfileInVault";

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
	s3: NonNullable<RootState["user"]["s3"]>;
	ip: string;
	userProfile: UserProfile;
	userProfileInVault: UserProfileInVault;
	keycloakConfig: KeycloakConfig;
	vaultConfig: VaultConfig;
	oidcTokens: OidcTokens;
	vaultToken: string;
};


//TODO: Rename
const buildMustacheView = (params: BuildMustacheViewParams) => {

	const {
		s3, ip, userProfile,
		userProfileInVault,
		vaultConfig, oidcTokens, vaultToken
	} = params;

	return {
		"user": {
			"idep": userProfile.idep,
			"name": userProfile.nomComplet,
			"email": userProfile.email,
			"password": userProfileInVault.userServicePassword,
			"key": "https://example.com/placeholder.gpg",
			"ip": ip,
		},
		"git": {
			"name": userProfileInVault.gitName,
			"email": userProfileInVault.gitEmail,
			"credentials_cache_duration": userProfileInVault.gitCredentialCacheDuration
		},
		"status": "",
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
			"VAULT_TOP_DIR": userProfile.idep,
		},
		"kaggleApiToken": userProfileInVault.kaggleApiToken,
		s3
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
