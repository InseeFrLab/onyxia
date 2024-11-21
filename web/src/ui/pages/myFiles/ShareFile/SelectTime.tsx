import { useId } from "react";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import { tss } from "tss";
import { assert } from "tsafe/assert";

type Props = {
    className?: string;
    validityDurationSecondOptions: number[];
    expirationValue: number;
    onExpirationValueChange: (
        value: Props["validityDurationSecondOptions"][number]
    ) => void;
};

export function SelectTime(props: Props) {
    const {
        className,
        validityDurationSecondOptions,
        expirationValue,
        onExpirationValueChange
    } = props;

    const labelId = useId();
    const { classes, cx } = useStyles();

    const handleChange = (event: SelectChangeEvent<number>) => {
        const newValue = event.target.value;

        assert(
            typeof newValue === "number" &&
                validityDurationSecondOptions.includes(newValue)
        );
        onExpirationValueChange(newValue);
    };

    return (
        <FormControl
            variant="standard"
            className={cx(classes.timeSelectWrapper, className)}
        >
            <InputLabel id={labelId}>Durée de validité</InputLabel>
            <Select<number>
                labelId={labelId}
                value={expirationValue}
                onChange={handleChange}
                label="Project"
            >
                {validityDurationSecondOptions.map(validityDurationSecond => (
                    <MenuItem key={validityDurationSecond} value={validityDurationSecond}>
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
