
import type { Optional } from "evt/tools/typeSafety";
import { noUndefined } from "app/utils/noUndefined";
import { Typography } from "app/components/designSystem/Typography";
import { FileOrDirectoryIcon } from "./FileOrDirectoryIcon";
import { useSemanticGuaranteeMemo } from "evt/tools/hooks/useSemanticGuaranteeMemo";
import { withProps } from "app/utils/withProps";
import { makeStyles, createStyles } from "@material-ui/core/styles";
import { IconButton } from "app/components/designSystem/IconButton"
import { useFormattedDate } from "app/i18n/useFormattedDate";

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
    theme => createStyles({
        "root": {
            "display": "flex",
            "alignItems": "center",
            "gap": `0 ${theme.spacing(2)}px`,
            "borderBottom": `1px solid ${theme.custom.colors.palette.midnightBlue.light2}`,
            "padding": theme.spacing(3, 0)
        },
        "basename": {
            "marginBottom": theme.spacing(1)
        },
        "date": {
            "color": theme.custom.colors.useCases.typography.textSecondary,
            "textTransform": "capitalize"
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

    const isSameYear = date.getFullYear() === new Date().getFullYear();

    const formattedDate = useFormattedDate({
        date,
        "formatByLng": {
            /* spell-checker: disable */
            "fr": `dddd Do MMMM${isSameYear?"":" YYYY"} à H[h]mm`,
            "en": `dddd, MMMM Do${isSameYear?"":" YYYY"}, h:mm a`
            /* spell-checker: enable */
        }
    });

    return (
        <div className={classes.root}>
            <div>
                <IconButton
                    fontSize="large"
                    type="chevronLeft"
                    onClick={onBack}
                />
            </div>
            <div>
                <Icon />
            </div>
            <div>
                <Typography
                    variant="h5"
                    className={classes.basename}
                >
                    {fileBasename}
                </Typography>
                {
                    date.getTime() === 0 ? null :
                        <Typography
                            variant="caption"
                            className={classes.date}
                        >
                            {formattedDate}
                        </Typography>
                }
            </div>
        </div>

    );

}