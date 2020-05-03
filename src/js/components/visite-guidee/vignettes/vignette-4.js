import React from 'react';
import Typography from '@material-ui/core/Typography';
import { Next } from './../vignette-commons';
import { WarnIcon } from 'js/components/commons/icons';
import D from 'js/i18n';

export default {
	description: () => (
		<>
			<Typography variant="h6" gutterBottom>
				{D.guidedTourSelfServiceCatalogTitle}
			</Typography>
			<Typography variant="body1" gutterBottom>
				{D.guidedTourVignette4Text1}
			</Typography>
			<Typography variant="body1" gutterBottom>
				<span style={{ float: 'left', marginRight: '12px' }}>
					<WarnIcon />
				</span>
				{D.guidedTourVignette4Text2}
			</Typography>
		</>
	),
	actions: ({ next }) => <Next next={next} />,
};
