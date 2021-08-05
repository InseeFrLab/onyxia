import { Grid } from "@material-ui/core/";
import { CardMyGroup } from "js/components/commons/service-card";
import CardChecker from "./card-checker";
import { Service, Group } from "js/model";
import { Alert } from "js/components/commons/Alert";
import D from "js/i18n";

interface Props {
    services: Service[];
    groups: Group[];
}

const Cards = ({ services, groups }: Props) =>
    (!services || services.length === 0) && (!groups || groups.length === 0) ? (
        <Alert severity="warning" message={D.noService} />
    ) : (
        <Grid container spacing={8} classes={{ container: "cartes" }}>
            {services &&
                services.map((service, i) => <CardChecker key={i} service={service} />)}
            {groups && groups.map((group, i) => <CardMyGroup key={i} group={group} />)}
        </Grid>
    );

export default Cards;
