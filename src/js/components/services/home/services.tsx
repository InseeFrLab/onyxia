  
import { Typography } from '@material-ui/core';
import Content from './content';
import DetailsService from '../details';
import FilDAriane, { fil } from 'js/components/commons/fil-d-ariane';
import { createGroup } from "type-route";
import { routes } from "app/routes/router";

type Props = {
	serviceSelectionne: boolean;
};

SharedServices.routeGroup = createGroup([routes.sharedServices]);

SharedServices.requireUserLoggedIn = false;

export function SharedServices({ serviceSelectionne }: Props) {

	return serviceSelectionne ? (
		<>
			<EnTete />
			<FilDAriane fil={fil.servicesCollaboratifs} />
			<Content />
			<DetailsService />
		</>
	) : (
			<>
				<EnTete />
				<FilDAriane fil={fil.servicesCollaboratifs} />
				<Content />
			</>
		);

}

const EnTete = () => (
	<div className="en-tete">
		<Typography variant="h2" align="center" color="textPrimary" gutterBottom>
			Applications partagées
		</Typography>
		<Typography variant="h3" align="center" gutterBottom>
			Des applications collaboratives et des services transverses
		</Typography>
	</div>
);

export default SharedServices;
