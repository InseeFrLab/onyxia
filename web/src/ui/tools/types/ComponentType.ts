import type { FC, ComponentClass } from "react";

export type ComponentType<Props extends Record<string, unknown>> =
    | ((props: Props) => ReturnType<FC>)
    | ComponentClass<Props>;
