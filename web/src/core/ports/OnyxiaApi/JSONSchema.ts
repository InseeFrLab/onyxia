import {
    onyxiaReservedPropertyNameInFieldDescription,
    type XOnyxiaParams
} from "./XOnyxia";
import type { Stringifyable } from "core/tools/Stringifyable";

export type JSONSchema = {
    type: "object" | "array" | "string" | "boolean" | "integer";
    title?: string;
    description?: string;
    default?: Stringifyable;
    hidden?:
        | boolean
        | { value: string | boolean | number; path: string; isPathRelative?: boolean };
    items?: JSONSchema;
    minimum?: number;
    pattern?: string;
    render?: "textArea" | "password" | "list" | "slider";
    enum?: Stringifyable[];
    listEnum?: Stringifyable[];
    sliderMax?: number;
    sliderMin?: number;
    sliderUnit?: string;
    sliderStep?: number;
    sliderExtremitySemantic?: string;
    sliderRangeId?: string;
    sliderExtremity?: "down" | "up";
    const?: Stringifyable;
    properties?: Record<string, JSONSchema>;
    [onyxiaReservedPropertyNameInFieldDescription]?: XOnyxiaParams;
};
