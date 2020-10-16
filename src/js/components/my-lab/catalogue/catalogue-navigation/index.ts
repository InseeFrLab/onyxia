import { createAiguilleur } from 'js/components/commons/variable-location/createAiguilleur';
import Root from './root';
import { Leaf } from './leaf/catalogue';
import Node from './node';
import './catalogue.scss';

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
