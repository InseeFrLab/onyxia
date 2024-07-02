import {
    onyxiaReservedPropertyNameInFieldDescription,
    type XOnyxiaParams
} from "./XOnyxia";

export type JSONSchema = {
    type: "object" | "array" | "string" | "boolean" | "integer";
    title?: string;
    description?: string;
    default: unknown;
    hidden?: boolean | { value: string | boolean | number; path: string };
    items?: JSONSchema;
    properties?: Record<string, JSONSchema>;
    minimum?: number;
    pattern?: string;
    render?: "textArea" | "password" | "list" | "slider";
    enum?: unknown[];
    listEnum?: unknown[];
    sliderMax?: number;
    sliderMin?: number;
    sliderUnit?: string;
    sliderStep?: number;
    sliderExtremitySemantic?: string;
    sliderRangeId?: string;
    sliderExtremity?: "down" | "up";
    [onyxiaReservedPropertyNameInFieldDescription]?: XOnyxiaParams;
};
