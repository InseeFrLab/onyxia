import React from 'react';
import { Icon, Avatar } from '@material-ui/core/';

export const ServiceCreeMessage = ({ id }) => (
	<Message icone="add" couleur="vert" id={id}>
		Votre service a été crée.
	</Message>
);

export const ServiceEchecMessage = ({ nom }) => (
	<Message icone="warning" couleur="rouge" nom={nom}>
		la création de votre service a échoué.
	</Message>
);

export const ServiceDemarreMessage = ({ ellapsed, id }) => (
	<Message icone="play_arrow" couleur="vert" id={id}>
		{`votre service a été démarré en ${Math.ceil(ellapsed / 1000)} secondes.`}
	</Message>
);

export const ServiceArreteMessage = ({ ellapsed, id }) => (
	<Message icone="pause" couleur="orange" id={id}>
		{`votre service a été arrêté en ${Math.ceil(ellapsed / 1000)} secondes.`}
	</Message>
);

export const ServiceSupprime = ({ id, groupe = false }) => (
	<Message icone="delete" couleur="orange" id={id}>
		Votre {groupe ? 'groupe' : 'service'} a été supprimé.
	</Message>
);

/* ***** */

const getId = (id) => (couleur) =>
	id ? <div className={`nom ${couleur}`}>{last(id.split('/'))}</div> : null;

const last = ([a, ...rest]) => (rest.length === 0 ? a : last(rest));

const getNom = (nom) => (couleur) =>
	nom ? <div className={`nom ${couleur}`}>{nom}</div> : null;

const Message = ({ nom, children, id, couleur = 'vert', icone }) => (
	<div className="message-service">
		{icone ? (
			<div className="icone">
				<Avatar className={` ${couleur}`}>
					<Icon>{icone}</Icon>
				</Avatar>
			</div>
		) : null}
		<div className="message">
			{getId(id)(couleur)}
			{getNom(nom)(couleur)}
			<span className="message">{children}</span>
		</div>
	</div>
);
