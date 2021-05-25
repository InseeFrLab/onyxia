
/* eslint-disable array-callback-return */

import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import FormHelperText from "@material-ui/core/FormHelperText";
import { same } from "evt/tools/inDepth/same";
import { useState, useMemo, memo } from "react";
import { Tabs } from "app/components/shared/Tabs";
import MuiTextField from "@material-ui/core/TextField";
import { createUseClassNames } from "app/theme/useClassNames";
import { IconButton } from "app/components/designSystem/IconButton";
import { Typography } from "app/components/designSystem/Typography";
import { cx } from "tss-react";
import { useConstCallback } from "powerhooks";
import type { FormField } from "lib/useCases/launcher";
import type { FormFieldValue } from "lib/useCases/sharedDataModel/FormFieldValue";
import { useCallbackFactory } from "powerhooks";
import { capitalize } from "app/tools/capitalize";

export type Props = {
    className?: string;
    dependencyNamePackageNameOrGlobal: string;
    formFieldsByTab: { [tabName: string]: FormField[]; };
    onFormValueChange(params: FormFieldValue): void;
};

const { useClassNames } = createUseClassNames()(
    theme => ({
        "root": {
            "borderRadius": 8,
            "overflow": "hidden",
            "boxShadow": theme.custom.shadows[1]
        },
        "collapsedPanel": {
            "maxHeight": 0,
            "transform": "scaleY(0)"
        },
        "expandedPanel": {
            "transition": "transform 150ms cubic-bezier(0.4, 0, 0.2, 1)",
            "transform": "scaleY(1)",
            "transformOrigin": "top"
        }
    })
);

export const CatalogLauncherConfigurationCard = memo((props: Props) => {

    const {
        className,
        dependencyNamePackageNameOrGlobal,
        formFieldsByTab,
        onFormValueChange
    } = props;

    const { classNames } = useClassNames({});


    const [isCollapsed, setIsCollapsed] = useState(true);

    const tabs = useMemo(
        () => Object.keys(formFieldsByTab)
            .map(title => ({ "id": title, "title": capitalize(title) })),
        [formFieldsByTab]
    );

    const onIsCollapsedValueChange = useConstCallback(
        () => setIsCollapsed(!isCollapsed)
    );

    const [activeTabId, setActiveTabId] = useState<string | undefined>(tabs[0]?.id);

    return (
        <div className={cx(classNames.root, className)}>
            <Header
                text={dependencyNamePackageNameOrGlobal}
                isCollapsed={isCollapsed}
                onIsCollapsedValueChange={onIsCollapsedValueChange}
            />
            {activeTabId !== undefined &&
                <Tabs
                    className={classNames[isCollapsed ? "collapsedPanel" : "expandedPanel"]}
                    tabs={tabs}
                    activeTabId={activeTabId}
                    onRequestChangeActiveTab={setActiveTabId}
                    size="small"
                    maxTabCount={5}
                >
                    <TabContent
                        formFields={formFieldsByTab[activeTabId]}
                        onFormValueChange={onFormValueChange}
                    />
                </Tabs>
            }
        </div>
    );
});

const { Header } = (() => {

    type Props = {
        className?: string;
        text: string;
        isCollapsed: boolean;
        onIsCollapsedValueChange?(): void;
    };

    const { useClassNames } = createUseClassNames<{ isCollapsed: boolean; }>()(
        (theme, { isCollapsed }) => ({
            "root": {
                "display": "flex",
                "padding": theme.spacing(1, 3),
                "backgroundColor": theme.custom.colors.useCases.surfaces.surface1,
                "cursor": "pointer",
                "borderBottom": isCollapsed ?
                    undefined :
                    `1px solid ${theme.custom.colors.useCases.typography.textTertiary}`
            },
            "expandIcon": {
                "& svg": {
                    "transition": theme.transitions.create(
                        ["transform"],
                        { "duration": theme.transitions.duration.short }
                    ),
                    "transform": `rotate(${isCollapsed ? 0 : "-180deg"})`
                }
            },
            "title": {
                "display": "flex",
                "alignItems": "center"
            }
        })
    );

    const Header = memo(
        (props: Props) => {

            const { className, text, isCollapsed, onIsCollapsedValueChange } = props;

            const { classNames } = useClassNames({ isCollapsed });
            return (
                <div
                    className={cx(classNames.root, className)}
                    onClick={onIsCollapsedValueChange}
                >
                    <Typography
                        variant="h5"
                        className={classNames.title}
                    >
                        {capitalize(text)}
                    </Typography>
                    <div style={{ "flex": 1 }} />
                    {onIsCollapsedValueChange !== undefined &&
                        <IconButton
                            onClick={onIsCollapsedValueChange}
                            type="expandMore"
                            className={classNames.expandIcon}
                        />
                    }
                </div>
            );

        }
    );

    return { Header };


})();

const { TabContent } = (() => {

    type Props = {
        className?: string;
        formFields: FormField[];
        onFormValueChange(params: FormFieldValue): void;
    };

    const { useClassNames } = createUseClassNames()(
        theme => ({
            "root": {
                "display": "grid",
                "gridTemplateColumns": "repeat(3, 1fr)",
                "gap": theme.spacing(8)
            },
            "textField": {
                //Hacky... to accommodate the helper text
                //"marginBottom": 32,
                "width": "100%"
            }
        })
    );

    const TabContent = memo((props: Props) => {

        const { className, formFields, onFormValueChange } = props;

        const onTextFieldChangeFactory = useCallbackFactory(
            (
                [path]: [string[]],
                [{ target }]: [React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>]
            ) =>
                onFormValueChange({ path, "value": target.value })
        );

        const onTextFieldFocus = useConstCallback(
            ({ target }: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                target.setSelectionRange(0, target.value.length)
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

        const onNumberTextFieldChangeFactory = useCallbackFactory(
            (
                [path]: [string[]],
                [{ target }]: [React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>]
            ) =>
                onFormValueChange({
                    path,
                    "value": parseFloat(target.value)
                })
        );

        const { classNames } = useClassNames({});


        return (
            <div className={cx(classNames.root, className)}>
                { formFields.map((formField, i) =>
                    <div key={i} >
                        {(() => {

                            const label = capitalize(formField.title);
                            const helperText = formField.description === undefined ? 
                                undefined : capitalize(formField.description);

                            switch (typeof formField.value) {
                                case "string":
                                    return formField.enum !== undefined ?
                                        (() => {

                                            const labelId = `select_label_${i}`;

                                            return (
                                                <FormControl>
                                                    <InputLabel id={labelId}>{label}</InputLabel>
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
                                                    <FormHelperText>{helperText}</FormHelperText>
                                                </FormControl>
                                            );

                                        })()
                                        :
                                        <MuiTextField
                                            className={classNames.textField}
                                            label={label}
                                            value={formField.value}
                                            helperText={helperText}
                                            disabled={formField.isReadonly}
                                            onChange={onTextFieldChangeFactory(formField.path)}
                                            autoComplete="off"
                                            inputProps={{ "spellCheck": false }}
                                            onFocus={onTextFieldFocus}
                                        />;
                                case "boolean":
                                    return (
                                        <FormControl>
                                            <FormControlLabel
                                                control={
                                                    <Checkbox
                                                        color="primary"
                                                        checked={formField.value}
                                                        onChange={onCheckboxChangeFactory(formField.path)}
                                                    />
                                                }
                                                label={label}
                                            />
                                            <FormHelperText>{helperText}</FormHelperText>
                                        </FormControl>
                                    );
                                case "number":
                                    return (
                                        <MuiTextField
                                            value={formField.value}
                                            onChange={onNumberTextFieldChangeFactory(formField.path)}
                                            inputProps={{ "min": formField.minimum }}
                                            label={label}
                                            type="number"
                                            InputLabelProps={{ "shrink": true }}
                                            helperText={helperText}
                                        />
                                    );
                            }
                        })()}
                    </div>
                )}

            </div>
        );



    });

    return { TabContent };


})();
