import { useRoute } from "app/router";
import { typeRouteRouteToDomLocation } from "js/utils/typeRouteRouteToDomLocation";

export function withTypeRouteBasedImplementationOfwithRouter<P extends { location: Location; }>(
    Component: (props: P)=> ReturnType<React.FC>
) {

	const UntypedComponent: any= Component;

	return (props: Omit<P,"location">)=> {

		const route = useRoute();

		return <UntypedComponent {...props} location={typeRouteRouteToDomLocation(route)}/>;

	};

}