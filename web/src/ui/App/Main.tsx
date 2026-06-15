import { Suspense, memo } from "react";
import { createPortal } from "react-dom";
import { tss } from "tss";
import { useRoute } from "ui/routes";
import { keyframes } from "tss-react";
import { objectKeys } from "tsafe/objectKeys";
import { pages } from "ui/pages";
import CircularProgress from "@mui/material/CircularProgress";
import { evtDeclaredComponents } from "pluginSystem";
import { useRerenderOnStateChange } from "evt/hooks/useRerenderOnStateChange";

type Props = {
    className?: string;
};

export const Main = memo((props: Props) => {
    const { className } = props;

    const route = useRoute();

    const { classes, cx } = useStyles();

    return (
        <main
            id={`page-container-${route.name}`}
            key={route.name || ""}
            className={cx(classes.root, className)}
        >
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
                <CustomComponent />
            </Suspense>
        </main>
    );
});

function CustomComponent() {
    useRerenderOnStateChange(evtDeclaredComponents);

    return (
        <>
            {evtDeclaredComponents.state
                .map(({ Component, containerElement }, i) =>
                    containerElement == null
                        ? null
                        : createPortal(<Component />, containerElement, i)
                )
                .filter(n => n !== null)}
        </>
    );
}

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
