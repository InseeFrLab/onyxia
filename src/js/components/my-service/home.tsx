import FilDAriane, { fil } from "js/components/commons/fil-d-ariane";
import Header from "./header";
import Service from "./service";
import "js/components/app.scss";
import { LegacyThemeProvider } from "js/components/LegacyThemeProvider";
import { createGroup } from "type-route";
import type { Route } from "type-route";
import { routes } from "app/routes/router";

MyService.routeGroup = createGroup([routes.myService]);

MyService.requireUserLoggedIn = true;

export type Props = {
    route: Route<typeof MyService.routeGroup>;
};

export function MyService(props: Props) {
    const { route } = props;

    const { serviceId } = route.params;

    return (
        <LegacyThemeProvider>
            <Header />
            <FilDAriane fil={fil.myService(serviceId)} />
            <Service serviceId={`/${serviceId}`} />
        </LegacyThemeProvider>
    );
}

export default MyService;
