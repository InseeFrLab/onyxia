import { Link } from "react-router-dom";
import {
    IconButton,
    Drawer,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Icon,
} from "@material-ui/core/";
import { Clear, Home } from "@material-ui/icons";
import { BecherIcon, CatalogueIcon, PokerHandIcon } from "js/components/commons/icons";
import { getValidatedEnv } from "js/validatedEnv";
import D from "js/i18n";

import { useIsBetaModeEnabled, useSelectedRegion } from "app/libApi";

const env = getValidatedEnv();

const ItemLogin = ({ login }: any) => (
    <ListItem button onClick={login}>
        <ListItemIcon>
            <Icon className="login" style={{ color: "forestgreen" }}>
                power_settings_new_icon
            </Icon>
        </ListItemIcon>
        <ListItemText primary="Login" />
    </ListItem>
);

export default ({ open, handleClose, authenticated, login }: any) => {
    const { isBetaModeEnabled } = useIsBetaModeEnabled();

    const selectedRegion = useSelectedRegion();

    return (
        <Drawer anchor="left" open={open} onClose={handleClose}>
            <div className="menu" tabIndex={0}>
                <IconButton onClick={handleClose}>
                    <Clear />
                </IconButton>
                <List onClick={handleClose}>
                    {authenticated ? null : <ItemLogin login={login} />}
                    <ListItem button component={Link} to="/accueil">
                        <ListItemIcon>
                            <Home />
                        </ListItemIcon>
                        <ListItemText primary="Accueil" />
                    </ListItem>
                    <ListItem button component={Link} to="/visite-guidee">
                        <ListItemIcon>
                            <Icon>forward</Icon>
                        </ListItemIcon>
                        <ListItemText primary={D.guidedTourTitle} />
                    </ListItem>
                    <ListItem>
                        <ListItemText primary="La plateforme" />
                    </ListItem>
                    <ListItem
                        button
                        component={Link}
                        to="/trainings"
                        disabled={!env.CONTENT.TRAININGS_URL}
                    >
                        <ListItemIcon>
                            <Icon>menu_book</Icon>
                        </ListItemIcon>
                        <ListItemText primary={D.trainingTitle} />
                    </ListItem>
                    <ListItem button component={Link} to="/services">
                        <ListItemIcon>
                            <PokerHandIcon width={30} height={30} />
                        </ListItemIcon>
                        <ListItemText primary="Services" />
                    </ListItem>
                    <ListItem>
                        <ListItemText primary="Services à la demande" />
                    </ListItem>
                    <ListItem button component={Link} to="/my-lab/catalogue">
                        <ListItemIcon>
                            <CatalogueIcon width={20} height={20} />
                        </ListItemIcon>
                        <ListItemText primary="Catalogue" />
                    </ListItem>
                    <ListItem button component={Link} to="/my-services">
                        <ListItemIcon>
                            <BecherIcon height={20} width={20} />
                        </ListItemIcon>
                        <ListItemText primary="Mon labo" />
                    </ListItem>
                    <ListItem>
                        <ListItemText primary="Données" />
                    </ListItem>
                    <ListItem button component={Link} to="/mes-fichiers">
                        <ListItemIcon>
                            <Icon>folder</Icon>
                        </ListItemIcon>
                        <ListItemText primary={D.myFilesTitle} />
                    </ListItem>
                    <ListItem button component={Link} to="/mes-secrets">
                        <ListItemIcon>
                            <Icon>vpn_key</Icon>
                        </ListItemIcon>
                        <ListItemText primary={D.mySecretsTitle} />
                    </ListItem>
                    {isBetaModeEnabled &&
                    selectedRegion?.services?.type === "KUBERNETES" ? (
                        <>
                            <ListItem>
                                <ListItemText primary="DevOps" />
                            </ListItem>
                            <ListItem button component={Link} to="/cluster">
                                <ListItemIcon>
                                    <Icon>domain</Icon>
                                </ListItemIcon>
                                <ListItemText primary={D.cluster} />
                            </ListItem>
                        </>
                    ) : null}
                    {isBetaModeEnabled ? (
                        <>
                            <ListItem>
                                <ListItemText primary="Informations" />
                            </ListItem>
                            <ListItem button component={Link} to="/about">
                                <ListItemIcon>
                                    <Icon>infoIcon</Icon>
                                </ListItemIcon>
                                <ListItemText primary={D.about} />
                            </ListItem>
                        </>
                    ) : null}
                </List>
            </div>
        </Drawer>
    );
};
