import React from 'react';
import { Typography, Grid } from '@material-ui/core';
import FilDAriane, { fil } from 'js/components/commons/fil-d-ariane';
import TrainingCard from 'js/components/commons/training-card';
import { wrapPromise } from 'js/utils';
import { axiosURL } from "js/utils/axios-config";
import { getValidatedEnv } from "app/validatedEnv";
import { useRoute } from "app/router";

const env = getValidatedEnv();

const resource = wrapPromise(axiosURL(env.CONTENT.TRAININGS_URL));

const Content = () => {
	const res = resource.read();

	const route= useRoute();

	const id = route.params.courseCode;

	const trainings = id
		? (res.find((r) => r.courseCode === id) &&
				res.find((r) => r.courseCode === id).hasPart) ||
		  []
		: res;
	const parent = res.find((r) => r.courseCode === id);
	const filAccessor = id
		? fil.training(parent.courseCode, parent.name)
		: fil.trainings;
	return (
		<>
			<div className="en-tete">
				<Typography
					variant="h2"
					align="center"
					color="textPrimary"
					gutterBottom
				>
					La liste des formations disponibles.
				</Typography>
			</div>
			<FilDAriane fil={filAccessor} />
			<div className="contenu accueil">
				<Grid container spacing={8} classes={{ container: 'cartes' }}>
					{trainings.map((f) => (
						<TrainingCard key={f.courseCode} training={f} />
					))}
				</Grid>
			</div>
		</>
	);
};

export default Content;