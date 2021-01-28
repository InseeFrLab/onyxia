import React from 'react';

// eslint-disable-next-line import/no-anonymous-default-export
export default ({ width = 30, height = 20, color = '#cf0' }) => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width={width}
		height={height}
		viewBox="0 0 30  20 "
	>
		<g id="layer1" transform="translate(.133 -276.868)">
			<path
				d="m 0,281.5272 5,5.2228 c 0.1257002,0.1959 0.1252721,0.24124 0,0.5 l -5,5.25 c 4.0820802e-5,0.22513 0.26871745,0.48991 0.5,0.5 l 17.25,-2 v 5.5 c -0.001,0.23754 0.221418,0.50419 0.5,0.5 l 11.63305,-9.75 c 0.162516,-0.17612 0.160685,-0.33919 0.0039,-0.5 L 18.25,277 c -0.237618,6e-5 -0.495487,0.19342 -0.5,0.5 V 283 L 0.5,281 c -0.22867839,0.006 -0.49869792,0.25225 -0.5,0.5272 z"
				id="path815"
				fill={color}
				stroke="#6b8500"
				strokeWidth="0.265"
			/>
		</g>
	</svg>
);
