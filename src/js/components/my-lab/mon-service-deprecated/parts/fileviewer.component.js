import React from 'react';
import './fileviewer.scss';

const fileViewer = ({ fileContent }) => {
	if (!fileContent) {
		return <></>;
	}
	return (
		<div className="log">
			<pre>{fileContent}</pre>
		</div>
	);
};

export default fileViewer;
