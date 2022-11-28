import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Avatar from "@mui/material/Avatar";
import Divider from "@mui/material/Divider";
import { MoreHoriz } from "@mui/icons-material";
import { ServiceStatus } from "js/model";

export const ServicesListe = ({ services, titre, openService, openDetails }: any) => (
    <Grid item sm={12} lg={4} classes={{ item: "carte" }}>
        <Card classes={{ root: "container" }}>
            <CardHeader
                title={titre}
                classes={{
                    root: "en-tete",
                    title: "titre"
                }}
            />
            <CardContent>
                <Liste
                    liste={services}
                    openService={openService}
                    openDetails={openDetails}
                />
            </CardContent>
        </Card>
    </Grid>
);

export const Liste = ({ liste, openService, openDetails }: any) => {
    const items = liste.map((service: any, i: any) => {
        const title = service.labels
            ? service.labels.ONYXIA_TITLE
            : service.apps.length === 0
            ? "Supprime moi"
            : service.apps[0].labels.ONYXIA_TITLE;
        const subtitle = service.labels
            ? service.labels.ONYXIA_SUBTITLE
            : service.apps.length === 0
            ? service.id
            : service.apps[0].labels.ONYXIA_TITLE;
        return (
            <div key={i}>
                <ListItem
                    button
                    classes={{ root: "liste-item" }}
                    onClick={() => openService(service)}
                >
                    <span
                        className={`etat-service ${getColorClassStateService(service)}`}
                    >
                        <div className="inner-1">
                            <div className="inner">
                                <Avatar
                                    src={service.labels.ONYXIA_LOGO}
                                    className="service-avatar"
                                />
                            </div>
                        </div>
                    </span>
                    <ListItemText primary={title} secondary={subtitle} />
                    <div
                        className="button-more"
                        title="plus d'options"
                        onClick={e => {
                            e.stopPropagation();
                            openDetails(service);
                        }}
                    >
                        <MoreHoriz />
                    </div>
                </ListItem>
                <Divider variant="inset" />
            </div>
        );
    });
    return <List>{items}</List>;
};

//
const getColorClassStateService = ({ status }: any) => {
    if (status === ServiceStatus.Running) {
        return "running";
    } else if (status === ServiceStatus.Deploying) {
        return "pause";
    } else if (status === ServiceStatus.Stopped) {
        return "warn";
    }
    return "down";
};

export { getServiceAvatar, getTitle, getSubtitle } from "./card-utils";
export { default as CardMyService } from "./card-my-service";
export { default as CardMyGroup } from "./card-my-group";
