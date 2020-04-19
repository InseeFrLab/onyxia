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
import ReactResizeDetector from 'react-resize-detector';
import Alert from 'js/components/commons/alert';
import config from 'js/configuration';
import { invalidIdep } from 'js/utils/idep';
import Accueil from './accueil';
import MesServicesGeneriques from 'js/components/my-lab/mes-services/mes-services-generiques.container';
import Services, { ServiceDetails } from 'js/components/services';
import Trainings from 'js/components/trainings';
import Catalogue from './my-lab/catalogue';
import MesFichiers from 'js/components/mes-fichiers';
import { NavigationFiles } from 'js/components/mes-fichiers';
import MonCompte from 'js/components/mon-compte';
import CloudShell from 'js/components/cloud-shell';
import NavBar, { QuickAccess } from './commons/nav-bar';
import Footer from './commons/footer';
import Preloader from './commons/preloader';
import VisiteGuidee, { VisiteGuideeDebut } from 'js/components/visite-guidee';
import Favicon from 'js/components/commons/favicon';
import MesSecretsHome from 'js/components/mes-secrets/home';
import MesSecrets from 'js/components/mes-secrets';
import Notifications from 'js/components/notifications';
import 'typeface-roboto';
import './app.scss';

const theme = createTheme();
const routerContext = createRouterContext(Accueil)('/accueil');
const Route = createRouteComponent(routerContext)(NativeRoute);
const PrivateRoute = createPrivateRouteComponent(routerContext);

const App = ({
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
				<NavBar />
				<main role="main">404</main>
				<Footer />
			</div>
		</Router>
	</MuiThemeProvider>
);

const AppFeelGood = ({ waiting, applicationResize, idep }) => (
	<MuiThemeProvider theme={theme}>
		<ReactResizeDetector
			handleWidth
			handleHeight
			onResize={(width) => applicationResize(width)}
		/>
		{waiting ? <Preloader /> : null}
		<CssBaseline />
		<Favicon />
		<Router>
			<>
				<div className="application">
					<NavBar />
					{invalidIdep(idep) && (
						<Alert
							severity="error"
							message={`Votre username ("${idep}") n'est pas valide (caractères alphanumériques sans espace). ${config.APP.CONTACT}`}
						/>
					)}
					<main role="main">
						<Switch>
							<Route path="/accueil" component={Accueil} />
							<Route exact path="/services" component={Services} />
							<Route path="/services/*" component={ServiceDetails} />
							<Route exact path="/trainings" component={Trainings} />
							<PrivateRoute path="/trainings/:id" component={Trainings} />
							<Route exact path="/my-lab/catalogue" component={Catalogue} />
							<Route
								path="/my-lab/catalogue/:catalogue"
								component={Catalogue}
							/>

							<PrivateRoute
								exact
								path="/my-lab/mes-services"
								component={MesServicesGeneriques}
							/>

							<PrivateRoute
								exact
								path="/my-lab/mes-services/:serviceId"
								component={MesServicesGeneriques}
							/>

							<PrivateRoute
								exact
								path="/my-lab/mes-services/:serviceId/task/:taskId"
								component={MesServicesGeneriques}
							/>

							<PrivateRoute
								exact
								path="/my-lab/mes-services/:serviceId/task/:taskId/file/:filePath"
								component={MesServicesGeneriques}
							/>

							<PrivateRoute
								exact
								path="/my-lab/mes-services/:serviceId/task/:taskId/file/:filePath/:action"
								component={MesServicesGeneriques}
							/>

							<PrivateRoute path="/mon-compte" component={MonCompte} />
							<PrivateRoute
								exact
								path="/mes-fichiers"
								component={MesFichiers}
							/>

							<PrivateRoute
								path="/mes-fichiers/:bucketName"
								exact
								component={NavigationFiles}
							/>
							<PrivateRoute
								path="/mes-fichiers/:bucketName/*"
								component={NavigationFiles}
							/>
							<PrivateRoute
								exact
								path="/mes-secrets"
								component={MesSecretsHome}
							/>
							<PrivateRoute
								path="/mes-secrets/:idep/*"
								component={MesSecrets}
							/>
							<PrivateRoute path="/mes-secrets/:idep" component={MesSecrets} />

							<PrivateRoute
								path="/visite-guidee"
								component={VisiteGuideeDebut}
							/>
							<Route path="/" component={() => <Redirect to="/accueil" />} />
						</Switch>
					</main>
					<Footer />
					<Notifications />
					<QuickAccess />
				</div>
				<VisiteGuidee />
				<CloudShell />
			</>
		</Router>
	</MuiThemeProvider>
);

export default App;
