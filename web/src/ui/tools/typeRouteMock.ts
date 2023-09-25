import { Evt } from "evt";
import type { Param0 } from "tsafe";

export function createTypeRouteMock<
    Routes extends {
        [Name in string]: (params?: any) => { params: any };
    }
>(params: { routes: Routes }) {
    const { routes } = params;

    const evtRoutes = Evt.create<
        {
            [Name in keyof typeof routes]: {
                name: Name;
                params: Param0<(typeof routes)[Name]>;
            };
        }[keyof typeof routes]
    >();

    function createMockRouteFactory(params: { triggerReRender: () => void }) {
        const { triggerReRender } = params;

        function createMockRoute<Name extends keyof typeof routes>(
            name: Name,
            params: Param0<(typeof routes)[Name]>
        ): ReturnType<(typeof routes)[Name]> {
            evtRoutes.$attach(
                routeEvent =>
                    routeEvent.name === name
                        ? [routeEvent.params as Param0<(typeof routes)[Name]>]
                        : null,
                newParams => {
                    params = newParams;
                    triggerReRender();
                }
            );

            return new Proxy({} as ReturnType<(typeof routes)[Name]>, {
                "get": (...args) => {
                    const [, prop] = args;

                    switch (prop) {
                        case "params":
                            return routes[name](params).params;
                        case "name":
                            return name;
                        case "constructor":
                        case "length":
                        case Symbol.toStringTag:
                            return Reflect.get(...args);
                        default:
                            throw new Error(
                                `Mock for ${String(prop)} of type-route not implemented`
                            );
                    }
                }
            });
        }

        return { createMockRoute };
    }

    const routesProxy = new Proxy(routes, {
        "get": (...args) => {
            const [, prop] = args;

            const name = prop;

            const out = function (params?: Record<string, unknown>) {
                return new Proxy(
                    {},
                    {
                        "get": (...args) => {
                            const [, prop] = args;

                            if (prop === "link") {
                                return {
                                    ...(routes as any)[name](params).link,
                                    "onClick": (e: any) => {
                                        evtRoutes.post({
                                            name,
                                            params
                                        } as any);
                                        e.preventDefault();
                                    }
                                };
                            }

                            if (prop !== "push" && prop !== "replace") {
                                throw new Error(`${String(prop)} not mocked yet `);
                            }

                            return () => {
                                evtRoutes.post({
                                    name,
                                    params
                                } as any);
                            };
                        }
                    }
                );
            };

            Object.defineProperty(out, "name", { "value": name });

            out["~internal"] = { "type": "RouteBuilder" };

            return out;
        }
    });

    return { createMockRouteFactory, routesProxy };
}
