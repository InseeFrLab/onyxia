import React from "react";
import { Route, Redirect } from "react-router-dom";
import { connect } from "react-redux";
import { displayLogin, setRedirectUri, setFavicon } from "js/redux/actions";
import { gelLocalToken } from "js/utils";
import { ONYXIA_FAVICON } from "js/components/commons/favicon";
import { getKeycloak } from "js/utils";

const createPrivateRoute = RouterContext => props => (
  <PrivateRoute {...props} routerContext={RouterContext} />
);

class PrivateRoute extends React.Component {
  state = { isToken: false };
  constructor(props) {
    super(props);
    if (props.faviconUrl !== ONYXIA_FAVICON.onyxia) {
      this.props.setFavicon(ONYXIA_FAVICON.onyxia);
    }
  }
  static getDerivedStateFromProps(
    { authenticated, location, setRedirectUri, displayLogin },
    state
  ) {
    const token = gelLocalToken();
    const isToken = token && token !== "undefined";

    if (!authenticated && !isToken) {
      setRedirectUri(`${window.location.origin}${location.pathname}`);
      displayLogin(true);
    }
    if (!authenticated && isToken) {
      getKeycloak().login();
    }
    return {
      isToken
    };
  }
  render() {
    const {
      authenticated,
      component: Component,
      routerContext: RouterContext,
      // path,
      ...rest
    } = this.props;
    return (
      <RouterContext.Consumer>
        {({ pathname }) =>
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

const mapStateToProps = (state, ownProps) => {
  const { authenticated, faviconUrl } = state.app;

  return { ...ownProps, authenticated, faviconUrl };
};

const dispatchToProps = {
  displayLogin,
  setRedirectUri,
  setFavicon
};

export default RouterContext =>
  connect(mapStateToProps, dispatchToProps)(createPrivateRoute(RouterContext));
