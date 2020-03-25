import React from 'react';
import ReactDom from 'react-dom';
import Tooltip from '@material-ui/core/Tooltip';
import { Link } from 'react-router-dom';
import { Fab, Icon } from '@material-ui/core';
import { ArrowIcon } from 'js/components/commons/icons';

export const LinkTo = ({
	disabled = false,
	onClick,
	type = 'forward',
	to = '/accueil',
	component: Component = undefined,
}) => (
	<Link to={to}>
		<Fab className="fab" disabled={disabled} color="primary" onClick={onClick}>
			<Icon>{Component ? <Component /> : type}</Icon>
		</Fab>
	</Link>
);

export const Next = ({ next, disabled = false, type = 'arrow_right' }) => (
	<Tooltip title="suivant">
		<Fab
			className="bouton"
			disabled={disabled}
			aria-label="suivant"
			color="primary"
			onClick={next}
		>
			<Icon>{type}</Icon>
		</Fab>
	</Tooltip>
);

export const Prec = ({ prec, disabled = false, type = 'arrow_left' }) => (
	<Tooltip title="précédent">
		<Fab
			className="bouton"
			disabled={disabled}
			aria-label="suivant"
			color="secondary"
			onClick={prec}
		>
			<Icon>{type}</Icon>
		</Fab>
	</Tooltip>
);

export const Both = ({ next, prec }) => (
	<React.Fragment>
		<Prec prec={prec} />
		<Next next={next} />
	</React.Fragment>
);

export const Bye = () => (
	<Fab
		className="bouton"
		aria-label="bye!"
		color="secondary"
		onClick={() => (window.location = `${window.location.origin}`)}
	>
		<Icon>clear</Icon>
	</Fab>
);

export const Arrow = ({ dom }) =>
	dom
		? ReactDom.createPortal(
				<span
					className="arrow-left"
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						return false;
					}}
				>
					<ArrowIcon width={60} height={40} />
				</span>,
				dom
		  )
		: null;

export const CarteMask = ({ dom }) =>
	dom ? ReactDom.createPortal(<span className="mask" />, dom) : null;
