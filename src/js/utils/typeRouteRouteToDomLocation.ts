
import { assert } from "evt/tools/typeSafety/assert";

export function typeRouteRouteToDomLocation(route: { href: string; }): Location {

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

};