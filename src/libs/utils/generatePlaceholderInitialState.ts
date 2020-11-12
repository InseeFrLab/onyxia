
export function generatePlaceholderInitialState<State extends object>(
    debugMessage?: string
): State {

    const throwError = (prop: string | number | symbol): never => {
        throw new Error(`Cannot access ${String(prop)} yet ${debugMessage ?? ""}`);
    }

    return new Proxy<State>(
        {} as any,
        {
            "get": (...[, prop]) => throwError(prop),
            "set": (...[, prop]) => throwError(prop)
        }
    );

}