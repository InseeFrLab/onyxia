import { useId } from "react";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import { tss } from "tss";

type Props = {
    className?: string;
};

const expirationOptions = [
    { id: "1 heure", name: "1 heure" },
    { id: "12 heures", name: "12 heures" },
    { id: "24 heures", name: "24 heures" },
    { id: "48 heures", name: "48 heures" },
    { id: "7 jours", name: "7 jours" }
];

export function SelectTime(props: Props) {
    const { className } = props;

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
                defaultValue={expirationOptions[0].id}
                label="Project"
            >
                {expirationOptions.map(({ id, name }) => (
                    <MenuItem key={id} value={id}>
                        {name}
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
