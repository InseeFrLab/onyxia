import React, { Suspense, lazy } from 'react';
import Loader from 'js/components/commons/loader';
const OngletContent = lazy(() => import('./onglet-content'));

const AsyncOngletContent = (props) => (
	<Suspense fallback={<Loader em={18} />}>
		<OngletContent {...props} />
	</Suspense>
);

export default AsyncOngletContent;
