import { id } from "tsafe/id";
import memoizee from "memoizee";
import { assert as _assert } from "tsafe/assert";
import { getEnv } from "env";

const assert: typeof _assert = process.env["NODE_ENV"] === "test" ?
	(() => { }) : _assert;

function getEnvVar(key: string): string;
function getEnvVar(key: string, options: { mandatory: false; }): string | undefined;
function getEnvVar(key: string, options: { parseInt: true; }): number;
function getEnvVar(key: string, options: { mandatory: false; parseInt: true; }): number | undefined;
function getEnvVar(key: string, options?: { mandatory?: boolean; parseInt?: boolean; }): string | number | undefined {

	const { mandatory = true, parseInt = false } = options ?? {};

	let value = (getEnv() as any)[key] || undefined;

	if (mandatory) {
		assert(
			value !== undefined,
			[
				`The REACT_APP_${key} environnement variable need to be defined`,
				"update .env or .env.local then re-launch the app"
			].join(" ")
		);
	}

	if (parseInt && typeof value === "string") {
		value = window.parseInt(value);

		assert(
			!isNaN(value),
			`The REACT_${key} environnement variable is supposed to be a number`
		);

	}

	return value;

}

export const getValidatedEnv = memoizee(
	() => ({
		"API": {
			"BASE_URL": getEnvVar("BASE_API_URL", { "mandatory": false })
		},
		"CONTENT": {
			"SERVICES_URL": getEnvVar("SERVICES_URL"),
			"TRAININGS_URL": getEnvVar("TRAININGS_URL")
		},
		"APP": {
			"CONTACT": getEnvVar("CONTACT", { "mandatory": false }),
			"WARNING_MESSAGE": getEnvVar("WARNING_MESSAGE", { "mandatory": false }),
			"INFO_MESSAGE": getEnvVar("INFO_MESSAGE", { "mandatory": false })
		},
		"KUBERNETES": (() => {

			const KUB_SERVER_NAME = getEnvVar("KUB_SERVER_NAME", { "mandatory": false });

			if (KUB_SERVER_NAME === undefined) {
				return undefined;
			}

			return {
				KUB_SERVER_NAME,
				"KUB_SERVER_URL": getEnvVar("KUB_SERVER_URL")
			} as const;

		})(),
		"VAULT": {
			"BASE_URI": getEnvVar("VAULT_BASE_URI"),
			"ENGINE": getEnvVar("VAULT_KV_ENGINE"),
			"ROLE": getEnvVar("VAULT_ROLE")
		},
		"AUTHENTICATION": id<{
			TYPE: "oidc";
			OIDC: {
				clientId: string;
				realm: string;
				url: string;
			};
		} | {
			TYPE: "none";
		}>((() => {

			const TYPE = getEnvVar("AUTH_TYPE")?.toLowerCase() ?? "none";

			assert(TYPE === "oidc" || TYPE === "none");

			switch (TYPE) {
				case "none": return { TYPE } as const;
				case "oidc": return {
					TYPE,
					"OIDC": {
						"clientId": getEnvVar("AUTH_OIDC_CLIENT_ID"),
						"realm": getEnvVar("AUTH_OIDC_REALM"),
						"url": getEnvVar("AUTH_OIDC_URL")
					}
				} as const;
			}

		})()),
		"MINIO": {
			"BASE_URI": getEnvVar("MINIO_BASE_URI"),
			"END_POINT": getEnvVar("MINIO_END_POINT"),
			"PORT": getEnvVar("MINIO_PORT", { "parseInt": true }),
			"MINIMUM_DURATION": getEnvVar("MINIO_END_MINIMUM_DURATION_MS", { "parseInt": true })
		},
		"FOOTER": {
			"ONYXIA": {
				"GIT": getEnvVar("ONYXIA_GIT", { "mandatory": false }),
				"CHAT_ROOM": getEnvVar("ONYXIA_CHAT_ROOM", { "mandatory": false })
			},
			"SWAGGER_API": getEnvVar("SWAGGER_API", { "mandatory": false }),
			"MONITORING_URL": getEnvVar("MONITORING_URL", { "mandatory": false })
		}
	})
);
