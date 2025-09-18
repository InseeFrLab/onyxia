import { Suspense, memo } from "react";
import { tss } from "tss";
import { useRoute } from "ui/routes";
import { keyframes } from "tss-react";
import { objectKeys } from "tsafe/objectKeys";
import { pages } from "ui/pages";
import CircularProgress from "@mui/material/CircularProgress";

type Props = {
    className?: string;
};

export const Main = memo((props: Props) => {
    const { className } = props;

    const route = useRoute();

    const { classes, cx } = useStyles();

    return (
        <main key={route.name || ""} className={cx(classes.root, className)}>
            <Suspense
                fallback={
                    <div className={classes.suspenseFallback}>
                        <CircularProgress />
                    </div>
                }
            >
                {(() => {
                    for (const pageName of objectKeys(pages)) {
                        const page = pages[pageName];

                        if (page.routeGroup.has(route)) {
                            return <page.LazyComponent />;
                        }
                    }

                    return <pages.page404.LazyComponent />;
                })()}
            </Suspense>
        </main>
    );
});

const useStyles = tss.withName({ Main }).create({
    root: {
        animation: `${keyframes`
            0% {
                opacity: 0;
            }
            100% {
                opacity: 1;
            }
            `} 400ms`
    },
    suspenseFallback: {
        display: "flex",
        height: "100%",
        justifyContent: "center",
        alignItems: "center"
    }
});
