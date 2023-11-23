/// <reference types="react-scripts" />
declare module "*.md" {
    const src: string;
    export default src;
}
declare module "*.worker.js" {
    const src: string;
    export default src;
}

declare module "*.wasm" {
    const src: string;
    export default src;
}

declare module "urlon" {
    const URLON: {
        parse<T>(raw: string): T;
        stringify(obj: any): string;
    };
    export default URLON;
}

declare module "filereader-stream" {
    export default function fileReaderStream(...args: any[]): any;
}
