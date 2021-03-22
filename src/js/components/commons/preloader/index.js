  
import React from "react";
import './preloader.scss';

class Preloader extends React.Component {
	render() {
		return (
			<div className={this.props.card ? 'preloader-card' : 'preloader'}>
				<img src="/images/preloader.svg" alt="waiting..." align="middle" />
			</div>
		);
	}
}

export default Preloader;
