import { assert } from "tsafe/assert";
import { same } from "evt/tools/inDepth/same";
import { getHelmValues_default } from "./getHelmValues_default";
import YAML from "yaml";

// npx tsx src/core/usecases/launcher/utils/getHelmValues_default.test.ts

{
    const xOnyxiaContext = {
        "a": {
            "b": {
                "r": "x-onyxia context"
            }
        },
        "s3": undefined
    };

    const got = getHelmValues_default({
        "helmValuesSchema": {
            "type": "object",
            "const": { "r": "const" },
            "default": { "r": "default" },
            "x-onyxia": {
                "overwriteDefaultWith": "a.b"
            }
        },
        "helmValuesYaml": YAML.stringify({
            "r": "values.yaml"
        }),
        xOnyxiaContext
    });

    const expected = {
        "helmValues_default": { "r": "const" },
        "isChartUsingS3": false
    };

    assert(same(got, expected));

    console.log("PASS - Use const");
}

{
    const xOnyxiaContext = {
        "a": {
            "b": {
                "r": "x-onyxia context"
            }
        },
        "s3": undefined
    };

    const got = getHelmValues_default({
        "helmValuesSchema": {
            "type": "object",
            "default": { "r": "default" },
            "x-onyxia": {
                "overwriteDefaultWith": "a.b"
            }
        },
        "helmValuesYaml": YAML.stringify({
            "r": "values.yaml"
        }),
        xOnyxiaContext
    });

    const expected = {
        "helmValues_default": { "r": "x-onyxia context" },
        "isChartUsingS3": false
    };

    assert(same(got, expected));

    console.log("PASS - Use x-onyxia");
}

{
    const xOnyxiaContext = {
        "a": {
            "b": {
                "r": "x-onyxia context"
            }
        },
        "s3": undefined
    };

    const got = getHelmValues_default({
        "helmValuesSchema": {
            "type": "object",
            "default": { "r": "default" }
        },
        "helmValuesYaml": YAML.stringify({
            "r": "values.yaml"
        }),
        xOnyxiaContext
    });

    const expected = {
        "helmValues_default": { "r": "default" },
        "isChartUsingS3": false
    };

    assert(same(got, expected));

    console.log("PASS - Use default");
}

{
    const xOnyxiaContext = {
        "a": {
            "b": {
                "r": "x-onyxia context"
            }
        },
        "s3": undefined
    };

    const got = getHelmValues_default({
        "helmValuesSchema": {
            "type": "object"
        },
        "helmValuesYaml": YAML.stringify({
            "r": "values.yaml"
        }),
        xOnyxiaContext
    });

    const expected = {
        "helmValues_default": { "r": "values.yaml" },
        "isChartUsingS3": false
    };

    assert(same(got, expected));

    console.log("PASS - Use values.yaml");
}

{
    const xOnyxiaContext = {
        "a": {},
        "s3": undefined
    };

    const got = getHelmValues_default({
        "helmValuesSchema": {
            "type": "object",
            "default": { "r": "default" },
            "x-onyxia": {
                "overwriteDefaultWith": "a.b"
            }
        },
        "helmValuesYaml": YAML.stringify({}),
        xOnyxiaContext
    });

    const expected = {
        "helmValues_default": { "r": "default" },
        "isChartUsingS3": false
    };

    assert(same(got, expected));

    console.log("PASS - Use default if can't resolve in x-onyxia context");
}

{
    const xOnyxiaContext = {
        "s3": undefined
    };

    try {
        getHelmValues_default({
            "helmValuesSchema": {
                "type": "object"
            },
            "helmValuesYaml": YAML.stringify({}),
            xOnyxiaContext
        });

        assert(false);
    } catch {
        console.log("PASS - Choke if can't find a default");
    }
}

{
    const xOnyxiaContext = {
        "s3": undefined
    };

    const got = getHelmValues_default({
        "helmValuesSchema": {
            "type": "object",
            "properties": {
                "r": {
                    "type": "number",
                    "const": "a string"
                }
            }
        },
        "helmValuesYaml": YAML.stringify({}),
        xOnyxiaContext
    });

    const expected = {
        "helmValues_default": { "r": "a string" },
        "isChartUsingS3": false
    };

    assert(same(got, expected));

    console.log("PASS - const can override the type");
}

{
    const xOnyxiaContext = {
        "a": {
            "b": "42"
        },
        "s3": undefined
    };

    const got = getHelmValues_default({
        "helmValuesSchema": {
            "type": "object",
            "properties": {
                "r": {
                    "type": "number",
                    "x-onyxia": {
                        "overwriteDefaultWith": "a.b"
                    }
                }
            }
        },
        "helmValuesYaml": YAML.stringify({}),
        xOnyxiaContext
    });

    const expected = {
        "helmValues_default": { "r": 42 },
        "isChartUsingS3": false
    };

    assert(same(got, expected));

    console.log("PASS - Convert string from x-onyxia context to number");
}

{
    const xOnyxiaContext = {
        "a": {
            "b": "42.5"
        },
        "s3": undefined
    };

    const got = getHelmValues_default({
        "helmValuesSchema": {
            "type": "object",
            "properties": {
                "r": {
                    "type": "integer",
                    "default": 42,
                    "x-onyxia": {
                        "overwriteDefaultWith": "a.b"
                    }
                }
            }
        },
        "helmValuesYaml": YAML.stringify({}),
        xOnyxiaContext
    });

    const expected = {
        "helmValues_default": { "r": 42 },
        "isChartUsingS3": false
    };

    assert(same(got, expected));

    console.log(
        "PASS - Fallback to default if string interpreted as number is not an integer"
    );
}

{
    const xOnyxiaContext = {
        "a": {
            "b": "true"
        },
        "s3": undefined
    };

    const got = getHelmValues_default({
        "helmValuesSchema": {
            "type": "object",
            "properties": {
                "r": {
                    "type": "boolean",
                    "x-onyxia": {
                        "overwriteDefaultWith": "a.b"
                    }
                }
            }
        },
        "helmValuesYaml": YAML.stringify({}),
        xOnyxiaContext
    });

    const expected = {
        "helmValues_default": { "r": true },
        "isChartUsingS3": false
    };

    assert(same(got, expected));

    console.log("PASS - Interpret string as boolean");
}

{
    const xOnyxiaContext = {
        "s3": {
            "AWS_ACCESS_KEY_ID": "xxx"
        }
    };

    const got = getHelmValues_default({
        "helmValuesSchema": {
            "type": "object",
            "properties": {
                "r": {
                    "type": "string",
                    "x-onyxia": {
                        "overwriteDefaultWith": "s3.AWS_ACCESS_KEY_ID"
                    }
                }
            }
        },
        "helmValuesYaml": YAML.stringify({}),
        xOnyxiaContext
    });

    const expected = {
        "helmValues_default": { "r": "xxx" },
        "isChartUsingS3": true
    };

    assert(same(got, expected));

    console.log("PASS - Successfully detect access to s3 context");
}
