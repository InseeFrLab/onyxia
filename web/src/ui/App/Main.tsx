import { useEffect, Suspense, memo } from "react";
import { tss } from "tss";
import { useRoute } from "ui/routes";
import { useSplashScreen } from "onyxia-ui";
import { keyframes } from "tss-react";
import { objectKeys } from "tsafe/objectKeys";
import { pages } from "ui/pages";
import { useCore, useCoreState } from "core";
import { CircularProgress } from "onyxia-ui/CircularProgress";

type Props = {
    className?: string;
};

export const Main = memo((props: Props) => {
    const { className } = props;

    const route = useRoute();

    const { userAuthentication } = useCore().functions;
    const { isUserLoggedIn } = useCoreState("userAuthentication", "authenticationState");

    const { classes } = useStyles();

    return (
        <main className={className}>
            <Suspense fallback={<SuspenseFallback />}>
                {(() => {
                    for (const pageName of objectKeys(pages)) {
                        //You must be able to replace "home" by any other page and get no type error.
                        const page = pages[pageName as "home"];

                        if (page.routeGroup.has(route)) {
                            if (page.getDoRequireUserLoggedIn(route) && !isUserLoggedIn) {
                                userAuthentication.login({
                                    doesCurrentHrefRequiresAuth: true
                                });
                                return (
                                    <div className={classes.loginRedirect}>
                                        <CircularProgress size={70} />
                                    </div>
                                );
                            }

                            return (
                                <page.LazyComponent
                                    className={classes.page}
                                    route={route}
                                />
                            );
                        }
                    }

                    return <pages.page404.LazyComponent />;
                })()}
            </Suspense>
        </main>
    );
});

function SuspenseFallback() {
    const { hideRootSplashScreen } = useSplashScreen();

    useEffect(() => {
        return () => {
            hideRootSplashScreen();
        };
    }, []);

    return null;
}

const useStyles = tss.create({
    page: {
        animation: `${keyframes`
            0% {
                opacity: 0;
            }
            100% {
                opacity: 1;
            }
            `} 400ms`
    },
    loginRedirect: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100%"
    }
});
