import React, { Suspense, lazy } from 'react';
import Loader from 'js/components/commons/loader';
const OngletContent = lazy(() => import('./accueil.component'));

const AsyncAccueil = (props) => (
	<Suspense fallback={<Loader em={30} />}>
		<OngletContent {...props} />
	</Suspense>
);

export default AsyncAccueil;
