import React from "react";
import Typography from "@material-ui/core/Typography";
import { Button, Icon } from "@material-ui/core";
import Divider from "@material-ui/core/Divider";
import {
  RocketChatIcon,
  GrafanaIcon,
  GhosthIcon
} from "js/components/commons/icons";
import "./footer.scss";
import conf from './../../../configuration'

class Footer extends React.Component {
  render() {
    return (
      <footer className="footer">
        <Divider light />
        <div className="liens-rapides">
          <LienRapide
            url={conf.FOOTER["grafana-url"]}
            icon={<GrafanaIcon />}
          >
            Graphana
          </LienRapide>

          <LienRapide
            url={conf.FOOTER.ONYXIA.rocketchat}
            icon={<RocketChatIcon />}
          >
            RocketChat
          </LienRapide>

          <LienRapide
            url={conf.FOOTER["ghost-url"]}
            icon={<GhosthIcon width={15} height={15} />}
          >
            le blog de l'Innovation
          </LienRapide>
        </div>
        <Typography gutterBottom noWrap>
          <LienSimple href={conf.FOOTER.ONYXIA.git}>
            contribuer
          </LienSimple>
          <LienSimple href={conf.FOOTER["swagger-api"]}>
            notre api
          </LienSimple>
        </Typography>
      </footer>
    );
  }
}

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
