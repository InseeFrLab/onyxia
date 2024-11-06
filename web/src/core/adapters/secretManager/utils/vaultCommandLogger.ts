import type { CommandLogger } from "core/tools/commandLogger";
import type { SecretsManager } from "core/ports/SecretsManager";
import { join as pathJoin } from "pathe";

export function getVaultCommandLogger(params: {
    clientType: "CLI";
    engine: string;
}): CommandLogger<SecretsManager> {
    const { clientType, engine } = params;

    switch (clientType) {
        case "CLI":
            return {
                initialHistory: [],
                methods: {
                    list: {
                        buildCmd: (...[{ path }]) =>
                            `vault kv list ${pathJoin(engine, path)}`,
                        fmtResult: ({ result: { directories, files } }) =>
                            [
                                "Keys",
                                "----",
                                ...[
                                    ...directories.map(directory => `${directory}/`),
                                    ...files
                                ]
                            ].join("\n")
                    },
                    get: {
                        buildCmd: (...[{ path }]) =>
                            `vault kv get ${pathJoin(engine, path)}`,
                        fmtResult: ({ result: secretWithMetadata }) => {
                            const n =
                                Math.max(
                                    ...Object.keys(secretWithMetadata.secret).map(
                                        key => key.length
                                    )
                                ) + 2;

                            return [
                                "==== Data ====",
                                `${"Key".padEnd(n)}Value`,
                                `${"---".padEnd(n)}-----`,
                                ...Object.entries(secretWithMetadata.secret).map(
                                    ([key, value]) =>
                                        key.padEnd(n) +
                                        (typeof value === "string"
                                            ? value
                                            : JSON.stringify(value))
                                )
                            ].join("\n");
                        }
                    },
                    put: {
                        buildCmd: (...[{ path, secret }]) =>
                            [
                                `vault kv put ${pathJoin(engine, path)}`,
                                ...Object.entries(secret).map(
                                    ([key, value]) =>
                                        `${key}=${
                                            typeof value === "string"
                                                ? `"${value.replace(/"/g, '\\"')}"`
                                                : typeof value === "number" ||
                                                    typeof value === "boolean"
                                                  ? value
                                                  : [
                                                        "-<<EOF",
                                                        `heredoc > ${JSON.stringify(
                                                            value,
                                                            null,
                                                            2
                                                        )}`,
                                                        "heredoc> EOF"
                                                    ].join("\n")
                                        }`
                                )
                            ].join(" \\\n"),
                        fmtResult: ({ inputs: [{ path }] }) =>
                            `Success! Data written to: ${pathJoin(engine, path)}`
                    },
                    delete: {
                        buildCmd: (...[{ path }]) =>
                            `vault kv delete ${pathJoin(engine, path)}`,
                        fmtResult: ({ inputs: [{ path }] }) =>
                            `Success! Data deleted (if it existed) at: ${pathJoin(
                                engine,
                                path
                            )}`
                    },
                    getToken: {
                        buildCmd: () =>
                            [
                                `# We generate a token`,
                                `# See https://www.vaultproject.io/docs/auth/jwt`
                            ].join("\n"),
                        fmtResult: ({ result: vaultToken }) =>
                            `The token we got is ${vaultToken}`
                    }
                }
            };
    }
}
