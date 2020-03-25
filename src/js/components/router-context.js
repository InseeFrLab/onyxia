import React, { createContext } from 'react';
/*
 * context permettant de suivre l'itinéraire des routes publiques.
 * quand une route privé demande authentification (ouverture de la modale d'auth),
 * elle doit pourvoir afficher la dernière route publique empruntée.
 */
export const createRouterContext = (InitialComponent) => (initialPathname) =>
	createContext({
		component: InitialComponent,
		pathname: initialPathname,
	});
/*
 * hoc pour permettre aux routes publiques de marquer le context.
 * et enregistrer le dernier composant routé.
 *
 */
export const createRouteComponent = (RouterContext) => (Route) => (props) => {
	return (
		<RouterContext.Provider
			value={{
				component: props.component || props.render,
				pathname: props.location.pathname,
			}}
		>
			<Route {...props} />
		</RouterContext.Provider>
	);
};
