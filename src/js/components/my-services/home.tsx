import React from 'react';
import FilDAriane, { fil } from 'js/components/commons/fil-d-ariane';
import Header from 'js/components/my-services/header';
import Services from './services';
import 'js/components/app.scss';
import { LegacyThemeProvider } from "js/components/LegacyThemeProvider";
import { createGroup } from "type-route";
import { routes } from "app/router";
import { withTypeRouteBasedImplementationOfwithRouter } from "js/utils/withTypeRouteBasedImplementationOfwithRouter";

const MyServicesHome = (props: { location: Location; }) => {

	const { location } = props;

	const groupId = (() => {

		const split = location.pathname
			.replace(/\/$/, "")
			.replace(/^\//, "")
			.split("/");

		if (split.length === 1) {
			return undefined;
		}

		return split.reverse()[0];

	})();

	console.log("===>", groupId);

	//TODO: Make sure groupId exists in URL params.
	//const { groupId } = useParams<{ groupId: string; }>();

	return (
		<LegacyThemeProvider>
			<Header />
			<FilDAriane fil={fil.myServices(groupId)} />
			<Services groupId={groupId} />
		</LegacyThemeProvider>
	);
};

const MyServicesHomeWithRouter = withTypeRouteBasedImplementationOfwithRouter(MyServicesHome);

export default MyServicesHomeWithRouter;

MyServices.routeGroup = createGroup([routes.myServices]);

MyServices.requireUserLoggedIn = true;

export function MyServices(props: Parameters<typeof MyServicesHomeWithRouter>[0]) {
	return <MyServicesHomeWithRouter {...props} />;
}
