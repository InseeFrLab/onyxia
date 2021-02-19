
import { useRef, useState } from "react";

/** https://stackoverflow.com/questions/65890278/why-cant-usecallback-always-return-the-same-ref */
export function useConstCallback<T extends (...args: never[]) => unknown>(
    callback: T
): T {

    const callbackRef = useRef<T>(callback);

    callbackRef.current = callback;

    return useState(() => (...args: Parameters<T>) => callbackRef.current(...args))[0] as T;

}