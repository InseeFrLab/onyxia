import React from 'react';
import Typography from '@material-ui/core/Typography';
import { Prec, Next } from './../vignette-commons';
import D from 'js/i18n';

export default {
	description: class Vignette extends React.Component {
		render() {
			return (
				<>
					<Typography variant="h6" gutterBottom>
						{D.guidedTourMySelfServiceTitle}
					</Typography>
					<Typography variant="body1" gutterBottom>
						{D.guidedTourVignette12Text1}
					</Typography>
					<Typography variant="body1" gutterBottom>
						{D.guidedTourVignette12Text2}
					</Typography>
				</>
			);
		}
	},
	actions: ({ prec, next }) => {
		return (
			<>
				<Prec prec={prec} />
				<Next next={next} />
			</>
		);
	},
};
