import React from 'react';
import Header from './header';
import FilDAriane, { fil } from 'js/components/commons/fil-d-ariane';
import ListeCartes from 'js/components/commons/service-liste/liste-cartes';

type AppProps = { message: string };
const App = ({ message }: AppProps) => (
	<>
		<Header />
		<FilDAriane fil={fil.mesServices} />
		<ListeCartes
			changerEtatService={() => console.log('changer etat')}
			groupe={undefined}
			initialiser={() => console.log('init')}
		/>
		<div>{message} Hello world</div>
	</>
);
export default App;
