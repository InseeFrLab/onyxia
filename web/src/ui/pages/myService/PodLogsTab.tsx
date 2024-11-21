import { useEffect, useState } from "react";
import Pagination from "@mui/material/Pagination";
import { tss } from "tss";
import { Text } from "onyxia-ui/Text";
import { LoadingDots } from "ui/shared/LoadingDots";
import { useCoreState, useCore } from "core";
import { CircularProgress } from "onyxia-ui/CircularProgress";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import { declareComponentKeys, useTranslation } from "ui/i18n";

type Props = {
    className?: string;
    helmReleaseName: string;
    podName: string;
};

export function PodLogsTab(props: Props) {
    // Enforce that the actual component is fully reset when the podName changes
    return <ActualPodLogsTab key={props.podName} {...props} />;
}

function ActualPodLogsTab(props: Props) {
    const { className, helmReleaseName, podName } = props;

    const { classes, cx } = useStyles();

    const { podLogs } = useCore().functions;

    useEffect(() => {
        const { setInactive } = podLogs.setActive({
            helmReleaseName,
            podName
        });

        return setInactive;
    }, [helmReleaseName, podName]);

    const { isReady, paginatedLogs } = useCoreState("podLogs", "main");

    return (
        <div className={cx(className, classes.root)}>
            {!isReady ? (
                <div className={classes.circularProgressWrapper}>
                    <CircularProgress size={50} />
                </div>
            ) : (
                <ActualLogs paginatedLogs={paginatedLogs} />
            )}
        </div>
    );
}

function ActualLogs(props: { paginatedLogs: string[] }) {
    const { paginatedLogs } = props;

    const { classes } = useStyles();

    const [currentPage, setCurrentPage] = useState(paginatedLogs.length);
    const [doFollow, setDoFollow] = useState(true);

    const { t } = useTranslation({ PodLogsTab });

    useEffect(() => {
        if (!doFollow) {
            return;
        }

        setCurrentPage(paginatedLogs.length);
    }, [doFollow, paginatedLogs.length]);

    const [preElement, setPreElement] = useState<HTMLPreElement | null>(null);

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
            <div className={classes.controlsWrapper}>
                <FormControlLabel
                    control={
                        <Switch
                            checked={doFollow}
                            onChange={event => {
                                setDoFollow(event.target.checked);
                            }}
                        />
                    }
                    label="Follow"
                />

                <Pagination
                    showFirstButton
                    showLastButton
                    size="medium"
                    count={paginatedLogs.length}
                    color="primary"
                    page={currentPage}
                    onChange={(_, page) => setCurrentPage(page)}
                />
            </div>

            <pre ref={setPreElement} className={classes.pre}>
                {currentPage === 1 && paginatedLogs.length > 5 && (
                    <Text typo="body 1" className={classes.pageAnnotation}>
                        {t("not necessarily first logs")}
                        &nbsp;
                    </Text>
                )}

                {paginatedLogs[currentPage - 1]}
                {currentPage === paginatedLogs.length && (
                    <Text typo="body 1" className={classes.newLogsText}>
                        {t("new logs are displayed in realtime")} <LoadingDots />
                    </Text>
                )}
            </pre>
        </>
    );
}

const { i18n } = declareComponentKeys<
    "not necessarily first logs" | "new logs are displayed in realtime"
>()({ PodLogsTab });

export type I18n = typeof i18n;

const useStyles = tss.withName({ PodLogsTab }).create(({ theme }) => ({
    root: {
        height: "100%",
        overflow: "visible",
        display: "flex",
        flexDirection: "column"
    },
    circularProgressWrapper: {
        flex: 1,
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
    },
    controlsWrapper: {
        display: "flex",
        justifyContent: "space-between",
        paddingLeft: theme.spacing(1)
    },
    pageAnnotation: {
        position: "absolute",
        top: theme.spacing(2),
        right: theme.spacing(2),
        fontStyle: "italic"
    },
    newLogsText: {
        marginTop: theme.spacing(4),
        fontStyle: "italic",
        color: theme.colors.useCases.typography.textSecondary
    },
    pre: {
        padding: theme.spacing(5),
        backgroundColor: theme.colors.useCases.surfaces.background,
        borderRadius: theme.spacing(2),
        position: "relative",
        flex: 1,
        overflow: "auto",
        scrollBehavior: "smooth"
    }
}));
