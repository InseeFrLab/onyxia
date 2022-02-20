//TODO: Remove this util when we migrate to new new explorer.

/**
/ -> 0
/a -> 1
/a/ -> 1
/a/b -> 2


. -> 0
./ -> 0
./a -> 1
./a/ -> 1
./a/b -> 2

a -> 1
a/
a/b
a/b/

*/
export function getPathDepth(path: string): number {
    return path
        .replace(/^\./, "")
        .replace(/^\//, "")
        .replace(/\/$/, "")
        .split("/")
        .filter(s => s !== "").length;
}
