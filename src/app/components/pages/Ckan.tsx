import { createGroup } from "type-route";
import { routes } from "app/routes/router";
import type { Route } from "type-route";

Ckan.routeGroup = createGroup([routes.myDataCatalog]);

type PageRoute = Route<typeof Ckan.routeGroup>;

Ckan.requireUserLoggedIn = () => true;

export type Props = {
    route: PageRoute;
};

export function Ckan(props: Props) {
    // eslint-disable-next-line
    const { route } = props;

    window.location.href = "https://ckan.clouddatalab.eu";

    return <></>;
}
