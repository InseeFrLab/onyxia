

import { createUseClassNames } from "app/theme/useClassNames";
import { memo } from "react";
import type { Optional } from "evt/tools/typeSafety";
import { noUndefined } from "app/tools/noUndefined";
import { Typography } from "app/components/designSystem/Typography";
import { FileOrDirectoryIcon } from "./FileOrDirectoryIcon";
import { IconButton } from "app/components/designSystem/IconButton"
import { useFormattedDate } from "app/i18n/useMoment";
import { useWithProps } from "powerhooks";

export type Props = {
    /** [HIGHER ORDER] What visual asset should be used to represent a file */
    visualRepresentationOfAFile: "secret" | "file";

    /** Tell if we are displaying an directory or a secret */
    kind: "file" | "directory";

    fileBasename: string;
    date?: Date;
    onBack(): void;

};

export const defaultProps: Optional<Props> = {
    "date": new Date(0)
};

const { useClassNames } = createUseClassNames<{ isDateProvided: boolean; }>()(
    (theme, { isDateProvided }) => ({
        "root": {
            "display": "flex",
            "alignItems": "center",
            "gap": `0 ${theme.spacing(2)}px`,
            "borderBottom": `1px solid ${theme.custom.colors.useCases.typography.textTertiary}`,
            "padding": theme.spacing(3, 0)
        },
        "basename": {
            "marginBottom": isDateProvided ? theme.spacing(1) : undefined
        },
        "date": {
            "color": theme.custom.colors.useCases.typography.textSecondary,
            "textTransform": "capitalize"
        }
    })
);

export const ExplorerFileOrDirectoryHeader = memo((props: Props) => {

    const completedProps = { ...defaultProps, ...noUndefined(props) };

    const { visualRepresentationOfAFile, kind, fileBasename, date, onBack } = completedProps;

    const Icon = useWithProps(
        FileOrDirectoryIcon,
        { visualRepresentationOfAFile }
    );

    const isSameYear = date.getFullYear() === new Date().getFullYear();

    const formattedDate = useFormattedDate({
        date,
        "formatByLng": {
            /* spell-checker: disable */
            "fr": `dddd Do MMMM${isSameYear ? "" : " YYYY"} à H[h]mm`,
            "en": `dddd, MMMM Do${isSameYear ? "" : " YYYY"}, h:mm a`
            /* spell-checker: enable */
        }
    });

    const isDateProvided = date.getTime() !== 0;

    const { classNames } = useClassNames({ isDateProvided });

    return (
        <div className={classNames.root}>
            <div>
                <IconButton
                    fontSize="large"
                    type="chevronLeft"
                    onClick={onBack}
                />
            </div>
            <div>
                <Icon
                    kind={kind}
                    standardizedWidth="big"
                />
            </div>
            <div>
                <Typography
                    variant="h5"
                    className={classNames.basename}
                >
                    {fileBasename}
                </Typography>
                {
                    !isDateProvided ? null :
                        <Typography
                            variant="caption"
                            className={classNames.date}
                        >
                            {formattedDate}
                        </Typography>
                }
            </div>
        </div>
    );

});