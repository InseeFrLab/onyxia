import { assert } from "tsafe/assert";

export function getValueAtPathInObject(params: {
    path: string[];
    obj: Record<string, unknown>;
}): any {
    const { path, obj } = params;

    if (path.length === 0) {
        return obj;
    }

    const [key, ...newPath] = path;

    const newObj = obj[key];

    assert(newObj instanceof Object, `can't dereference ${key}`);

    return getValueAtPathInObject({
        "path": newPath,
        "obj": newObj as Record<string, unknown>,
    });
}
