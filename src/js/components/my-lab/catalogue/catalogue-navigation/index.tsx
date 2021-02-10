import { createAiguilleur } from 'js/components/commons/variable-location/createAiguilleur';
import Root from './root';
import { Leaf } from './leaf/catalogue';
import Node from './node';
import './catalogue.scss';
import type { Route } from "type-route";
import { routes } from "app/router";
import { createGroup } from "type-route";
import { typeRouteRouteToDomLocation } from "js/utils/typeRouteRouteToDomLocation";

const isLeaf = async ({ pathname }: { pathname: string; }) => {
	const nb = pathname
		.replace('/my-lab/catalogue', '')
		.split('/')
		.filter((m) => m.trim().length > 0);
	return nb.length > 1;
};

const isRoot = async ({ pathname }: { pathname: string; }) =>
	pathname === '/my-lab/catalogue' || pathname === '/my-lab/catalogue/';

const Aiguilleur = createAiguilleur({
	Leaf,
	Node,
	Root,
	isRoot,
	isLeaf
});

export default Aiguilleur;


Catalogue.routeGroup = createGroup([routes.catalog]);

Catalogue.requireUserLoggedIn = true;

export function Catalogue(
	{ route, ...props }:
		Omit<Parameters<typeof Aiguilleur>[0], "location">
		&
		{ route: Route<typeof Catalogue.routeGroup>; }
) {

	return (
		<Aiguilleur
			{...props}
			location={typeRouteRouteToDomLocation(route)}
		/>
	);

}