import { useState, useEffect, useCallback } from 'react';
import Loader from '../commons/loader';
import ServiceDetails from './service-details';
import { getService, deleteServices } from 'js/api/my-lab';
import { Service } from 'js/model';
import Toolbar from './toolbar';
import { useSelector, useAppConstants } from "app/lib/hooks";
import { routes } from "app/router";

interface Props {
	serviceId: string;
}

const MyService = ({ serviceId }: Props) => {
	const [loading, setLoading] = useState(false);
	const [service, setService] = useState<Service>(undefined as any);
	const [redirect, setRedirect] = useState<(()=> void) | undefined>(undefined);

	const refreshData = useCallback(() => {
		setLoading(true);
		getService(serviceId).then((service) => {
			setService(service);
			setLoading(false);
		});
	}, [serviceId]);

	const handleDelete = () => {
		setLoading(true);
		deleteServices(service.id).then(() => {
			setLoading(false);
			setRedirect(() => routes.myServices().replace());
		});
	};

	const { monitoringUrl } = useMonitoringUrl({ serviceId });

	useEffect(() => {
		if (!service) {
			refreshData();
		}
	}, [service, serviceId, refreshData]);

	if (redirect) {
		redirect();
		return null;
	}

	return (
		<div className="contenu accueil">
			<Toolbar
				handleRefresh={() => refreshData()}
				handleDelete={() => handleDelete()}
				monitoringUrl={monitoringUrl}
			/>
			{loading ? <Loader em={18} /> : <ServiceDetails service={service} />}
		</div>
	);
};

export default MyService;


function useMonitoringUrl(params: { serviceId: string; }) {

	const { serviceId } = params;


	const monitoringURLPattern = useSelector(state => state.regions.selectedRegion?.services.monitoring?.URLPattern);
	const namespacePrefix = useSelector(state => state.regions.selectedRegion?.services.namespacePrefix);

	const idep = (function useClosure() {

		const appConstants = useAppConstants();

		return appConstants.isUserLoggedIn ? appConstants.userProfile.idep : undefined;

	})();

	const monitoringUrl = monitoringURLPattern
		?.replace("$NAMESPACE", `${namespacePrefix}${idep}`)
		.replace("$INSTANCE", serviceId.replace(/^\//, ""));

	return { monitoringUrl };

}