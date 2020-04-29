import React from 'react';
import {
	Paper,
	Typography,
	Table,
	TableHead,
	TableRow,
	TableCell,
	TableBody,
} from '@material-ui/core';
import Titre from 'js/components/commons/titre';
import CopyableField from 'js/components/commons/copyable-field';

interface Props {
	env: object;
}

const ServiceEnv = ({ env }: Props) => {
	return (
		<Paper className="paragraphe" elevation={1}>
			<Typography variant="h3" gutterBottom>
				<Titre titre="	Configuration du service" wait={false} />
			</Typography>

			<Table>
				<TableHead>
					<TableRow>
						<TableCell>Propriétés</TableCell>
						<TableCell>Valeur</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{Object.entries(env).map(([key, value], i) => (
						<TableRow key={i}>
							<TableCell>{key}</TableCell>
							<TableCell>
								<CopyableField copy value={value} />
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</Paper>
	);
};

export default ServiceEnv;
