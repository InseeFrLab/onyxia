/* eslint-disable array-callback-return */

import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import type { SelectChangeEvent } from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormHelperText from "@mui/material/FormHelperText";
import { same } from "evt/tools/inDepth/same";
import { useState, useMemo, memo } from "react";
import { Tabs } from "onyxia-ui/Tabs";
import MuiTextField from "@mui/material/TextField";
import { makeStyles, IconButton, Text } from "ui/theme";
import { useConstCallback } from "powerhooks/useConstCallback";
import type { FormField, IndexedFormFields } from "core/usecases/launcher";
import type { FormFieldValue } from "core/usecases/sharedDataModel/FormFieldValue";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { capitalize } from "tsafe/capitalize";
import { Icon } from "ui/theme";
import { useTranslation } from "ui/i18n/useTranslations";
import { Slider } from "onyxia-ui/Slider";
import { RangeSlider } from "onyxia-ui/RangeSlider";
import type { RangeSliderProps } from "onyxia-ui/RangeSlider";
import type { Param0, ReturnType } from "tsafe";
import { TextField } from "onyxia-ui/TextField";
import type { TextFieldProps } from "onyxia-ui/TextField";
import * as yaml from "yaml";
import { assert } from "tsafe/assert";

export type Props = {
    className?: string;
    dependencyNamePackageNameOrGlobal: string;
    meta: IndexedFormFields[string]["meta"];
    formFieldsByTabName: IndexedFormFields[string]["formFieldsByTabName"];
    onFormValueChange(params: FormFieldValue): void;
};

export const CatalogLauncherConfigurationCard = memo((props: Props) => {
    const {
        className,
        dependencyNamePackageNameOrGlobal,
        meta,
        formFieldsByTabName,
        onFormValueChange,
    } = props;

    const { classes, cx } = useStyles();

    const [isCollapsed, setIsCollapsed] = useState(true);

    const tabs = useMemo(
        () =>
            Object.keys(formFieldsByTabName).map(title => ({
                "id": title,
                "title": capitalize(title),
            })),
        [formFieldsByTabName],
    );

    const onIsCollapsedValueChange = useConstCallback(() => setIsCollapsed(!isCollapsed));

    const [activeTabId, setActiveTabId] = useState<string | undefined>(tabs[0]?.id);

    return (
        <div className={cx(classes.root, className)}>
            <Header
                packageName={dependencyNamePackageNameOrGlobal}
                isCollapsed={isCollapsed}
                onIsCollapsedValueChange={
                    tabs.length === 0 ? undefined : onIsCollapsedValueChange
                }
                {...(() => {
                    switch (meta.type) {
                        case "dependency":
                            return {
                                "type": "dependency",
                                "dependencyName": dependencyNamePackageNameOrGlobal,
                            } as const;
                        case "global":
                            return {
                                "type": "global",
                                "description": meta.description,
                            } as const;
                        case "package":
                            return {
                                "type": "package",
                                "packageName": dependencyNamePackageNameOrGlobal,
                            } as const;
                    }
                })()}
            />
            {activeTabId !== undefined && (
                <Tabs
                    className={classes[isCollapsed ? "collapsedPanel" : "expandedPanel"]}
                    tabs={tabs}
                    activeTabId={activeTabId}
                    onRequestChangeActiveTab={setActiveTabId}
                    size="small"
                    maxTabCount={5}
                >
                    <TabContent
                        {...formFieldsByTabName[activeTabId]}
                        onFormValueChange={onFormValueChange}
                    />
                </Tabs>
            )}
        </div>
    );
});

export declare namespace CatalogLauncherConfigurationCard {
    export type I18nScheme = {
        "global config": undefined;
        "configuration": { packageName: string };
        "dependency": { dependencyName: string };
        "launch of a service": { dependencyName: string };
        "malformed input": undefined;
    };
}

const { Header } = (() => {
    type Props = {
        className?: string;
        isCollapsed: boolean;
        onIsCollapsedValueChange?(): void;
    } & (
        | {
              type: "dependency";
              dependencyName: string;
          }
        | {
              type: "package";
              packageName: string;
          }
        | {
              type: "global";
              description?: string;
          }
    );

    const useStyles = makeStyles<{
        isCollapsed: boolean;
        isExpandIconVisible: boolean;
    }>()((theme, { isCollapsed, isExpandIconVisible }) => ({
        "root": {
            "display": "flex",
            ...theme.spacing.rightLeft("padding", 4),
            "backgroundColor": theme.colors.useCases.surfaces.surface1,
            "cursor": "pointer",
            "borderBottom": isCollapsed
                ? undefined
                : `1px solid ${theme.colors.useCases.typography.textTertiary}`,
        },
        "expandIcon": {
            "& svg": {
                "transition": theme.muiTheme.transitions.create(["transform"], {
                    "duration": theme.muiTheme.transitions.duration.short,
                }),
                "transform": `rotate(${isCollapsed ? 0 : "-180deg"})`,
                "visibility": isExpandIconVisible ? undefined : "hidden",
            },
        },
        "title": {
            "display": "flex",
            "alignItems": "center",
        },
        "titleWrapper": {
            "display": "flex",
            "flexDirection": "column",
            "justifyContent": "center",
            ...theme.spacing.topBottom("margin", 3),
        },
        "subtitle": {
            "marginTop": theme.spacing(2),
        },
    }));

    const Header = memo((props: Props) => {
        const { className, isCollapsed, onIsCollapsedValueChange } = props;

        const { classes, cx } = useStyles({
            isCollapsed,
            "isExpandIconVisible": onIsCollapsedValueChange !== undefined,
        });

        const onClick = useConstCallback(() => onIsCollapsedValueChange?.());

        const { t } = useTranslation({ CatalogLauncherConfigurationCard });

        return (
            <div className={cx(classes.root, className)} onClick={onClick}>
                <div className={classes.titleWrapper}>
                    <Text typo="object heading" className={classes.title}>
                        {(() => {
                            switch (props.type) {
                                case "dependency":
                                    return (
                                        <>
                                            <Icon iconId="subdirectoryArrowRight" />
                                            &nbsp;
                                            {t("dependency", {
                                                "dependencyName": capitalize(
                                                    props.dependencyName,
                                                ),
                                            })}
                                        </>
                                    );
                                case "global":
                                    return t("global config");
                                case "package":
                                    return t("configuration", {
                                        "packageName": capitalize(props.packageName),
                                    });
                            }
                        })()}
                    </Text>
                    {(() => {
                        switch (props.type) {
                            case "dependency":
                                return (
                                    <Text typo="body 2" className={classes.subtitle}>
                                        {t("launch of a service", {
                                            "dependencyName": capitalize(
                                                props.dependencyName,
                                            ),
                                        })}
                                    </Text>
                                );
                            case "global":
                                return props.description === undefined ? null : (
                                    <Text typo="body 2" className={classes.subtitle}>
                                        {capitalize(props.description)}
                                    </Text>
                                );
                            case "package":
                                return null;
                        }
                    })()}
                </div>
                <div style={{ "flex": 1 }} />
                <IconButton
                    iconId="expandMore"
                    onClick={onClick}
                    className={classes.expandIcon}
                />
            </div>
        );
    });

    return { Header };
})();

const { TabContent } = (() => {
    type Props = {
        description?: string;
        className?: string;
        formFields: Exclude<FormField, FormField.Slider.Range>[];
        assembledSliderRangeFormFields: IndexedFormFields.AssembledSliderRangeFormField[];
        onFormValueChange(params: FormFieldValue): void;
    };

    const useStyles = makeStyles()(theme => ({
        "root": {
            "display": "grid",
            "gridTemplateColumns": "repeat(3, 1fr)",
            "gap": theme.spacing(5),
        },
        "textField": {
            //Hacky... to accommodate the helper text
            //"marginBottom": 32,
            "width": "100%",
        },
        "tabDescription": {
            "marginTop": theme.spacing(2),
            "marginBottom": theme.spacing(5),
        },
    }));

    const TabContent = memo((props: Props) => {
        const {
            className,
            formFields,
            onFormValueChange,
            description,
            assembledSliderRangeFormFields,
        } = props;

        const onValueBeingChangeFactory = useCallbackFactory(
            (
                [path]: [string[]],
                [{ value }]: [Param0<TextFieldProps["onValueBeingTypedChange"]>],
            ) => onFormValueChange({ path, value }),
        );

        const { t } = useTranslation({ CatalogLauncherConfigurationCard });

        const getIsValidValueFactory = useCallbackFactory(
            (
                [pattern]: [string],
                [value]: [string],
            ): ReturnType<TextFieldProps["getIsValidValue"]> =>
                new RegExp(pattern).test(value)
                    ? { "isValidValue": true }
                    : {
                          "isValidValue": false,
                          "message": `${t("malformed input")} ${pattern}`,
                      },
        );

        const onEscapeKeyDownFactory = useCallbackFactory(
            ([path, defaultValue]: [string[], string]) =>
                onFormValueChange({ path, "value": defaultValue }),
        );

        const onCheckboxChangeFactory = useCallbackFactory(([path]: [string[]]) =>
            onFormValueChange({
                path,
                "value": !formFields.find(formField => same(formField.path, path))!.value,
            }),
        );

        const onSelectChangeFactory = useCallbackFactory(
            ([path]: [string[]], [event]: [SelectChangeEvent<string>]) =>
                onFormValueChange({
                    path,
                    "value": event.target.value,
                }),
        );

        const onNumberTextFieldChangeFactory = useCallbackFactory(
            (
                [path]: [string[]],
                [{ target }]: [React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>],
            ) =>
                onFormValueChange({
                    path,
                    "value": parseFloat(target.value),
                }),
        );

        const onSimpleSliderValueChange = useCallbackFactory(
            ([path, unit]: [string[], string], [value]: [number]) =>
                onFormValueChange({
                    path,
                    "value": `${value}${unit}`,
                }),
        );

        const onRangeSliderValueChange = useCallbackFactory(
            (
                [pathDown, pathUp, unit]: [string[], string[], string],
                [params]: [Param0<RangeSliderProps["onValueChange"]>],
            ) =>
                onFormValueChange({
                    "path": (() => {
                        switch (params.extremity) {
                            case "low":
                                return pathDown;
                            case "high":
                                return pathUp;
                        }
                    })(),
                    "value": `${params.value}${unit}`,
                }),
        );

        const { classes, cx, css } = useStyles();

        return (
            <>
                {description !== undefined && (
                    <Text typo="label 1" className={classes.tabDescription}>
                        {capitalize(description)}
                    </Text>
                )}
                <div className={cx(classes.root, className)}>
                    {[
                        ...formFields.map((formField, i) => (
                            <div
                                key={i}
                                className={css(
                                    formField.type === "text" &&
                                        formField.doRenderAsTextArea && {
                                            "gridColumn": "span 3",
                                        },
                                )}
                            >
                                {(() => {
                                    const label = capitalize(formField.title);
                                    const helperText =
                                        formField.description === undefined
                                            ? undefined
                                            : capitalize(formField.description);

                                    switch (formField.type) {
                                        case "object":
                                            return (
                                                <TextField
                                                    doRenderAsTextArea={true}
                                                    className={classes.textField}
                                                    label={label}
                                                    defaultValue={yaml.stringify(
                                                        formField.value,
                                                    )}
                                                    helperText={helperText}
                                                    disabled={formField.isReadonly}
                                                    onValueBeingTypedChange={({
                                                        isValidValue,
                                                        value,
                                                    }) => {
                                                        if (!isValidValue) {
                                                            return;
                                                        }

                                                        onFormValueChange({
                                                            "path": formField.path,
                                                            "value": yaml.parse(value),
                                                        });
                                                    }}
                                                    inputProps_spellCheck={false}
                                                    autoComplete="off"
                                                    selectAllTextOnFocus={true}
                                                    getIsValidValue={str => {
                                                        try {
                                                            const obj = yaml.parse(str);

                                                            assert(
                                                                typeof obj === "object" &&
                                                                    obj !== null,
                                                            );
                                                        } catch {
                                                            return {
                                                                "isValidValue": false,
                                                                "message":
                                                                    "Not a valid YAML string",
                                                            };
                                                        }

                                                        return {
                                                            "isValidValue": true,
                                                        };
                                                    }}
                                                    onEscapeKeyDown={onEscapeKeyDownFactory(
                                                        formField.path,
                                                        yaml.stringify(
                                                            formField.defaultValue,
                                                        ),
                                                    )}
                                                    doOnlyValidateInputAfterFistFocusLost={
                                                        false
                                                    }
                                                />
                                            );

                                        case "boolean":
                                            return (
                                                <FormControl>
                                                    <FormControlLabel
                                                        control={
                                                            <Checkbox
                                                                color="primary"
                                                                checked={formField.value}
                                                                onChange={onCheckboxChangeFactory(
                                                                    formField.path,
                                                                )}
                                                            />
                                                        }
                                                        label={label}
                                                    />
                                                    <FormHelperText>
                                                        {helperText}
                                                    </FormHelperText>
                                                </FormControl>
                                            );
                                        case "enum": {
                                            const labelId = `select_label_${i}`;

                                            return (
                                                <FormControl variant="standard">
                                                    <InputLabel id={labelId}>
                                                        {label}
                                                    </InputLabel>
                                                    <Select
                                                        labelId={labelId}
                                                        value={formField.value}
                                                        onChange={onSelectChangeFactory(
                                                            formField.path,
                                                        )}
                                                    >
                                                        {formField.enum.map(value => (
                                                            <MenuItem
                                                                key={value}
                                                                value={value}
                                                            >
                                                                {value}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                    <FormHelperText>
                                                        {helperText}
                                                    </FormHelperText>
                                                </FormControl>
                                            );
                                        }
                                        case "text":
                                            return (
                                                <TextField
                                                    doRenderAsTextArea={
                                                        formField.doRenderAsTextArea
                                                    }
                                                    className={classes.textField}
                                                    label={label}
                                                    defaultValue={formField.value}
                                                    helperText={helperText}
                                                    disabled={formField.isReadonly}
                                                    onValueBeingTypedChange={onValueBeingChangeFactory(
                                                        formField.path,
                                                    )}
                                                    inputProps_spellCheck={false}
                                                    autoComplete="off"
                                                    selectAllTextOnFocus={true}
                                                    getIsValidValue={
                                                        formField.pattern === undefined
                                                            ? undefined
                                                            : getIsValidValueFactory(
                                                                  formField.pattern,
                                                              )
                                                    }
                                                    onEscapeKeyDown={onEscapeKeyDownFactory(
                                                        formField.path,
                                                        formField.defaultValue,
                                                    )}
                                                    doOnlyValidateInputAfterFistFocusLost={
                                                        false
                                                    }
                                                />
                                            );
                                        case "integer":
                                            return (
                                                <MuiTextField
                                                    value={formField.value}
                                                    onChange={onNumberTextFieldChangeFactory(
                                                        formField.path,
                                                    )}
                                                    inputProps={{
                                                        "min": formField.minimum,
                                                    }}
                                                    label={label}
                                                    type="number"
                                                    InputLabelProps={{
                                                        "shrink": true,
                                                    }}
                                                    helperText={helperText}
                                                />
                                            );
                                        case "slider":
                                            return (
                                                <Slider
                                                    label={capitalize(formField.title)}
                                                    max={formField.sliderMax}
                                                    min={formField.sliderMin}
                                                    step={formField.sliderStep}
                                                    unit={formField.sliderUnit}
                                                    value={Number.parseFloat(
                                                        formField.value.split(
                                                            formField.sliderUnit,
                                                        )[0],
                                                    )}
                                                    onValueChange={onSimpleSliderValueChange(
                                                        formField.path,
                                                        formField.sliderUnit,
                                                    )}
                                                    extraInfo={formField.description}
                                                />
                                            );
                                    }
                                })()}
                            </div>
                        )),
                        ...assembledSliderRangeFormFields.map(
                            assembledSliderRangeFormField => (
                                <RangeSlider
                                    key={assembledSliderRangeFormField.title}
                                    label={capitalize(
                                        assembledSliderRangeFormField.title,
                                    )}
                                    max={assembledSliderRangeFormField.sliderMax}
                                    min={assembledSliderRangeFormField.sliderMin}
                                    step={assembledSliderRangeFormField.sliderStep}
                                    unit={assembledSliderRangeFormField.sliderUnit}
                                    valueHigh={Number.parseFloat(
                                        assembledSliderRangeFormField.extremities.up.value.split(
                                            assembledSliderRangeFormField.sliderUnit,
                                        )[0],
                                    )}
                                    valueLow={Number.parseFloat(
                                        assembledSliderRangeFormField.extremities.down.value.split(
                                            assembledSliderRangeFormField.sliderUnit,
                                        )[0],
                                    )}
                                    highExtremitySemantic={
                                        assembledSliderRangeFormField.extremities.up
                                            .semantic
                                    }
                                    lowExtremitySemantic={
                                        assembledSliderRangeFormField.extremities.down
                                            .semantic
                                    }
                                    onValueChange={onRangeSliderValueChange(
                                        assembledSliderRangeFormField.extremities.down
                                            .path,
                                        assembledSliderRangeFormField.extremities.up.path,
                                        assembledSliderRangeFormField.sliderUnit,
                                    )}
                                />
                            ),
                        ),
                    ]}
                </div>
            </>
        );
    });

    return { TabContent };
})();

const useStyles = makeStyles({ "name": { CatalogLauncherConfigurationCard } })(theme => ({
    "root": {
        "borderRadius": 8,
        "overflow": "hidden",
        "boxShadow": theme.shadows[1],
    },
    // eslint-disable-next-line tss-unused-classes/unused-classes
    "collapsedPanel": {
        "maxHeight": 0,
        "transform": "scaleY(0)",
    },
    // eslint-disable-next-line tss-unused-classes/unused-classes
    "expandedPanel": {
        "transition": "transform 150ms cubic-bezier(0.4, 0, 0.2, 1)",
        "transform": "scaleY(1)",
        "transformOrigin": "top",
    },
}));
