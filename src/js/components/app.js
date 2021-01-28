import React from 'react';
import CssBaseline from '@material-ui/core/CssBaseline';
import { MuiThemeProvider } from '@material-ui/core/styles';
import {
	BrowserRouter as Router,
	Switch,
	Route as NativeRoute,
	Redirect,
	useLocation
} from 'react-router-dom';
import createTheme from './material-ui-theme';
import { createPrivateRouteComponent } from './authentication';
import { createRouteComponent, createRouterContext } from './router-context';
import { invalidIdep } from 'js/utils/idep';
import { Home } from "js/components/home/Home";
import MyService from 'js/components/my-service';
import MyServices from 'js/components/my-services';
import Services, { ServiceDetails } from 'js/components/services';
import Trainings from 'js/components/trainings';
import Catalogue from './my-lab/catalogue';
import { MyBuckets } from 'js/components/mes-fichiers/MyBuckets';
import { NavigationFile } from 'js/components/mes-fichiers/navigation/NavigationFile';
import { MonCompte } from 'js/components/mon-compte/mon-compte.component';
import CloudShell from 'js/components/cloud-shell';
import QuickAccess from './commons/nav-bar/quick-access';
import Footer from './commons/footer';
import Preloader from './commons/preloader';
import VisiteGuidee, { VisiteGuideeDebut } from 'js/components/visite-guidee';
import Favicon from 'js/components/commons/favicon';
import Notifications from 'js/components/notifications';
import { Navbar } from 'js/components/commons/nav-bar/Navbar';
import { About } from 'js/components/about/About';
import 'typeface-roboto';
import './app.scss';
import RegionBanner from 'js/components/regionsBanner';
import Cluster from 'js/components/cluster';
import { ToastContainer } from 'react-toastify';
import { getEnv } from "js/env";
import { useAppConstants } from "app/lib/hooks";
import { themeProviderFactory } from "app/theme/ThemeProvider";
import { MySecrets } from "app/pages/MySecrets/MySecrets";
import { Alert } from "app/components/designSystem/Alert";
import ReactMarkdown from 'react-markdown'
import { css } from "app/theme/useClassNames";


const { ThemeProvider } = themeProviderFactory(
	{ "isReactStrictModeEnabled": process.env.NODE_ENV !== "production" }
);


const env = getEnv();

const initialPathname = "/accueil";

const theme = createTheme();
const routerContext = createRouterContext(Home)(initialPathname);
const Route = createRouteComponent(routerContext)(NativeRoute);
const PrivateRoute = createPrivateRouteComponent(routerContext);

export const App = ({
	requestError,
	waiting,
	applicationResize,
	messageIntraining,
	consumeMessageIntraining,
	idep,
}) =>
	requestError ? (
		<App404 />
	) : (
			<AppFeelGood
				waiting={waiting}
				applicationResize={applicationResize}
				messageIntraining={messageIntraining}
				consumeMessageIntraining={consumeMessageIntraining}
				idep={idep}
			/>
		);

const App404 = () => (
	<MuiThemeProvider theme={theme}>
		<CssBaseline />
		<Router>
			<div className="application">
				<Navbar />
				<main role="main">404</main>
				<Footer />
			</div>
		</Router>
	</MuiThemeProvider>
);

function AlertWrapper(props) {

	const { children, ...rest } = props;

	const { pathname } = useLocation();

	if (!pathname.startsWith(initialPathname)) {
		return null;
	}

	return (
		<ThemeProvider isDarkModeEnabled={false}>
			<Alert {...rest}  >
				<ReactMarkdown className={css({ "& p": { "margin": "4px 0 0 0" } })}>
					{children}
				</ReactMarkdown>
			</Alert>
		</ThemeProvider>
	);
}

const AppFeelGood = ({ waiting, applicationResize, idep }) => {

	const appConstants = useAppConstants();

	const { isUserLoggedIn } = appConstants;

	return (
		<MuiThemeProvider theme={theme}>
			{waiting ? <Preloader /> : null}
			<CssBaseline />
			<Favicon />
			<Router>
				<>
					<div className="application">
						<Navbar />
						<RegionBanner />
						{invalidIdep(idep) && (
							<AlertWrapper severity="error">
								{`Votre identifiant utilisateur ("${idep}") n'est pas valide (caractères alphanumériques sans espace). ${env.APP.CONTACT}`}
							</AlertWrapper>
						)}
						{env.APP.WARNING_MESSAGE &&
							<AlertWrapper severity="warning">{env.APP.WARNING_MESSAGE}</AlertWrapper>
						}
						{env.APP.INFO_MESSAGE &&
							<AlertWrapper severity="info">{env.APP.INFO_MESSAGE}</AlertWrapper>
						}
						<main role="main">
							<Switch>
								<Route path="/accueil" component={Home} />
								<Route path="/about" component={About} />
								<PrivateRoute path="/cluster" component={Cluster} />
								<Route exact path="/services" component={Services} />
								<Route path="/services/*" component={ServiceDetails} />
								<Route exact path="/trainings" component={Trainings} />
								<PrivateRoute path="/trainings/:id" component={Trainings} />
								<Route exact path="/my-lab/catalogue" component={Catalogue} />
								<Route
									path="/my-lab/catalogue/:catalogue"
									component={Catalogue}
								/>

								<PrivateRoute exact path="/my-services" component={MyServices} />

								<PrivateRoute
									exact
									path="/my-services/:groupId+"
									component={MyServices}
								/>

								<PrivateRoute
									exact
									path="/my-service/:serviceId+"
									component={MyService}
								/>

								<PrivateRoute path="/mon-compte" component={MonCompte} />
								<PrivateRoute
									exact
									path="/mes-fichiers"
									component={MyBuckets}
								/>

								<PrivateRoute
									path="/mes-fichiers/:bucketName"
									exact
									component={NavigationFile}
								/>
								<PrivateRoute
									path="/mes-fichiers/:bucketName/*"
									component={NavigationFile}
								/>
								<PrivateRoute
									exact
									path="/mes-secrets"
									component={() => (
										<ThemeProvider isDarkModeEnabled={false}>
											<MySecrets className="mySecrets" />
										</ThemeProvider>
									)}
								/>


								<PrivateRoute
									path="/visite-guidee"
									component={VisiteGuideeDebut}
								/>
								<Route path="/" component={() => <Redirect to={initialPathname} />} />
							</Switch>
						</main>
						<FooterCond />
						<Notifications />
						{isUserLoggedIn && <QuickAccess />}
					</div>
					{isUserLoggedIn && <CloudShell />}
					<VisiteGuidee />
					<ToastContainer position="bottom-left" />
				</>
			</Router>
		</MuiThemeProvider>
	);

};

export default App;

//TODO: Fix, hack for continuos integration.
function FooterCond() {

	const { pathname } = useLocation();

	return pathname.startsWith("/mes-secrets") ? null : <Footer />;

}
