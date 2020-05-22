import React from 'react';
import Typography from '@material-ui/core/Typography';
import { Button, Icon, Tooltip } from '@material-ui/core';
import Divider from '@material-ui/core/Divider';
import {
	RocketChatIcon,
	GrafanaIcon,
	GhosthIcon,
} from 'js/components/commons/icons';
import './footer.scss';
import conf from '../../../configuration';

import GitInfo from 'react-git-info/macro';

const Footer = () => {
	const gitInfo = GitInfo();
	return (
		<footer className="footer">
			<Divider light />
			<div className="liens-rapides">
				{conf.FOOTER.GRAFANA_URL && (
					<LienRapide url={conf.FOOTER.GRAFANA_URL} icon={<GrafanaIcon />}>
						Grafana
					</LienRapide>
				)}

				{conf.FOOTER.ONYXIA.ROCKETCHAT && (
					<LienRapide
						url={conf.FOOTER.ONYXIA.ROCKETCHAT}
						icon={<RocketChatIcon />}
					>
						RocketChat
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

			<Typography gutterBottom noWrap>
				<Tooltip title={gitInfo.commit.message}>
					<div>
						Version {gitInfo.tags.length > 0 ? gitInfo.tags[0] : gitInfo.branch}
						({gitInfo.commit.date})
					</div>
				</Tooltip>
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
