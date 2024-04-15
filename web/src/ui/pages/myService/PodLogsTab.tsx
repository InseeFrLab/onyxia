import { useEffect } from "react";
import Pagination from "@mui/material/Pagination";
import { useState } from "react";
import { tss } from "tss";
import { Text } from "onyxia-ui/Text";
import { CircularProgress } from "onyxia-ui/CircularProgress";

type Props = {
    className?: string;
    paginatedLogs: string[];
};

export function PodLogsTab(props: Props) {
    const { className, paginatedLogs } = props;

    const { classes } = useStyles();

    const [currentPage, setCurrentPage] = useState(paginatedLogs.length);

    useEffect(() => {
        setCurrentPage(currentPage => {
            if (currentPage !== paginatedLogs.length - 1) {
                return currentPage;
            }

            return paginatedLogs.length;
        });
    }, [paginatedLogs.length]);

    return (
        <div className={className}>
            <Pagination
                className={classes.pagination}
                classes={{ "ul": classes.paginationUl }}
                showFirstButton
                showLastButton
                size="medium"
                count={paginatedLogs.length}
                color="primary"
                page={currentPage}
                onChange={(_, page) => setCurrentPage(page)}
            />

            <pre className={classes.pre}>
                {currentPage === paginatedLogs.length && (
                    <Text typo="body 1" className={classes.pageAnnotation}>
                        <CircularProgress
                            className={classes.circularProgress}
                            size={18}
                        />
                        &nbsp;&nbsp;Realtime stream{" "}
                    </Text>
                )}

                {currentPage === 1 && (
                    <Text typo="body 1" className={classes.pageAnnotation}>
                        This is not necessarily the first logs, older logs might have been
                        flushed&nbsp;
                    </Text>
                )}

                {paginatedLogs[currentPage - 1]}
            </pre>
        </div>
    );
}

const useStyles = tss.withName({ PodLogsTab }).create(({ theme }) => ({
    "pagination": {
        ...theme.spacing.topBottom("margin", 4)
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
    "circularProgress": {
        "position": "relative",
        "top": 3
    },
    "pre": {
        "padding": theme.spacing(5),
        "backgroundColor": theme.colors.useCases.surfaces.background,
        "borderRadius": theme.spacing(2),
        "position": "relative"
    }
}));
