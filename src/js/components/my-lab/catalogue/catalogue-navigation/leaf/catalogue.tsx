import { NouveauService } from './deploiement/nouveau-service';
import { Service } from './service.component';
import { useAppConstants } from "app/lib/hooks";

export const Leaf: React.FC<{ location: string; }> = ({ location }) => {
	const [idCatalogue, idService] = getId(location);

	//TODO: Checks for if the user is logged in or not shouldn't be done here
	//but this is legacy code...
	const appConstants = useAppConstants();

	const isDeploiementValue = isDeploiement(location);

	if (isDeploiementValue && !appConstants.isUserLoggedIn) {


		appConstants.login();

		return null;


	}

	return isDeploiementValue ? (
		<NouveauService idCatalogue={idCatalogue} idService={idService} />
	) : (
			<Service idCatalogue={idCatalogue} idService={idService} />
		);
};

const isDeploiement = (pathname = '/') => {
	return (
		pathname
			.split('/')
			.reduce((a, x) => (x.trim().length > 0 ? x : a), "") ===
		'deploiement'
	);
};

const getId = (location: string) =>
	location
		.replace('/my-lab/catalogue', '')
		.split('/')
		.filter((t) => t.trim().length > 0);
