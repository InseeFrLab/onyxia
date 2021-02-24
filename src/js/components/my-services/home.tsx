  
import FilDAriane, { fil } from 'js/components/commons/fil-d-ariane';
import Header from 'js/components/my-services/header';
import Services from './services';
import 'js/components/app.scss';
import { LegacyThemeProvider } from "js/components/LegacyThemeProvider";
import { createGroup } from "type-route";
import { routes } from "app/router";

MyServices.routeGroup = createGroup([routes.myServices]);

MyServices.requireUserLoggedIn = true;

export function MyServices() {

	//TODO: Make sure groupId exists in URL params.
	//const { groupId } = useParams<{ groupId: string; }>();

	return (
		<LegacyThemeProvider>
			<Header />
			<FilDAriane fil={fil.myServices()} />
			<Services groupId={undefined} />
		</LegacyThemeProvider>
	);
}

export default MyServices;



