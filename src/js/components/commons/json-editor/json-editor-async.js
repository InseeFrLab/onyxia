import React, { Suspense, lazy } from 'react';
import Loader from '../loader';
const JSONEditor = lazy(() => import('./json-editor.component'));

const AsyncEditor = (props) => (
	<Suspense fallback={<Loader />}>
		<JSONEditor {...props} />
	</Suspense>
);

export default AsyncEditor;
