import Typography from "@material-ui/core/Typography";
import { Button, Icon } from "@material-ui/core";
import Divider from "@material-ui/core/Divider";
import "./footer.scss";
import { getValidatedEnv } from "js/validatedEnv";

const env = getValidatedEnv();

const Footer = () => {
    return (
        <footer className="footer">
            <Divider light />
            <div className="liens-rapides">
                {env.FOOTER.MONITORING_URL && (
                    <LienRapide
                        url={env.FOOTER.MONITORING_URL}
                        icon={<Icon>equalizer</Icon>}
                    >
                        Monitoring
                    </LienRapide>
                )}

                {env.FOOTER.ONYXIA.CHAT_ROOM && (
                    <LienRapide
                        url={env.FOOTER.ONYXIA.CHAT_ROOM}
                        icon={<Icon>group</Icon>}
                    >
                        Chat Room for onyxia user
                    </LienRapide>
                )}
            </div>
            <Typography gutterBottom noWrap>
                {env.FOOTER.ONYXIA.GIT && (
                    <LienSimple href={env.FOOTER.ONYXIA.GIT}>
                        Contribuer au projet
                    </LienSimple>
                )}
                {env.FOOTER.SWAGGER_API && (
                    <LienSimple href={env.FOOTER.SWAGGER_API}>REST API</LienSimple>
                )}
            </Typography>
        </footer>
    );
};

const LienRapide = ({ url, icon, children }: any) => (
    <Button onClick={() => window.open(url)} className="lien-rapide">
        <span className="icone">{icon}</span>
        <span className="titre">{children}</span>
    </Button>
);

const LienSimple = ({ children, href }: any) => (
    <a href={href} className="lien-simple" target="_blank" rel="noopener noreferrer">
        <Icon className="chevron">keyboard_arrow_right</Icon>

        {children}
    </a>
);

export default Footer;
