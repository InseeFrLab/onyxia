
import type { Optional } from "evt/tools/typeSafety";
import { noUndefined } from "app/utils/noUndefined";
import { Button } from "app/components/designSystem/Button";
import { Typography } from "app/components/designSystem/Typography";
import { FileOrDirectoryIcon } from "./FileOrDirectoryIcon";
import { useSemanticGuaranteeMemo } from "evt/tools/hooks/useSemanticGuaranteeMemo";
import { withProps } from "app/utils/withProps";
import Box from "@material-ui/core/Box";
import { makeStyles, createStyles } from "@material-ui/core/styles";

export type Props = {
    /** [HIGHER ORDER] What visual asset should be used to represent a file */
    visualRepresentationOfAFile: "secret" | "file";

    fileBasename: string;
    date?: Date;
    onBack(): void;

};

export const defaultProps: Optional<Props> = {
    "date": new Date(0)
};

const useStyles = makeStyles(
    () => createStyles({
        "root": {
            "& > *": {
                "display": "inline-block"
            }
        }
    })
);



export function ExplorerFileHeader(props: Props) {

    const completedProps = { ...defaultProps, ...noUndefined(props) };

    const { visualRepresentationOfAFile, fileBasename, date, onBack } = completedProps;

    const classes = useStyles();

    const Icon = useSemanticGuaranteeMemo(
        () => withProps(
            FileOrDirectoryIcon,
            {
                visualRepresentationOfAFile,
                "standardizedWidth": "big",
                "kind": "file"
            }
        ),
        [visualRepresentationOfAFile]
    );

    return (
        <Box className={classes.root}>
            <Button onClick={onBack}>Back</Button>
            <Icon />
            <Box>
                <Typography variant="h5">{fileBasename}</Typography>
                {
                    date.getTime() === 0 ? null :
                        <Typography variant="caption">{date.toISOString()}</Typography>
                }
            </Box>
        </Box>

    );

}