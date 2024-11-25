import { useId } from "react";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import { tss } from "tss";

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

    return (
        <FormControl
            variant="standard"
            className={cx(classes.timeSelectWrapper, className)}
        >
            <InputLabel id={labelId}>Durée de validité</InputLabel>
            <Select
                labelId={labelId}
                value={`${validityDurationSecond}`}
                onChange={event => {
                    const valueStr = event.target.value;

                    onChangeShareSelectedValidityDuration({
                        validityDurationSecond: parseFloat(valueStr)
                    });
                }}
                label="Project"
            >
                {validityDurationSecondOptions.map(validityDurationSecond => (
                    <MenuItem
                        key={validityDurationSecond}
                        value={`${validityDurationSecond}`}
                    >
                        {/*  TODO : better format and translation */}
                        {validityDurationSecond} secondes
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
