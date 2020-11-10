
  export function generatePlaceholderInitialState<State extends object>(
      debugMessage?: string
  ): State {
      return new Proxy<State>(
          {} as any, 
          {
              "get": (...[,prop])=> {
                throw new Error(`Cannot access ${String(prop)} yet ${debugMessage??""}`);
              }
          }
      );
  }