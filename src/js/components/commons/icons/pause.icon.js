import React from 'react';

/* eslint-disable import/no-anonymous-default-export */
export default ({ width = 40, height = 40, color = '#777' }) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width={width}
		height={height}
		viewBox="0 0 10.583333 10.583334"
		id="svg8"
	>
		<g id="layer1" transform="translate(0 -286.417)">
			<path
				d="M 20,0 A 20,20.000015 0 0 0 0,20 20,20.000015 0 0 0 20,40 20,20.000015 0 0 0 40,20 20,20.000015 0 0 0 20,0 Z m -6,14 h 4 v 12 h -4 z m 8,0 h 4 v 12 h -4 z"
				transform="matrix(.26458 0 0 .26458 0 286.417)"
				id="path815"
				fill={color}
			/>
		</g>
	</svg>
);
