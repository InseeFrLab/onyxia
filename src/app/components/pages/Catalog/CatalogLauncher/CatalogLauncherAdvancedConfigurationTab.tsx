/* eslint-disable array-callback-return */

import { memo } from "react";
import { TextField } from "app/components/designSystem/TextField";
import { useCallbackFactory } from "powerhooks";
import { createUseClassNames } from "app/theme/useClassNames";
import { cx } from "tss-react";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import FormHelperText from "@material-ui/core/FormHelperText";

export type Props = {
    className?: string;
    formFields: {
        label: string;
        description?: string;
        value: string | boolean;
        isReadonly: boolean;
        /** May only be defined when typeof value is string */
        enum?: string[];
    }[];
    onFormValueChange(
        params: {
            label: string;
            value: string | boolean;
        }
    ): void;
};

const { useClassNames } = createUseClassNames()(
    () => ({
        "root": {
        }
    })
);

export const CatalogLauncherAdvancedConfigurationTab = memo((props: Props) => {

    const { className, formFields, onFormValueChange } = props;

    const onValueBeingTypedChangeFactory = useCallbackFactory(
        (
            [label]: [string],
            [{ value }]: [{ value: string | boolean; }]
        ) =>
            onFormValueChange({ label, value })
    );

    const onCheckboxChangeFactory = useCallbackFactory(
        ([label]: [string]) =>
            onFormValueChange({
                label,
                "value": !formFields
                    .find(formField => formField.label === label)!
                    .value
            })
    );

    const onSelectChangeFactory = useCallbackFactory(
        (
            [label]: [string],
            [event]: [React.ChangeEvent<{ value: unknown; }>]
        ) =>
            onFormValueChange({
                label,
                "value": event.target.value as string
            })
    );

    const { classNames } = useClassNames({});


    return (
        <div className={cx(classNames.root, className)}>
            { formFields.map(formField =>
                <div key={formField.label}>{(() => {
                    switch (typeof formField.value) {
                        case "string":
                            const labelId = `label-${formField.label}`;
                            return formField.enum !== undefined ?
                                <FormControl>
                                    <InputLabel id={labelId}>Age</InputLabel>
                                    <Select
                                        labelId={labelId}
                                        value={formField.value}
                                        onChange={onSelectChangeFactory(formField.label)}
                                    >
                                        {formField.enum.map(value =>
                                            <MenuItem
                                                key={value}
                                                value={value}
                                            >
                                                {value}
                                            </MenuItem>
                                        )}
                                    </Select>
                                    <FormHelperText>Some important helper text</FormHelperText>
                                </FormControl>
                                :
                                <TextField
                                    autoComplete="off"
                                    disabled={formField.isReadonly}
                                    helperText={formField.description}
                                    inputProps_spellCheck={false}
                                    label={formField.label}
                                    defaultValue={formField.value}
                                    onValueBeingTypedChange={onValueBeingTypedChangeFactory(formField.label)}
                                />;
                        case "boolean":
                            return (
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={formField.value}
                                            onChange={onCheckboxChangeFactory(formField.label)}
                                        />
                                    }
                                    label={formField.label}
                                />
                            );
                    }
                })()}
                </div>
            )}

        </div>
    );


});