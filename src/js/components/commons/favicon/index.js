import React from "react";
import { connect } from 'react-redux';

/*
export const ONYXIA_FAVICON = {
	wait: '/onyxia.wait.png',
	ok: '/onyxia.ok.png',
	onyxia: '/onyxia.png',
};
*/

class Favicon extends React.Component {
	state = { faviconUrl: null };
	static getDerivedStateFromProps(props, state) {
		/*
		if (props.faviconUrl !== state.faviconUrl) {
			const dom = document.getElementById('favicon');
			switch (props.faviconUrl) {
				case ONYXIA_FAVICON.wait:
				case ONYXIA_FAVICON.ok:
					dom.href = props.faviconUrl;
					break;
				default:
					dom.href = props.faviconUrl.onyxia;
			}

			return { faviconUrl: props.faviconUrl };
		}
		*/

		return state;
	}

	render() {
		return null;
	}
}

export default connect((state) => ({ faviconUrl: state.app.faviconUrl }))(
	Favicon
);
