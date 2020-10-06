import React from 'react';
import { Typography, Paper } from '@material-ui/core';
import {
	Table,
	TableBody,
	TableCell,
	TableRow,
	Icon,
	Fab,
} from '@material-ui/core';

export const MyPolicy: React.FC<{ 
	policy: { Resource: string[] }; 
	handleDelete?: (path: string)=> void; 
}> = ({ policy, handleDelete }) => {

	if (!policy) return null;

	const { Resource } = policy;
	return (
		<Paper className="paragraphe" elevation={1}>
			<Typography variant="h3" gutterBottom>
				Vos règles de diffusion
			</Typography>
			<Typography variant="body1" gutterBottom>
				La liste de l'ensemble de vos ressources publiques.
			</Typography>
			<Table size="small">
				<TableBody>
					{Resource.map((path) => (
						<TableRow key={path}>
							<TableCell align="left">{path}</TableCell>
							<TableCell align="right">
								<Fab
									size="small"
									color="secondary"
									aria-label="Supprimer"
									onClick={() => typeof handleDelete === 'function'
											? handleDelete(path)
											: null
									}
								>
									<Icon>clear</Icon>
								</Fab>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</Paper>
	);
};
