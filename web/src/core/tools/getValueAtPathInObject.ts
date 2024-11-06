/** NOTE: It returns undefined if the path is not found */
export function getValueAtPathInObject<T>(params: {
    path: (string | number)[];
    obj: any;
}): T | undefined {
    return getValueAtPathInObjectRec(params);
}

function getValueAtPathInObjectRec<T>(params: {
    path: (string | number)[];
    obj: any;
}): T | undefined {
    const { path, obj } = params;

    if (path.length === 0) {
        return obj;
    }

    if (!(obj instanceof Object)) {
        return undefined;
    }

    const [key, ...newPath] = path;

    const newObj = obj[key];

    return getValueAtPathInObjectRec({
        path: newPath,
        obj: newObj
    });
}
