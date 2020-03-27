import React from 'react';
import Header from './header-content.component';
import ListeCartes from 'js/components/commons/service-liste/liste-cartes';
import FilDAriane, { fil } from 'js/components/commons/fil-d-ariane';
import { createFil } from 'js/utils';
import { getParamsFromProps } from 'js/utils';

const FilMonGroupe = ({ groupId }) => {
	const filGroupe = createFil(groupId || '');
	return <FilDAriane fil={[].concat(fil.mesServices, filGroupe)} />;
};

export default (props) => (
	<>
		<Header services={props.services} />
		<FilMonGroupe groupId={getParamsFromProps(props).groupId} />
		<ListeCartes {...props} />
	</>
);
