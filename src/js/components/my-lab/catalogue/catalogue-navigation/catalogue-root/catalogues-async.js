import React, { Suspense, lazy } from 'react';
import Loader from 'js/components/commons/loader';
const Catalogues = lazy(() => import('./catalogues'));

const AsyncCatalogues = (props) => (
	<Suspense fallback={<Loader em={15} />}>
		<Catalogues {...props} />
	</Suspense>
);

export default AsyncCatalogues;
