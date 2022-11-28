import { Link } from "react-router-dom";
import { Icon, IconButton, Badge } from "@mui/material/";
import { Avatar } from "@mui/material";
import Pile from "js/components/commons/pile";
import { groupeType } from "js/components/commons/prop-types";
import { CarteService } from "./card-service.component";
import { Group, Service } from "js/model";
import "./card.scss";

interface Props {
    group: Group;
}

const CarteMonGroupe = ({ group }: Props) => {
    const running = isOneRunning(group);
    return (
        <CarteService
            id={group.id}
            wait={false}
            pause={!running}
            title={getTitle(group) as any}
            subtitle={"Groupe d'applications"}
            avatar={(getAvatar as any)(group)}
            actions={getActions(group)}
            contenu={getContenu(group)(running)}
        />
    );
};

const getTitle = (groupe: any) =>
    groupe.apps.length > 0 ? groupe.apps[0].labels.ONYXIA_TITLE : "Groupe vide";

const getAvatar = () => (
    <Avatar>
        <Icon>folder</Icon>
    </Avatar>
);

const getActions = (groupe: any) => () =>
    (
        <Link to={`/my-services${groupe.id}`}>
            <IconButton color="secondary" aria-label="plus de détails">
                <Icon>subdirectory_arrow_right</Icon>
            </IconButton>
        </Link>
    );

const getContenu = (groupe: any) => (running: any) => () => {
    if (!running) return null;
    const max = 5;
    const cpu = Math.ceil(compterCpu(groupe.apps)(max));
    const ram = Math.ceil(compterRam(groupe.apps)(max));
    return (
        <div className="paragraphe">
            <div className="titre">Consommations</div>
            <span className="pile">
                <Pile small size={cpu} sizeMax={max} label={getLabel("cpu")(cpu * 2)} />
            </span>
            <span className="pile">
                <Pile small size={ram} sizeMax={max} label={getLabel("mem")(ram * 2)} />
            </span>
        </div>
    );
};

const isOneRunning = (group: Group) =>
    group.apps.reduce((a, { instances }) => a || instances > 0, false);

const compterCpu = (services: Service[]) => (max: number) =>
    Math.min(
        max,
        services.reduce((a, c) => a + (c.cpus * 10) / services.length, 0)
    );

const compterRam = (services: Service[]) => (max: number) =>
    Math.min(
        max,
        services.reduce((a, c) => a + c.mem / 2048 / services.length, 0)
    );

const getLabel = (label: any) => (how: any) => () =>
    (
        <span className="pile-label">
            <Badge badgeContent={how} color="primary" classes={{ badge: "badge" }}>
                <span className="titre-label">{label}</span>
            </Badge>
        </span>
    );
CarteMonGroupe.propTypes = { groupe: groupeType };
export default CarteMonGroupe;
