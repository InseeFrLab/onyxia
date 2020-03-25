import React from 'react';
import PropTypes from 'prop-types';
import Paper from '@material-ui/core/Paper';
import Fade from '@material-ui/core/Fade';
import classnames from 'classnames';
import './hidable-pane.scss';

class HidablePane extends React.Component {
	state = { display: false, anchor: null, anchorHeight: 0, hide: true };
	timer = null;
	paper = React.createRef();
	requestShow = null;

	constructor(p) {
		super(p);
		window.addEventListener('scroll', this.checkPosition, {
			passive: true,
		});
	}

	componentWillUnmount() {
		window.removeEventListener('scroll', this.checkPosition);
	}

	hide = (who) => {
		if (this.requestShow !== 'panel' || who === 'panel') {
			this.clearTimer();
			this.timer = window.setTimeout(() => {
				this.setState({ display: false });
				this.requestShow = null;
			}, 300);
		}
	};

	display = (who) => {
		this.requestShow = who;
		this.clearTimer();
		this.setState({ display: true, hide: false });
	};

	clearTimer = () => {
		if (this.timer) {
			window.clearTimeout(this.timer);
			this.timer = null;
		}
	};

	postTraitment = () =>
		this.setState({
			display: this.props.post ? this.props.post() : true,
		});

	getAnchorHeight = () => {
		const { anchor } = this.state;
		if (anchor) {
			const styles = window.getComputedStyle(anchor);
			const height = Number.parseInt(styles.getPropertyValue('height'), 10);
			return height;
		}
		return 0;
	};

	checkPosition = () => {
		const { anchor } = this.props;
		if (anchor && this.paper && this.paper.current) {
			const anchorHeight = this.getAnchorHeight();
			const rect = anchor.getBoundingClientRect();
			this.paper.current.style.top = `${rect.top + anchorHeight}px`;
			this.paper.current.style.left = `${rect.left}px`;
			this.paper.current.style.width = `${rect.width}px`;
		}
	};

	componentDidUpdate() {
		const { anchor } = this.props;
		this.checkPosition();
		if (!this.state.anchor && anchor && anchor.addEventListener) {
			anchor.addEventListener('mouseenter', (e) => {
				e.stopImmediatePropagation();
				this.display('anchor');
			});
			anchor.addEventListener('mouseleave', (e) => {
				e.stopImmediatePropagation();
				this.hide('anchor');
			});
			this.setState({ anchor: anchor });
		}
	}

	render() {
		const { className } = this.props;
		this.checkPosition();
		return (
			<div
				className={classnames('hidable-pane', {
					hide: this.state.hide,
					[className]: className,
				})}
				onMouseEnter={(e) => {
					e.stopPropagation();
					if (this.state.display) this.display('panel');
				}}
				onMouseLeave={(e) => {
					e.stopPropagation();
					this.hide('panel');
				}}
				ref={this.paper}
			>
				<Fade
					in={this.state.display}
					timeout={300}
					onExit={() => this.setState({ hide: true })}
				>
					<Paper
						elevation={1}
						classes={{ root: 'paper' }}
						onClick={this.postTraitment}
						onChange={this.postTraitment}
					>
						{this.props.children}
					</Paper>
				</Fade>
			</div>
		);
	}
}

HidablePane.propTypes = {
	anchor: PropTypes.object,
	post: PropTypes.func,
};

export default HidablePane;
