import { Suspense, lazy } from 'react';
import Loader from '../loader';
const JSONEditor = lazy(() => import('./json-editor.component'));

const AsyncEditor = (props) => (
	<Suspense fallback={<Loader em={10} />}>
		<JSONEditor {...props} />
	</Suspense>
);

export default AsyncEditor;
