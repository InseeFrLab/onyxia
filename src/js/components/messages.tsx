import { Icon, Avatar } from "@mui/material/";
import type { FunctionComponent } from "react";

export const ServiceCreeMessage: FunctionComponent<{
    id: string;
    message?: string;
}> = ({ id, message }) => (
    <Message icon="add" color="vert" id={id}>
        Votre service a été crée. {message ?? ""}
    </Message>
);

export const ServiceEchecMessage: FunctionComponent<{ nom: string }> = ({ nom }) => (
    <Message icon="warning" color="rouge" nom={nom}>
        la création de votre service a échoué.
    </Message>
);

export const ServiceDemarreMessage: FunctionComponent<{
    elapsed: number;
    id: string;
}> = ({ elapsed, id }) => (
    <Message icon="play_arrow" color="vert" id={id}>
        Votre service a été démarré en {Math.ceil(elapsed / 1000)} secondes.
    </Message>
);

export const ServiceArreteMessage: FunctionComponent<{
    elapsed: number;
    id: string;
}> = ({ elapsed, id }) => (
    <Message icon="pause" color="orange" id={id}>
        Votre service a été arrêté en {Math.ceil(elapsed / 1000)} secondes.
    </Message>
);

export const ServiceSupprime: FunctionComponent<{
    id: string;
    groupe?: boolean;
}> = ({ id, groupe = false }) => (
    <Message icon="delete" color="orange" id={id}>
        Votre {groupe ? "groupe" : "service"} a été supprimé.
    </Message>
);

/* ***** */

const Message: React.FunctionComponent<{
    icon: "add" | "warning" | "play_arrow" | "pause" | "delete";
    id?: string;
    nom?: string;
    color?: string;
    children?: React.ReactNode;
}> = ({ nom, id, color = "vert", icon, children }) => (
    <div className="message-service">
        {!icon ? null : (
            <div className="icon">
                <Avatar className={color}>
                    <Icon>{icon}</Icon>
                </Avatar>
            </div>
        )}
        <div className="message">
            {!id ? null : (
                <div className={`nom ${color}`}>{id.split("/").slice(-1)[0]}</div>
            )}
            {!nom ? null : <div className={`nom ${color}`}>{nom}</div>}
            <span className="message">{children}</span>
        </div>
    </div>
);
