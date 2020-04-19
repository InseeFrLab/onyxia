import React, { Suspense, lazy } from 'react';
import Loader from 'js/components/commons/loader';
const Trainings = lazy(() => import('./component'));

const AsyncTrainings = () => (
	<Suspense fallback={<Loader em={18} />}>
		<Trainings />
	</Suspense>
);

export default AsyncTrainings;
