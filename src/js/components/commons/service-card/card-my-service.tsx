import { useState } from "react";
import {
    Icon,
    IconButton,
    Badge,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText
} from "@mui/material/";
import dayjs from "dayjs";
import { CarteService } from "js/components/commons/service-card/card-service.component";
import Pile from "js/components/commons/pile";
import Chronometer from "js/components/commons/chronometer";
import { getServiceAvatar, getTitle, getSubtitle } from "./card-utils";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { Service, ServiceStatus } from "js/model";
import "./card.scss";
import { routes } from "ui/routes";

interface Props {
    service: Service;
    handleClickLaunch?: (func: () => void) => void;
}

const CarteMonService = ({ service, handleClickLaunch }: Props) => {
    const expiration = dateExpiration({ env: {} }); // TODO : restore this
    return (
        <CarteService
            id={service.id}
            expiration={(expiration && isExpired(expiration)) as any}
            wait={service.status === "DEPLOYING"}
            pause={service.instances === 0}
            title={getTitle(service) as any}
            subtitle={getSubtitle(service) as any}
            avatar={getServiceAvatar(service) as any}
            actions={getActions(service)(handleClickLaunch)}
            contenu={getContenu(service)}
        />
    );
};

const getActions = (service: Service) => (launch: any) => () => {
    const [showPostInstall, setShowPostInstall] = useState(false);
    return (
        <>
            {service.postInstallInstructions && (
                <IconButton
                    id={`button-post-install-${service.id}`}
                    color="secondary"
                    aria-label="Post install instructions"
                    onClick={() => setShowPostInstall(true)}
                >
                    <Icon>info</Icon>
                </IconButton>
            )}
            {showPostInstall && (
                <Dialog
                    open={true}
                    onClose={() => setShowPostInstall(false)}
                    aria-labelledby="alert-dialog-title"
                    aria-describedby="alert-dialog-description"
                >
                    <DialogTitle id="alert-dialog-title">{"Usage info"}</DialogTitle>
                    <DialogContent>
                        <DialogContentText id="alert-dialog-description">
                            {service.postInstallInstructions}
                        </DialogContentText>
                    </DialogContent>
                </Dialog>
            )}

            {getLaunchIcon(service)(launch)}
            <a
                {...routes.myService({
                    "serviceId": service.id.replace(/^\//, "")
                }).link}
            >
                <IconButton
                    id={`bouton-details-${service.id}`}
                    color="secondary"
                    aria-label="plus de détails"
                >
                    <Icon>build</Icon>
                </IconButton>
            </a>
        </>
    );
};

const getLaunchIcon = (service: Service) => (handleClickLaunch: any) =>
    service.status === ServiceStatus.Running ? (
        service.urls && service.urls.length > 0 ? (
            <IconButton
                color="secondary"
                aria-label="ouvrir"
                onClick={() => window.open(getServiceUrl(service))}
            >
                <Icon>launch</Icon>
            </IconButton>
        ) : null
    ) : (
        <IconButton
            color="secondary"
            aria-label="démarrer"
            onClick={() => {
                if (handleClickLaunch) {
                    handleClickLaunch(service);
                }
            }}
        >
            <PlayArrowIcon fontSize="large" />
        </IconButton>
    );

const getContenu = (service: any) => () => {
    const max = 5;
    const cpu = Math.ceil(computeCpu(service.cpus)(max));
    const ram = Math.ceil(compterRam(service.mem)(max));
    return (
        <>
            <div className="paragraphe">
                {service.status === "RUNNING" && service.startedAt ? (
                    <>
                        <div className="titre">Temps d&rsquo;activité</div>
                        <Chronometer start={service.startedAt} />
                    </>
                ) : null}
            </div>
            {service.instances ? (
                <div className="paragraphe">
                    <div className="titre">Consommations</div>
                    <span className="pile">
                        <Pile
                            small
                            size={cpu}
                            sizeMax={max}
                            label={getLabel("cpu")(cpu * 2)}
                        />
                    </span>
                    <span className="pile">
                        <Pile
                            small
                            size={ram}
                            sizeMax={max}
                            label={getLabel("mem")(ram * 2)}
                        />
                    </span>
                </div>
            ) : null}
        </>
    );
};

const computeCpu = (cpu: any) => (max: any) => Math.min(max, (cpu * 10) / 2);

const compterRam = (ram: any) => (max: any) => Math.min(max, ram / 2048);

const getLabel = (label: any) => (how: any) => () =>
    (
        <span className="pile-label">
            <Badge badgeContent={how} color="primary" classes={{ badge: "badge" }}>
                <span className="titre-label">{label}</span>
            </Badge>
        </span>
    );

const getServiceUrl = (service: Service) =>
    service.urls ? service.urls.sort()[0].split(",")[0] : undefined;

export default CarteMonService;

const dateExpiration = ({ env }: any) =>
    env && env.AWS_EXPIRATION
        ? dayjs(env.AWS_EXPIRATION).format("YYYY-MM-DDTHH:mm:ssZ")
        : undefined;

const isExpired = (date: any) =>
    (date && !date.isValid()) ||
    (date && date.isValid() && date.valueOf() - dayjs().valueOf() <= 0);
