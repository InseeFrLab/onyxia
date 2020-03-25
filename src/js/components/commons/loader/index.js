import React from 'react';
import CircularProgress from '@material-ui/core/CircularProgress';
import './loader.scss';

const Loader = () => (
	<div className="loader">
		<CircularProgress />
	</div>
);

export default Loader;
