import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
//import { displayLogin, setRedirectUri, setFavicon } from 'js/redux/actions';
import { actions as appActions } from "js/redux/app";
//import { actions as userActions } from "js/redux/user";


//import { getToken } from 'js/utils/localStorageToken';
import * as localStorageToken from "js/utils/localStorageToken";
import { ONYXIA_FAVICON } from 'js/components/commons/favicon';
import { getKeycloak } from 'js/utils';

const createPrivateRoute = (RouterContext: any) => (props: any) => (
	<PrivateRoute {...props} routerContext={RouterContext} />
);

class PrivateRoute extends React.Component {
	state = { isToken: false };
	constructor(props: any) {
		super(props);
		if (props.faviconUrl !== ONYXIA_FAVICON.onyxia) {
			(this.props as any).setFavicon(ONYXIA_FAVICON.onyxia);
		}
	}
	static getDerivedStateFromProps(
		{ authenticated, location, setRedirectUri, displayLogin }: any,
		state: any
	) {
		const token = localStorageToken.get();
		const isToken = token && token !== 'undefined';

		if (!authenticated && !isToken) {
			setRedirectUri(`${window.location.origin}${location.pathname}`);
			displayLogin(true);
		}
		if (!authenticated && isToken) {
			getKeycloak().login();
		}
		return {
			isToken,
		};
	}
	render() {
		const {
			authenticated,
			component: Component,
			routerContext: RouterContext,
			// path,
			...rest
		} = this.props as any;
		return (
			<RouterContext.Consumer>
				{({ pathname }: any) =>
					!authenticated && !this.state.isToken ? (
						<Redirect to={pathname} />
					) : (
						<Route {...rest} component={Component} />
					)
				}
			</RouterContext.Consumer>
		);
	}
}

const mapStateToProps = (state: any, ownProps: any) => {
	const { authenticated, faviconUrl } = state.app;

	return { ...ownProps, authenticated, faviconUrl };
};

const dispatchToProps = {
	"displayLogin": appActions.displayLogin,
	"setRedirectUri": appActions.setRedirectUri,
	"setFavicon": appActions.setFavicon,
};

export default (RouterContext: any) =>
	connect(mapStateToProps, dispatchToProps)(createPrivateRoute(RouterContext));
