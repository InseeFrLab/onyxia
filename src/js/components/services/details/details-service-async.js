import React, { Suspense, lazy } from 'react';
import Loader from 'js/components/commons/loader';
import { LegacyThemeProvider } from "js/components/LegacyThemeProvider";
const OngletContent = lazy(() => import('./details-service'));

const AsyncDetailsService = (props) => (
	<LegacyThemeProvider>
		<Suspense fallback={<Loader em={18} />}>
			<OngletContent {...props} />
		</Suspense>
	</LegacyThemeProvider>
);

export default AsyncDetailsService;
