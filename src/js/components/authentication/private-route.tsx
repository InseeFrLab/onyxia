import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { connect } from 'react-redux';
import { actions as appActions } from "js/redux/app";
import { ONYXIA_FAVICON } from 'js/components/commons/favicon';
import { assert } from "evt/tools/typeSafety/assert";
import type { UnpackPromise } from "evt/tools/typeSafety";
import { prOidcClient } from "lib/setup";

const createPrivateRoute = (RouterContext: any) => (props: any) => (
	<PrivateRoute {...props} routerContext={RouterContext} />
);

//NOTE: Very temporary hack.
let oidcClient: UnpackPromise<typeof prOidcClient>;
let oidcAccessToken: string | undefined = undefined;
prOidcClient.then(v => { 
	oidcClient = v;

	if( !oidcClient.isUserLoggedIn ){
		return;
	}

	oidcClient.evtOidcTokens.attach(
		oidcTokens => oidcAccessToken = oidcTokens?.accessToken
	);

});




class PrivateRoute extends React.Component {
	state = { isToken: false };
	constructor(props: any) {
		super(props);
		if (props.faviconUrl !== ONYXIA_FAVICON.onyxia) {
			(this.props as any).setFavicon({ "url": ONYXIA_FAVICON.onyxia });
		}
	}
	static getDerivedStateFromProps(
		{ location, setRedirectUri, displayLogin }: any,
	) {
		const isToken = oidcAccessToken !== undefined;

		

		if (!oidcClient.isUserLoggedIn && !isToken) {
			setRedirectUri({ "uri": `${window.location.origin}${location.pathname}` });
			displayLogin({ "doDisplay": true });
		}
		if (!oidcClient.isUserLoggedIn && isToken) {

			assert(!oidcClient.isUserLoggedIn);

			oidcClient.login();

		}
		return { isToken };
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
	const { faviconUrl } = state.app;

	return { ...ownProps, faviconUrl };
};

const dispatchToProps = {
	"displayLogin": appActions.displayLogin,
	"setRedirectUri": appActions.setRedirectUri,
	"setFavicon": appActions.setFavicon,
};

/* eslint-disable import/no-anonymous-default-export */
export default (RouterContext: any) =>
	connect(mapStateToProps, dispatchToProps)(createPrivateRoute(RouterContext)); 
