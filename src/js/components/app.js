import React from 'react';
import CssBaseline from '@material-ui/core/CssBaseline';
import { MuiThemeProvider } from '@material-ui/core/styles';
import {
	BrowserRouter as Router,
	Switch,
	Route as NativeRoute,
	Redirect,
} from 'react-router-dom';
import createTheme from './material-ui-theme';
import { createPrivateRouteComponent } from './authentication';
import { createRouteComponent, createRouterContext } from './router-context';
import { Alert } from 'js/components/commons/Alert';
import { invalidIdep } from 'js/utils/idep';
import { Home } from "js/components/home/Home";
import MyService from 'js/components/my-service';
import MyServices from 'js/components/my-services';
import Services, { ServiceDetails } from 'js/components/services';
import Trainings from 'js/components/trainings';
import Catalogue from './my-lab/catalogue';
import { MyBuckets } from 'js/components/mes-fichiers/MyBuckets';
import { NavigationFile } from 'js/components/mes-fichiers/navigation/NavigationFile';
import MonCompte from 'js/components/mon-compte';
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
import { env } from "js/env";
import { useSelector } from "js/redux/store";
import { ResizeDetector } from "js/components/commons/ResizeDetector";
import { MySecrets } from "js/components/MySecrets";

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

const AppFeelGood = ({ waiting, applicationResize, idep }) => {

	const isAuthenticated = useSelector(state => state.app.authenticated);

	return (
		<MuiThemeProvider theme={theme}>
			<ResizeDetector onResize={applicationResize}/>
			{waiting ? <Preloader /> : null}
			<CssBaseline />
			<Favicon />
			<Router>
				<>
					<div className="application">
						<Navbar />
						<RegionBanner />
						{invalidIdep(idep) && (
							<Alert
								severity="error"
								message={`Votre username ("${idep}") n'est pas valide (caractères alphanumériques sans espace). ${env.APP.CONTACT}`}
							/>
						)}
						{env.APP.WARNING_MESSAGE && (
							<Alert severity="warning" message={env.APP.WARNING_MESSAGE} />
						)}
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
									component={MySecrets}
								/>
								<PrivateRoute
									path="/visite-guidee"
									component={VisiteGuideeDebut}
								/>
								<Route path="/" component={() => <Redirect to={initialPathname} />} />
							</Switch>
						</main>
						<Footer />
						<Notifications />
						{isAuthenticated && <QuickAccess />}
					</div>
					<CloudShell />
					<VisiteGuidee />
					<ToastContainer position="bottom-left" />
				</>
			</Router>
		</MuiThemeProvider>
	);

};

export default App;
