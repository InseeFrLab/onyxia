import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import { actions as appActions } from "js/redux/app";


import { locallyStoredOidcJwt } from "js/utils/locallyStoredOidcJwt";
import { ONYXIA_FAVICON } from 'js/components/commons/favicon';
import { getKeycloakInstance } from "js/utils/getKeycloakInstance";

const createPrivateRoute = (RouterContext: any) => (props: any) => (
	<PrivateRoute {...props} routerContext={RouterContext} />
);

class PrivateRoute extends React.Component {
	state = { isToken: false };
	constructor(props: any) {
		super(props);
		if (props.faviconUrl !== ONYXIA_FAVICON.onyxia) {
			(this.props as any).setFavicon({ "url": ONYXIA_FAVICON.onyxia });
		}
	}
	static getDerivedStateFromProps(
		{ authenticated, location, setRedirectUri, displayLogin }: any,
	) {
		const oidcJwt = locallyStoredOidcJwt.get();
		const isToken = oidcJwt && oidcJwt !== 'undefined';

		if (!authenticated && !isToken) {
			setRedirectUri({ "uri": `${window.location.origin}${location.pathname}` });
			displayLogin({ "doDisplay": true });
		}
		if (!authenticated && isToken) {
			getKeycloakInstance().login();
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
