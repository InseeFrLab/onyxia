import React from 'react';
import { Snackbar, SnackbarContent, IconButton, Icon } from '@material-ui/core';
import './notifications.scss';

export const PUSHER = { push: () => null };
let ID_MESSAGE = 0;

class Notifications extends React.Component {
	state = { map: {}, current: undefined, display: false };

	constructor(props) {
		super(props);
		PUSHER.push = this.push;
	}

	push = (message) => {
		const { current, map } = this.state;
		if (current) {
			const id = ID_MESSAGE++;
			this.setState({ map: { ...map, [id]: { id, message } } });
			return;
		}
		this.setState({ current: { id: -1, message }, display: true });
	};

	post = () => {
		let next = undefined,
			display = false;
		const { current, map } = this.state;
		if (current) {
			delete map[current.id];
		}
		const values = Object.values(map);
		if (values.length !== 0) {
			next = values[0];
			display = true;
		}

		return this.setState({ current: next, map, display });
	};

	close = () => {
		this.setState({ display: false });
	};

	render() {
		const { current, display } = this.state;
		return (
			<SnackIntraining
				message={current ? current.message : null}
				display={display}
				onExited={this.post}
				onClose={this.close}
			/>
		);
	}
}

const SnackIntraining = ({ message, display, onClose, onExited }) => (
	<Snackbar
		anchorOrigin={{
			vertical: 'bottom',
			horizontal: 'left',
		}}
		open={display}
		autoHideDuration={2000}
		onExited={onExited}
		onClose={onClose}
		ContentProps={{
			'aria-describedby': 'message-id',
		}}
	>
		<SnackbarContent
			message={<span id="message-id">{message}</span>}
			action={[
				<IconButton
					key="close"
					aria-label="Close"
					color="inherit"
					onClick={onClose}
				>
					<Icon>close</Icon>
				</IconButton>,
			]}
		/>
	</Snackbar>
);

export default Notifications;
