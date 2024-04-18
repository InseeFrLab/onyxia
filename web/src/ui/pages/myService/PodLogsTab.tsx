import { useEffect, useState } from "react";
import Pagination from "@mui/material/Pagination";
import { tss } from "tss";
import { Text } from "onyxia-ui/Text";
import { assert } from "tsafe/assert";
import { LoadingDots } from "ui/shared/LoadingDots";
import { useCoreState, useCore } from "core";

type Props = {
    className?: string;
    helmReleaseName: string;
    podName: string;
};

export function PodLogsTab(props: Props) {
    const { className, helmReleaseName, podName: prodName_props } = props;

    const { classes, cx } = useStyles();

    const { podLogs } = useCore().functions;

    useEffect(() => {
        const { setInactive } = podLogs.setActive({
            helmReleaseName,
            "podName": prodName_props
        });

        return setInactive;
    }, [helmReleaseName, prodName_props]);

    const { isReady, paginatedLogs, podName } = useCoreState("podLogs", "main");

    return (
        <div className={cx(className, classes.root)}>
            {!isReady ? (
                <LoadingDots />
            ) : (
                <ActualLogs paginatedLogs={paginatedLogs} podName={podName} />
            )}
        </div>
    );
}

function ActualLogs(props: { paginatedLogs: string[]; podName: string }) {
    const { paginatedLogs, podName } = props;

    const { classes } = useStyles();

    const [currentPage, setCurrentPage] = useState(paginatedLogs.length);
    const [doFollow, setDoFollow] = useState(true);

    useEffect(() => {
        setCurrentPage(paginatedLogs.length);
        setDoFollow(true);
    }, [podName]);

    const [preElement, setPreElement] = useState<HTMLPreElement | null>(null);

    useEffect(() => {
        if (!doFollow) {
            return;
        }

        setCurrentPage(currentPage => {
            if (currentPage !== paginatedLogs.length - 1) {
                return currentPage;
            }

            return paginatedLogs.length;
        });
    }, [paginatedLogs.length, doFollow]);

    useEffect(() => {
        if (!doFollow) {
            return;
        }

        if (preElement === null) {
            return;
        }

        if (currentPage !== paginatedLogs.length) {
            return;
        }

        // Scroll to bottom
        preElement.scrollTop = preElement.scrollHeight;
    }, [
        preElement,
        currentPage,
        paginatedLogs[paginatedLogs.length - 1].length,
        doFollow
    ]);

    return (
        <>
            <Pagination
                classes={{ "ul": classes.paginationUl }}
                showFirstButton
                showLastButton
                size="medium"
                count={paginatedLogs.length}
                color="primary"
                page={currentPage}
                onChange={(_, page) => setCurrentPage(page)}
            />

            <pre
                ref={setPreElement}
                className={classes.pre}
                onScroll={() => {
                    if (currentPage !== paginatedLogs.length) {
                        setDoFollow(false);
                        return;
                    }

                    assert(preElement !== null);

                    const isScrolledToBottom = (() => {
                        const scrollPosition =
                            preElement.scrollTop + preElement.clientHeight;
                        return scrollPosition >= preElement.scrollHeight - 1;
                    })();

                    setDoFollow(isScrolledToBottom);
                }}
            >
                {currentPage === 1 && paginatedLogs.length > 5 && (
                    <Text typo="body 1" className={classes.pageAnnotation}>
                        This is not necessarily the first logs, older logs might have been
                        flushed&nbsp;
                    </Text>
                )}

                {paginatedLogs[currentPage - 1]}
                {currentPage === paginatedLogs.length && (
                    <Text typo="body 1" className={classes.newLogsText}>
                        New logs are displayed in realtime <LoadingDots />
                    </Text>
                )}
            </pre>
        </>
    );
}

const useStyles = tss.withName({ PodLogsTab }).create(({ theme }) => ({
    "root": {
        "height": "100%",
        "overflow": "hidden",
        "display": "flex",
        "flexDirection": "column"
    },
    "paginationUl": {
        "justifyContent": "end"
    },
    "pageAnnotation": {
        "position": "absolute",
        "top": theme.spacing(2),
        "right": theme.spacing(2),
        "fontStyle": "italic"
    },
    "newLogsText": {
        "marginTop": theme.spacing(4),
        "fontStyle": "italic",
        "color": theme.colors.useCases.typography.textSecondary
    },
    "pre": {
        "padding": theme.spacing(5),
        "backgroundColor": theme.colors.useCases.surfaces.background,
        "borderRadius": theme.spacing(2),
        "position": "relative",
        "flex": 1,
        "overflow": "auto",
        "scrollBehavior": "smooth"
    }
}));
