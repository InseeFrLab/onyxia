import React, { Suspense, lazy } from 'react';
import Loader from 'js/components/commons/loader';
const Formations = lazy(() => import('./component'));

const AsyncFormations = () => (
	<Suspense fallback={<Loader em={18} />}>
		<Formations />
	</Suspense>
);

export default AsyncFormations;
