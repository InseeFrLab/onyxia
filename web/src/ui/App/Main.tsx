import { useEffect, Suspense, memo } from "react";
import { tss } from "tss";
import { useRoute } from "ui/routes";
import { useSplashScreen } from "onyxia-ui";
import { keyframes } from "tss-react";
import { objectKeys } from "tsafe/objectKeys";
import { pages } from "ui/pages";

type Props = {
    className?: string;
};

export const Main = memo((props: Props) => {
    const { className } = props;

    const route = useRoute();

    const { classes } = useStyles();

    return (
        <main className={className}>
            <Suspense fallback={<SuspenseFallback />}>
                {(() => {
                    for (const pageName of objectKeys(pages)) {
                        //We must be able to replace "home" by any other page and get no type error.
                        const page = pages[pageName as "home"];

                        if (page.routeGroup.has(route)) {
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

const useStyles = tss.withName({ Main }).create({
    page: {
        animation: `${keyframes`
            0% {
                opacity: 0;
            }
            100% {
                opacity: 1;
            }
            `} 400ms`
    }
});
