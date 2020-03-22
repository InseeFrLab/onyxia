import React from 'react';
import PropTypes from 'prop-types';
import { Dialog, DialogActions, DialogContent } from '@material-ui/core';
import './visite-guidee.scss';

class VisiteGuidee extends React.Component {
	state = { step: 0 };
	nextStep = () => {
		this.setState({
			step: Math.min(this.props.etapes.length - 1, this.state.step + 1),
		});
	};

	precStep = () => {
		this.setState({
			step: Math.max(0, this.state.step - 1),
		});
	};

	render() {
		const { visite, etapes } = this.props;
		if (!visite || etapes.length === 0) return null;
		const { description: Description, actions: Actions } = etapes[
			this.state.step
		];
		return (
			<Dialog
				classes={{ root: 'visite-guidee', paperFullWidth: 'contenu' }}
				fullWidth
				open={visite}
				BackdropComponent={() => <span className="custom-backdrop" />}
			>
				<DialogContent>
					<Description
						next={this.nextStep}
						prec={this.precStep}
						{...this.props}
					/>
				</DialogContent>
				<DialogActions className="actions">
					<Actions next={this.nextStep} prec={this.precStep} {...this.props} />
				</DialogActions>
			</Dialog>
		);
	}
}

VisiteGuidee.propTypes = {
	etapes: PropTypes.arrayOf(
		PropTypes.shape({
			description: PropTypes.func.isrequired,
			actions: PropTypes.func.isrequired,
		})
	),
};

export default VisiteGuidee;
