import React from 'react';
import Typography from '@material-ui/core/Typography';
import { Button, Icon } from '@material-ui/core';
import Divider from '@material-ui/core/Divider';
import './footer.scss';
import conf from '../../../configuration';

const Footer = () => {
	return (
		<footer className="footer">
			<Divider light />
			<div className="liens-rapides">
				{conf.FOOTER.MONITORING_URL && (
					<LienRapide
						url={conf.FOOTER.MONITORING_URL}
						icon={<Icon>equalizer</Icon>}
					>
						Monitoring
					</LienRapide>
				)}

				{conf.FOOTER.ONYXIA.CHAT_ROOM && (
					<LienRapide
						url={conf.FOOTER.ONYXIA.CHAT_ROOM}
						icon={<Icon>group</Icon>}
					>
						Chat Room for onyxia user
					</LienRapide>
				)}

				{conf.FOOTER.BLOG_URL && (
					<LienRapide
						url={conf.FOOTER.BLOG_URL}
						icon={<Icon>LibraryBooks</Icon>}
					>
						le blog de l'Innovation
					</LienRapide>
				)}
			</div>
			<Typography gutterBottom noWrap>
				<LienSimple href={conf.FOOTER.ONYXIA.GIT}>Contribuer au projet</LienSimple>
				<LienSimple href={conf.FOOTER.SWAGGER_API}>API</LienSimple>
			</Typography>
		</footer>
	);
};

const LienRapide = ({ url, icon, children }) => (
	<Button onClick={() => window.open(url)} className="lien-rapide">
		<span className="icone">{icon}</span>
		<span className="titre">{children}</span>
	</Button>
);

const LienSimple = ({ children, href }) => (
	<a
		href={href}
		className="lien-simple"
		target="_blank"
		rel="noopener noreferrer"
	>
		<Icon className="chevron">keyboard_arrow_right</Icon>

		{children}
	</a>
);

export default Footer;
