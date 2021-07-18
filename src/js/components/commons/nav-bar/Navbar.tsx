import { useState, useCallback, useMemo } from "react";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import { Fab } from "@material-ui/core";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import { IconButton, Icon } from "@material-ui/core/";
import MenuIcon from "@material-ui/icons/Menu";
import AppMenu from "./app-menu";
import { LoginModal } from "js/components/authentication";
import "./style.scss";
import { getScreenTypeFromWidth } from "js/model/ScreenType";
import type { ScreenType } from "js/model/ScreenType";
import { thunks } from "lib/setup";

import { actions } from "js/redux/legacyActions";
import {
    useSelector,
    useDispatch,
    useAppConstants,
} from "app/interfaceWithLib/hooks";
import { useWindowInnerSize } from "onyxia-ui";

export const Navbar: React.FC<{}> = () => {
    const [isOpen, setIsOpen] = useState(false);

    const { isUserLoggedIn } = useAppConstants();

    const { windowInnerWidth } = useWindowInnerSize();

    const screenType = useMemo(
        () => getScreenTypeFromWidth(windowInnerWidth),
        [windowInnerWidth],
    );

    const displayLogin = useSelector(state => state.app.displayLogin);
    const redirectUri = useSelector(state => state.app.redirectUri);
    const dispatch = useDispatch();

    const handleClickMenu = useCallback(() => setIsOpen(true), []);
    const handleClose = useCallback(() => setIsOpen(false), []);
    const handleLogout = useCallback(() => {
        dispatch(thunks.app.logout());
    }, [dispatch]);
    const handleLogin = useCallback(
        () => dispatch(actions.displayLogin({ "doDisplay": true })),
        [dispatch],
    );
    const handleCloseLoginModal = useCallback(
        () => dispatch(actions.displayLogin({ "doDisplay": false })),
        [dispatch],
    );

    return (
        <div className="root">
            <AppBar position="static" color="primary">
                <Toolbar>
                    <IconButton
                        className="menubutton"
                        color="inherit"
                        aria-label="Menu"
                        onClick={handleClickMenu}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Link to="/accueil">
                        <img
                            className="avatar"
                            src={isNoel() ? "/onyxia-noel.svg" : "/onyxia.svg"}
                            alt="onyxia"
                        />
                    </Link>
                    <Typography variant="h1" color="inherit" className="flex">
                        Onyxia
                    </Typography>

                    {isUserLoggedIn ? (
                        <Link to="/mon-compte">
                            <LogoMonCompte screenType={screenType} />
                        </Link>
                    ) : (
                        <LoginButton
                            screenType={screenType}
                            handleClick={handleLogin}
                        />
                    )}
                </Toolbar>
                <AppMenu
                    open={isOpen}
                    authenticated={isUserLoggedIn}
                    login={handleLogin}
                    logout={handleLogout}
                    handleClose={handleClose}
                    startVisite={actions.startVisite}
                />
                <LoginModal
                    open={displayLogin}
                    redirectUri={redirectUri}
                    handleClose={handleCloseLoginModal}
                />
            </AppBar>
        </div>
    );
};

const LoginButton: React.FC<{
    handleClick: () => void;
    screenType: ScreenType;
}> = ({ handleClick, screenType }) =>
    screenType === "SMALL" ? (
        <Fab id="bouton-login" data-testid="bouton-login" onClick={handleClick}>
            <Icon className="login-mini">login</Icon>
        </Fab>
    ) : (
        <Fab
            id="bouton-login"
            data-testid="bouton-login"
            variant="extended"
            aria-label="login"
            onClick={handleClick}
        >
            <Icon className="login">login</Icon>
            login
        </Fab>
    );

const LogoMonCompte: React.FC<{ screenType: ScreenType }> = ({ screenType }) =>
    screenType === "SMALL" ? (
        <Fab id="bouton-mon-compte">
            <Icon className="bouton-mon-compte-mini">person</Icon>
        </Fab>
    ) : (
        <Fab id="bouton-mon-compte" variant="extended" aria-label="logout">
            <Icon className="bouton-mon-compte">person</Icon>
            Mon compte
        </Fab>
    );

const isNoel = () => {
    const m = dayjs();
    const day = m.date();
    const month = m.month();
    if ((month === 11 && day > 15) || (month === 0 && day < 7)) {
        return true;
    }

    return false;
};
