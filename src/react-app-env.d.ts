/// <reference types="react-scripts" />
declare module '*.md' {
    const src: string;
    export default src;
}

declare module "urlon" {
    const URLON:{
        parse<T extends Record<string, unknown>>(raw: string): T;
        stringify(obj: Record<string,unknown>): string;
    };
    export default URLON;
}