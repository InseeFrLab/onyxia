import React from 'react';
import Typography from '@material-ui/core/Typography';
import { Button, Icon } from '@material-ui/core';
import Divider from '@material-ui/core/Divider';
import { GhosthIcon } from 'js/components/commons/icons';
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

				{conf.FOOTER.ONYXIA.CHAT && (
					<LienRapide url={conf.FOOTER.ONYXIA.CHAT} icon={<Icon>group</Icon>}>
						Chat
					</LienRapide>
				)}

				{conf.FOOTER.GHOST_URL && (
					<LienRapide
						url={conf.FOOTER.GHOST_URL}
						icon={<GhosthIcon width={15} height={15} />}
					>
						le blog de l'Innovation
					</LienRapide>
				)}
			</div>
			<Typography gutterBottom noWrap>
				<LienSimple href={conf.FOOTER.ONYXIA.GIT}>contribuer</LienSimple>
				<LienSimple href={conf.FOOTER.SWAGGER_API}>notre api</LienSimple>
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
