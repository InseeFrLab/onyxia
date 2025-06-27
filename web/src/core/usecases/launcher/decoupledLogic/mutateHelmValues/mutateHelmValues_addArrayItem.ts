import type { Stringifyable } from "core/tools/Stringifyable";
import type { JSONSchema } from "core/ports/OnyxiaApi";
import { getValueAtPath } from "core/tools/Stringifyable";
import { assert, type Equals, is } from "tsafe/assert";
import {
    computeHelmValues_rec,
    type XOnyxiaContextLike_computeHelmValues_rec,
    type JSONSchemaLike as JSONSchemaLike_computeHelmValues
} from "../computeHelmValues";
import YAML from "yaml";
import type { XOnyxiaContext } from "core/ports/OnyxiaApi";
import {
    getJSONSchemaType,
    type JSONSchemaLike as JSONSchemaLike_getJSONSchemaType
} from "../shared/getJSONSchemaType";

type JSONSchemaLike = JSONSchemaLike_getJSONSchemaType &
    JSONSchemaLike_computeHelmValues & {
        default?: Stringifyable;
        items?: JSONSchemaLike_computeHelmValues;
        properties?: Record<string, JSONSchemaLike>;
    };

assert<keyof JSONSchemaLike extends keyof JSONSchema ? true : false>();
assert<JSONSchema extends JSONSchemaLike ? true : false>();

export type XOnyxiaContextLike = XOnyxiaContextLike_computeHelmValues_rec & {};

assert<XOnyxiaContext extends XOnyxiaContextLike ? true : false>();

export function mutateHelmValues_addArrayItem(params: {
    helmValues: Record<string, Stringifyable>;
    helmValuesSchema: JSONSchemaLike;
    xOnyxiaContext: XOnyxiaContextLike;
    helmValuesPath: (string | number)[];
    helmValuesYaml: string;
}): void {
    const {
        helmValues,
        helmValuesSchema,
        xOnyxiaContext,
        helmValuesPath,
        helmValuesYaml
    } = params;

    const helmValues_array = getValueAtPath(helmValues, helmValuesPath);

    assert(helmValues_array instanceof Array);

    const defaultItem = (() => {
        const helmValuesSchema_target = getValueAtPath(
            helmValuesSchema,
            helmValuesPath
                .map(segment => {
                    switch (typeof segment) {
                        case "string":
                            return ["properties", segment];
                        case "number":
                            return ["items"];
                    }
                    assert<Equals<typeof segment, never>>(false);
                })
                .flat()
        );

        assert(helmValuesSchema_target !== undefined);

        assert(is<JSONSchemaLike>(helmValuesSchema_target));

        assert(getJSONSchemaType(helmValuesSchema_target) === "array");

        use_default_item: {
            if (helmValuesSchema_target.items === undefined) {
                break use_default_item;
            }

            let item;

            try {
                item = computeHelmValues_rec({
                    helmValuesSchema: helmValuesSchema_target.items,
                    helmValuesYaml_parsed: undefined,
                    xOnyxiaContext,
                    helmValuesSchema_forDataTextEditor: undefined
                });
            } catch {
                break use_default_item;
            }

            return item;
        }

        const helmValuesYaml_parsed = YAML.parse(helmValuesYaml) as Record<
            string,
            Stringifyable
        >;
        const helmValuesYaml_parsed_target = getValueAtPath(
            helmValuesYaml_parsed,
            helmValuesPath
        );
        assert(
            helmValuesYaml_parsed_target === undefined ||
                helmValuesYaml_parsed_target instanceof Array
        );

        const defaultArray = computeHelmValues_rec({
            helmValuesSchema: helmValuesSchema_target,
            helmValuesYaml_parsed: helmValuesYaml_parsed_target,
            xOnyxiaContext,
            helmValuesSchema_forDataTextEditor: undefined
        });

        assert(defaultArray instanceof Array);
        assert(defaultArray.length > 0);

        const defaultItem = defaultArray[helmValues_array.length] ?? defaultArray[0];

        assert(
            defaultItem !== undefined,
            "We should either have a default on the items schema or a default array"
        );

        return defaultItem;
    })();

    helmValues_array.push(defaultItem);
}
