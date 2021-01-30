


import type { WritableDraft } from "@reduxjs/toolkit/node_modules/immer/dist/types/types-external";

export type UnwrapWritableDraft<T> = T extends WritableDraft<infer U> ? U : never;

export function unwrapWritableDraft<T extends WritableDraft<any>>(wrapped: T): UnwrapWritableDraft<T>{
    return wrapped as any;
}

