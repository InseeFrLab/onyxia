import React from 'react';
import './pile.scss';

/* eslint-disable import/no-anonymous-default-export */
export default ({
	size,
	sizeMax,
	horizontal = false,
	vertical = true,
	label,
	title = size,
	small = false,
}) => {
	return (
		<span className="pile" title={title}>
			<span
				className={
					horizontal || !vertical ? 'pile-horizontal' : 'pile-vertical'
				}
			>
				{getNext({ index: 0, size, sizeMax, small })}
			</span>
			{getLabel(label)(title)}
		</span>
	);
};

const getLabel = (Label) => (title) =>
	typeof Label === 'function' ? (
		<Label />
	) : (
		<span className="pile-label">
			<span className="label-titre">{Label}</span>
			<span className="label-sous-titre">{title}</span>
		</span>
	);

const getNext = ({ index, sizeMax, size, small }) => {
	const level = index / sizeMax;
	return index < sizeMax ? (
		<>
			{getNext({ index: index + 1, size, sizeMax, small })}

			<span
				className={
					index < size
						? small
							? level < 0.5
								? 'green-small'
								: level < 0.7
								? 'orange-small'
								: 'red-small'
							: 'green'
						: small
						? 'empty-small'
						: 'empty'
				}
			/>
		</>
	) : null;
};
