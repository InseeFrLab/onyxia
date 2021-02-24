import React from "react";  
import { IconButton, Icon } from '@material-ui/core';
import PropTypes from 'prop-types';
import './progress.scss';

class Progress extends React.Component {
	render() {
		const { display, percent, handleClose } = this.props;
		return display ? (
			<div className="progress">
				<div className="container">
					<div className="barre">{next(percent)}</div>
					{handleClose ? (
						<IconButton className="stop" onClick={handleClose}>
							<Icon fontSize="small" color="secondary">
								cancel
							</Icon>
						</IconButton>
					) : null}
				</div>
				<div className="contenu">{this.props.children}</div>
			</div>
		) : null;
	}
}

const next = (lim, percent = 0) =>
	percent < Math.min(lim, 100) ? (
		<>
			<span className="part" /> {next(lim, percent + 1)}
		</>
	) : null;

Progress.propTypes = {
	percent: PropTypes.number.isRequired,
	display: PropTypes.bool.isRequired,
	handleClose: PropTypes.func,
};

export default Progress;
