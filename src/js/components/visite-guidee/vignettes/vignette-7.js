import React from 'react';
import Typography from '@material-ui/core/Typography';
import { LinkTo } from './../vignette-commons';
import { BecherIcon } from 'js/components/commons/icons';
import D from 'js/i18n';

 
export default {
	description: class Diapo extends React.Component {
		render = () => (
			<>
				<Typography variant="h6" gutterBottom>
				{D.guidedTourSelfServiceCreationTitle}
				</Typography>
				<Typography variant="body1" gutterBottom>
				{D.guidedTourVignette7Text1}
				</Typography>
			</>
		);
	},
	actions: ({ next }) => (
		<LinkTo
			to="/my-services"
			onClick={next}
			title={D.btnMyLab}
			component={() => <BecherIcon height={20} width={20} color="#fff" />}
		/>
	),
};
