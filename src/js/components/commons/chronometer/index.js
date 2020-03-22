import React from 'react';
import moment from 'moment';

const MINUTE_IN_MILLI = 60 * 1000;
const HOUR_IN_MILLI = MINUTE_IN_MILLI * 60;
const DAY_IN_MILLI = HOUR_IN_MILLI * 24;

class Chronometer extends React.Component {
	state = { days: 0, hours: 0, minutes: 0, seconds: 0 };
	constructor(props) {
		super(props);
		this.timer = window.setInterval(() => {
			this.refresh();
		}, 1000);
	}

	componentDidMount() {
		this.refresh();
	}

	componentWillUnmount() {
		clearTimeout(this.timer);
	}

	refresh = () => {
		let duration = moment() - moment(this.props.start);
		const days = Math.trunc(duration / DAY_IN_MILLI);
		duration %= DAY_IN_MILLI;
		const hours = Math.trunc(duration / HOUR_IN_MILLI);
		duration %= HOUR_IN_MILLI;
		const minutes = Math.trunc(duration / MINUTE_IN_MILLI);
		duration %= MINUTE_IN_MILLI;
		const seconds = Math.trunc(duration / 1000);

		const state = {
			days,
			hours,
			minutes,
			seconds,
		};

		this.setState(state);
	};

	render() {
		const { days, hours, minutes, seconds } = this.state;
		const deuxChiffres = how => (how >= 10 ? `${how}` : `0${how}`);
		return (
			<div className="chronometre">
				<span className="jours">{`${days}`}</span>
				<span className="reste">{`${deuxChiffres(hours)}:${deuxChiffres(
					minutes
				)}:${deuxChiffres(seconds)}`}</span>
			</div>
		);
	}
}

export default Chronometer;
