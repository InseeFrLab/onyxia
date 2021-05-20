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
import { same } from "evt/tools/inDepth/same";
import type { FormField } from "lib/useCases/launcher";

export type Props = {
    className?: string;
    formFields: FormField[];
    onFormValueChange(
        params: {
            path: string[];
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
            [path]: [string[]],
            [{ value }]: [{ value: string | boolean; }]
        ) =>
            onFormValueChange({ path, value })
    );

    const onCheckboxChangeFactory = useCallbackFactory(
        ([path]: [string[]]) =>
            onFormValueChange({
                path,
                "value": !formFields
                    .find(formField => same(formField.path, path))!
                    .value
            })
    );

    const onSelectChangeFactory = useCallbackFactory(
        (
            [path]: [string[]],
            [event]: [React.ChangeEvent<{ value: unknown; }>]
        ) =>
            onFormValueChange({
                path,
                "value": event.target.value as string
            })
    );

    const { classNames } = useClassNames({});


    return (
        <div className={cx(classNames.root, className)}>
            { formFields.map(formField =>
                <div key={formField.path.join("-")}>{(() => {
                    switch (typeof formField.value) {
                        case "string":
                            const labelId = `label_${formField.path.join("-")}`;
                            return formField.enum !== undefined ?
                                <FormControl>
                                    <InputLabel id={labelId}>Age</InputLabel>
                                    <Select
                                        labelId={labelId}
                                        value={formField.value}
                                        onChange={onSelectChangeFactory(formField.path)}
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
                                    label={formField.title}
                                    defaultValue={formField.value}
                                    onValueBeingTypedChange={onValueBeingTypedChangeFactory(formField.path)}
                                />;
                        case "boolean":
                            return (
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={formField.value}
                                            onChange={onCheckboxChangeFactory(formField.path)}
                                        />
                                    }
                                    label={formField.title}
                                />
                            );
                    }
                })()}
                </div>
            )}

        </div>
    );


});