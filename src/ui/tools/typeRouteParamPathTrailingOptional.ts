import { param } from "type-route";
import type { ValueSerializer } from "type-route";
import { id } from "tsafe/id";
import { assert } from "tsafe/assert";

/** See: https://github.com/typehero/type-route/issues/89 */
export const paramPathTrailingOptional = param.path.trailing.optional.ofType(
    id<ValueSerializer<string>>({
        "parse": raw => raw,
        "stringify": value => {
            assert(value.startsWith("/"), "Trailing path should always start with a /");

            assert(!value.endsWith("/"), "Trailing path should never end with a /");

            assert(
                value !== "/",
                "'/' alone is like undefined this model only enable to work with pat of at least one"
            );

            const out = value.replace(/^\/+/, "");

            return out;
        }
    })
);
