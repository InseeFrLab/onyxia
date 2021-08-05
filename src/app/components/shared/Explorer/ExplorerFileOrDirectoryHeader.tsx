import { makeStyles } from "app/theme";
import { memo } from "react";
import type { PickOptionals } from "tsafe";
import { noUndefined } from "app/tools/noUndefined";
import { FileOrDirectoryIcon } from "./FileOrDirectoryIcon";
import { IconButton, Text } from "app/theme";
import { useFormattedDate } from "app/i18n/useMoment";
import { useWithProps } from "powerhooks/useWithProps";

export type Props = {
    /** [HIGHER ORDER] What visual asset should be used to represent a file */
    visualRepresentationOfAFile: "secret" | "file";

    /** Tell if we are displaying an directory or a secret */
    kind: "file" | "directory";

    fileBasename: string;
    date?: Date;
    onBack(): void;
};

export const defaultProps: PickOptionals<Props> = {
    "date": new Date(0),
};

const useStyles = makeStyles<{ isDateProvided: boolean }>()(
    (theme, { isDateProvided }) => ({
        "root": {
            "display": "flex",
            "alignItems": "center",
            "gap": `0 ${theme.spacing(3)}px`,
            "borderBottom": `1px solid ${theme.colors.useCases.typography.textTertiary}`,
            "padding": theme.spacing(4, 0),
        },
        "basename": {
            "marginBottom": isDateProvided ? theme.spacing(2) : undefined,
        },
        "date": {
            "color": theme.colors.useCases.typography.textSecondary,
            "textTransform": "capitalize",
        },
    }),
);

export const ExplorerFileOrDirectoryHeader = memo((props: Props) => {
    const completedProps = { ...defaultProps, ...noUndefined(props) };

    const { visualRepresentationOfAFile, kind, fileBasename, date, onBack } =
        completedProps;

    const Icon = useWithProps(FileOrDirectoryIcon, {
        visualRepresentationOfAFile,
    });

    const formattedDate = useFormattedDate({ date });

    const isDateProvided = date.getTime() !== 0;

    const { classes } = useStyles({ isDateProvided });

    return (
        <div className={classes.root}>
            <div>
                <IconButton size="large" iconId="chevronLeft" onClick={onBack} />
            </div>
            <div>
                <Icon kind={kind} standardizedWidth="big" />
            </div>
            <div>
                <Text typo="object heading" className={classes.basename}>
                    {fileBasename}
                </Text>
                {!isDateProvided ? null : (
                    <Text typo="caption" className={classes.date}>
                        {formattedDate}
                    </Text>
                )}
            </div>
        </div>
    );
});
