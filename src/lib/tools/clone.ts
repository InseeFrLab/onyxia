
export function clone<T>(obj: T): T {
    return JSON.parse(
        JSON.stringify([obj])
    )[0];
}