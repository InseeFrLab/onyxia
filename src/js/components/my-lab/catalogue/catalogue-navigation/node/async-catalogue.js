import React, { Suspense, lazy } from 'react';
import Loader from 'js/components/commons/loader';
const Catalogue = lazy(() => import('./catalogue'));

const AsyncNodeCatalogue = (props) => (
	<Suspense fallback={<Loader em={15} />}>
		<Catalogue {...props} />
	</Suspense>
);

export default AsyncNodeCatalogue;
