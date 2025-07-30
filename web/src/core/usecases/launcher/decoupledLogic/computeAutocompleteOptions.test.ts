import { describe, it, expect } from "vitest";
import { computeHelmValues } from "./computeHelmValues";
import { symToStr } from "tsafe/symToStr";
import { computeAutocompleteOptions } from "./computeAutocompleteOptions";

describe(symToStr({ computeHelmValues }), () => {
    it("case with arrays", () => {
        const got = computeAutocompleteOptions({
            helmValuesSchema: {
                type: "object",
                properties: {
                    s3Profiles: {
                        type: "array",
                        "x-onyxia": {
                            overwriteDefaultWith: "{{user.profile.s3Profiles}}"
                        },
                        items: {
                            type: "object",
                            properties: {
                                host: {
                                    type: "string",
                                    default: "",
                                    "x-onyxia": { overwriteDefaultWith: "{{host}}" }
                                },
                                accessKeyId: {
                                    type: "string",
                                    default: "",
                                    "x-onyxia": {
                                        overwriteDefaultWith: "{{accessKeyId}}"
                                    }
                                },
                                secretAccessKey: {
                                    type: "string",
                                    default: "",
                                    "x-onyxia": {
                                        overwriteDefaultWith: "{{secretAccessKey}}"
                                    }
                                }
                            }
                        }
                    }
                }
            },
            helmValues: {
                s3Profiles: [
                    {
                        host: "host_1",
                        accessKeyId: "access_key_id_1",
                        secretAccessKey: "secret_access_key_1"
                    },
                    {
                        host: "host_2",
                        accessKeyId: "access_key_id_2",
                        secretAccessKey: "secret_access_key_2"
                    },
                    {
                        host: "",
                        accessKeyId: "",
                        secretAccessKey: ""
                    }
                ]
            },
            helmValuesPath: ["s3Profiles", 2, "host"],
            xOnyxiaContext: {
                user: {
                    profile: {
                        s3Profiles: [
                            {
                                host: "host_1",
                                accessKeyId: "access_key_id_1",
                                secretAccessKey: "secret_access_key_1"
                            }
                        ]
                    }
                }
            } as any,
            xOnyxiaContext_autoCompleteOptions: {
                user: {
                    profile: {
                        s3Profiles: [
                            {
                                host: "host_2",
                                accessKeyId: "access_key_id_2",
                                secretAccessKey: "secret_access_key_2"
                            },
                            {
                                host: "host_3",
                                accessKeyId: "access_key_id_3",
                                secretAccessKey: "secret_access_key_3"
                            },
                            {
                                host: "host_4",
                                accessKeyId: "access_key_id_4",
                                secretAccessKey: "secret_access_key_4"
                            }
                        ]
                    }
                }
            }
        });

        expect(got).toStrictEqual([
            {
                optionValue: "host_3",
                overwrite: {
                    helmValuesPath: ["s3Profiles", 2],
                    helmValues_subtree: {
                        host: "host_3",
                        accessKeyId: "access_key_id_3",
                        secretAccessKey: "secret_access_key_3"
                    }
                }
            },
            {
                optionValue: "host_4",
                overwrite: {
                    helmValuesPath: ["s3Profiles", 2],
                    helmValues_subtree: {
                        host: "host_4",
                        accessKeyId: "access_key_id_4",
                        secretAccessKey: "secret_access_key_4"
                    }
                }
            }
        ]);
    });
});
