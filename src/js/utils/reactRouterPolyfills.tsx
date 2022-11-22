import { assert } from "tsafe/assert";
import { useRoute } from "ui/routes";

function typeRouteRouteToDomLocation(route: { href: string }): Location {
    return new Proxy(
        {
            "pathname": route.href.split("?")[0],
            "search": route.href.match(/^[^?]+(\?.*)$/)?.[1]
        },
        {
            "get": (...args) => {
                const [target, prop] = args;

                if (!(prop in target)) {
                    assert(false, `should polyfill Location ${String(prop)}`);
                }

                return Reflect.get(...args);
            }
        }
    ) as any;
}

export function useLocation() {
    return typeRouteRouteToDomLocation(useRoute());
}

export function withRouter<P extends { location: Location }>(
    Component: (props: P) => ReturnType<React.FC>
) {
    const UntypedComponent: any = Component;

    return (props: Omit<P, "location">) => {
        return <UntypedComponent {...props} location={useLocation()} />;
    };
}
