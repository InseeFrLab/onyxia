import createAiguilleur from 'js/components/commons/variable-location';
import Root from './root';
import Leaf from './leaf';
import Node from './node';
import './catalogue.scss';

const isLeaf = async ({ pathname, search }) => {
	const nb = pathname
		.replace('/my-lab/catalogue', '')
		.split('/')
		.filter((m) => m.trim().length > 0);
	return nb.length > 1;
};

const isRoot = async ({ pathname, search }) =>
	pathname === '/my-lab/catalogue' || pathname === '/my-lab/catalogue/';
const Aiguilleur = createAiguilleur({
	leaf: Leaf,
	node: Node,
	root: Root,
	isRoot,
	isLeaf,
});

export default Aiguilleur;
