import { useId } from "react";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import { tss } from "tss";
import { declareComponentKeys } from "i18nifty";
import { useTranslation } from "ui/i18n";
import { formatDuration } from "ui/shared/formattedDate";

type Props = {
    className?: string;
    validityDurationSecondOptions: number[];
    validityDurationSecond: number;
    onChangeShareSelectedValidityDuration: (props: {
        validityDurationSecond: number;
    }) => void;
};

export function SelectTime(props: Props) {
    const {
        className,
        validityDurationSecondOptions,
        onChangeShareSelectedValidityDuration,
        validityDurationSecond
    } = props;

    const labelId = useId();
    const { classes, cx } = useStyles();

    const { t } = useTranslation({ SelectTime });
    return (
        <FormControl
            variant="standard"
            className={cx(classes.timeSelectWrapper, className)}
        >
            <InputLabel id={labelId}>{t("validity duration label")}</InputLabel>
            <Select
                labelId={labelId}
                value={`${validityDurationSecond}`}
                onChange={event => {
                    const valueStr = event.target.value;

                    onChangeShareSelectedValidityDuration({
                        validityDurationSecond: parseFloat(valueStr)
                    });
                }}
            >
                {validityDurationSecondOptions.map(validityDurationSecond => (
                    <MenuItem
                        key={validityDurationSecond}
                        value={`${validityDurationSecond}`}
                    >
                        {formatDuration({ durationSeconds: validityDurationSecond })}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
}
const useStyles = tss.withName({ MyFilesShareSelectTime: SelectTime }).create(() => ({
    timeSelectWrapper: {
        minWidth: 200
    }
}));

const { i18n } = declareComponentKeys<"validity duration label">()({
    SelectTime
});
export type I18n = typeof i18n;
