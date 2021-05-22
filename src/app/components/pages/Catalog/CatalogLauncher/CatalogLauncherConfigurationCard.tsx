
/* eslint-disable array-callback-return */

import { TextField } from "app/components/designSystem/TextField";
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

import { createUseClassNames } from "app/theme/useClassNames";
import { IconButton } from "app/components/designSystem/IconButton";
import { Typography } from "app/components/designSystem/Typography";
import { cx } from "tss-react";
import { useConstCallback } from "powerhooks";
import type { FormField } from "lib/useCases/launcher";
import { useCallbackFactory } from "powerhooks";
import { capitalize } from "app/tools/capitalize";

export type Props = {
    className?: string;
    dependencyNamePackageNameOrGlobal: string;
    formFieldsByTab: { [tabName: string]: FormField[]; };
    onFormValueChange(
        params: {
            path: string[];
            value: string | boolean;
        }
    ): void;
};

const { useClassNames } = createUseClassNames()(
    () => ({
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
            .map(title => ({ "id": title, title })),
        [formFieldsByTab]
    );

    const onIsCollapsedValueChange = useConstCallback(
        () => setIsCollapsed(!isCollapsed)
    );

    const [activeTabId, setActiveTabId] = useState<string | undefined>(tabs[0]?.id);

    return (
        <div className={className}>
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
                "backgroundColor": theme.custom.colors.useCases.surfaces.surfaces,
                "cursor": "pointer"
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
        onFormValueChange(
            params: {
                path: string[];
                value: string | boolean;
            }
        ): void;
    };

    const { useClassNames } = createUseClassNames()(
        theme => ({
            "root": {
                "display": "grid",
                "gridTemplateColumns": "repeat(2, 1fr)",
                "gap": theme.spacing(8)
            },
            "textField": {
                //Hacky... to accommodate the helper text
                "marginBottom": 32
            }
        })
    );

    const TabContent = memo((props: Props) => {

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
                    <div key={formField.path.join("-")} >{(() => {
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
                                        className={classNames.textField}
                                        autoComplete="off"
                                        selectAllTextOnFocus={true}
                                        disabled={formField.isReadonly}
                                        helperText={formField.description}
                                        inputProps_spellCheck={false}
                                        label={formField.title}
                                        defaultValue={formField.value}
                                        onValueBeingTypedChange={onValueBeingTypedChangeFactory(formField.path)}
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
                                            label={formField.title}
                                        />
                                        <FormHelperText>{formField.description}</FormHelperText>
                                    </FormControl>
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
