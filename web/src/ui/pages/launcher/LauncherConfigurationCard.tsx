/* eslint-disable array-callback-return */

import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import type { SelectChangeEvent } from "@mui/material/Select";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormHelperText from "@mui/material/FormHelperText";
import { same } from "evt/tools/inDepth/same";
import { memo, useMemo, useState } from "react";
import { Tabs } from "onyxia-ui/Tabs";
import MuiTextField from "@mui/material/TextField";
import { tss } from "tss";
import { Text } from "onyxia-ui/Text";
import { Icon } from "onyxia-ui/Icon";
import { useConstCallback } from "powerhooks/useConstCallback";
import { IconButton } from "onyxia-ui/IconButton";
import type {
    FormField,
    IndexedFormFields,
    FormFieldValue
} from "core/usecases/launcher/FormField";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { capitalize } from "tsafe/capitalize";
import { useTranslation } from "ui/i18n";
import { Slider } from "onyxia-ui/Slider";
import type { RangeSliderProps } from "onyxia-ui/RangeSlider";
import { RangeSlider } from "onyxia-ui/RangeSlider";
import type { Param0 } from "tsafe";
import type { Equals } from "tsafe";
import type { TextFieldProps } from "onyxia-ui/TextField";
import { TextField } from "onyxia-ui/TextField";
import { assert } from "tsafe/assert";
import { declareComponentKeys } from "i18nifty";
import { symToStr } from "tsafe/symToStr";
import type { FormFieldValidity } from "core/usecases/launcher/selectors";
import { id } from "tsafe/id";
import type { MuiIconComponentName } from "onyxia-ui/MuiIconComponentName";

export type LauncherConfigurationCardProps = {
    className?: string;
    dependencyNamePackageNameOrGlobal: string;
    meta: IndexedFormFields[string]["meta"];
    formFieldsByTabName: IndexedFormFields[string]["formFieldsByTabName"];
    onFormValueChange(params: FormFieldValue): void;
    formFieldsIsWellFormed: FormFieldValidity[];
};

export const LauncherConfigurationCard = memo((props: LauncherConfigurationCardProps) => {
    const {
        className,
        dependencyNamePackageNameOrGlobal,
        meta,
        formFieldsByTabName,
        onFormValueChange,
        formFieldsIsWellFormed
    } = props;

    const { classes, cx } = useStyles();

    const [isCollapsed, setIsCollapsed] = useState(true);

    const tabs = useMemo(
        () =>
            Object.keys(formFieldsByTabName).map(title => ({
                "id": title,
                "title": capitalize(title)
            })),
        [formFieldsByTabName]
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
                                "dependencyName": dependencyNamePackageNameOrGlobal
                            } as const;
                        case "global":
                            return {
                                "type": "global",
                                "description": meta.description
                            } as const;
                        case "package":
                            return {
                                "type": "package",
                                "packageName": dependencyNamePackageNameOrGlobal
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
                    maxTabCount={4}
                >
                    <TabContent
                        {...formFieldsByTabName[activeTabId]}
                        onFormValueChange={onFormValueChange}
                        formFieldsIsWellFormed={formFieldsIsWellFormed}
                    />
                </Tabs>
            )}
        </div>
    );
});

LauncherConfigurationCard.displayName = symToStr({
    LauncherConfigurationCard
});

export const { i18n } = declareComponentKeys<
    | "global config"
    | { K: "configuration"; P: { packageName: string } }
    | { K: "dependency"; P: { dependencyName: string } }
    | { K: "launch of a service"; P: { dependencyName: string } }
    | { K: "mismatching pattern"; P: { pattern: string } }
    | "Invalid YAML Object"
    | "Invalid YAML Array"
>()({ LauncherConfigurationCard });

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

    const useStyles = tss
        .withParams<{
            isCollapsed: boolean;
            isExpandIconVisible: boolean;
        }>()
        .create(({ theme, isCollapsed, isExpandIconVisible }) => ({
            "root": {
                "display": "flex",
                ...theme.spacing.rightLeft("padding", 4),
                "backgroundColor": theme.colors.useCases.surfaces.surface1,
                "cursor": "pointer",
                "borderBottom": isCollapsed
                    ? undefined
                    : `1px solid ${theme.colors.useCases.typography.textTertiary}`
            },
            "expandIcon": {
                "& svg": {
                    "transition": theme.muiTheme.transitions.create(["transform"], {
                        "duration": theme.muiTheme.transitions.duration.short
                    }),
                    "transform": `rotate(${isCollapsed ? 0 : "-180deg"})`,
                    "visibility": isExpandIconVisible ? undefined : "hidden"
                }
            },
            "title": {
                "display": "flex",
                "alignItems": "center"
            },
            "titleWrapper": {
                "display": "flex",
                "flexDirection": "column",
                "justifyContent": "center",
                ...theme.spacing.topBottom("margin", 3)
            },
            "subtitle": {
                "marginTop": theme.spacing(2)
            }
        }));

    const Header = memo((props: Props) => {
        const { className, isCollapsed, onIsCollapsedValueChange } = props;

        const { classes, cx } = useStyles({
            isCollapsed,
            "isExpandIconVisible": onIsCollapsedValueChange !== undefined
        });

        const onClick = useConstCallback(() => onIsCollapsedValueChange?.());

        const { t } = useTranslation({ LauncherConfigurationCard });

        return (
            <div className={cx(classes.root, className)} onClick={onClick}>
                <div className={classes.titleWrapper}>
                    <Text typo="object heading" className={classes.title}>
                        {(() => {
                            switch (props.type) {
                                case "dependency":
                                    return (
                                        <>
                                            <Icon
                                                icon={id<MuiIconComponentName>(
                                                    "SubdirectoryArrowRight"
                                                )}
                                            />
                                            &nbsp;
                                            {t("dependency", {
                                                "dependencyName": capitalize(
                                                    props.dependencyName
                                                )
                                            })}
                                        </>
                                    );
                                case "global":
                                    return t("global config");
                                case "package":
                                    return t("configuration", {
                                        "packageName": capitalize(props.packageName)
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
                                                props.dependencyName
                                            )
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
                    icon={id<MuiIconComponentName>("ExpandMore")}
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
        formFieldsIsWellFormed: LauncherConfigurationCardProps["formFieldsIsWellFormed"];
    };

    const TabContent = memo((props: Props) => {
        const {
            className,
            formFields,
            onFormValueChange,
            description,
            assembledSliderRangeFormFields,
            formFieldsIsWellFormed
        } = props;

        const onValueBeingChangeFactory = useCallbackFactory(
            (
                //NOTE: To be memoized it needs to be a primitive value
                [pathStr]: [string],
                [{ value }]: [Param0<TextFieldProps["onValueBeingTypedChange"]>]
            ) => onFormValueChange({ "path": JSON.parse(pathStr), value })
        );

        const onYamlValueBeingChangeFactory = useCallbackFactory(
            (
                //NOTE: To be memoized it needs to be a primitive value
                [pathStr]: [string],
                [{ value }]: [Param0<TextFieldProps["onValueBeingTypedChange"]>]
            ) =>
                onFormValueChange({
                    "path": JSON.parse(pathStr),
                    "value": {
                        "type": "yaml",
                        "yamlStr": value
                    }
                })
        );

        const { t } = useTranslation({ LauncherConfigurationCard });

        const onEscapeKeyDownFactory = useCallbackFactory(
            ([pathStr, defaultValue]: [string, string | FormFieldValue.Value.Yaml]) =>
                onFormValueChange({ "path": JSON.parse(pathStr), "value": defaultValue })
        );

        const onCheckboxChangeFactory = useCallbackFactory(([pathStr]: [string]) => {
            const path = JSON.parse(pathStr);

            onFormValueChange({
                path,
                "value": !formFields.find(formField => same(formField.path, path))!.value
            });
        });

        const onSelectChangeFactory = useCallbackFactory(
            ([pathStr]: [string], [event]: [SelectChangeEvent<string>]) =>
                onFormValueChange({
                    "path": JSON.parse(pathStr),
                    "value": event.target.value
                })
        );

        const onNumberTextFieldChangeFactory = useCallbackFactory(
            (
                [pathStr]: [string],
                [{ target }]: [React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>]
            ) =>
                onFormValueChange({
                    "path": JSON.parse(pathStr),
                    "value": parseFloat(target.value)
                })
        );

        const onSimpleSliderValueChange = useCallbackFactory(
            ([pathStr, unit]: [string, string], [value]: [number]) =>
                onFormValueChange({
                    "path": JSON.parse(pathStr),
                    "value": `${value}${unit}`
                })
        );

        const onRangeSliderValueChange = useCallbackFactory(
            (
                [pathDownStr, pathUpStr, unit]: [string, string, string],
                [params]: [Param0<RangeSliderProps["onValueChange"]>]
            ) =>
                onFormValueChange({
                    "path": (() => {
                        switch (params.extremity) {
                            case "low":
                                return JSON.parse(pathDownStr);
                            case "high":
                                return JSON.parse(pathUpStr);
                        }
                    })(),
                    "value": `${params.value}${unit}`
                })
        );

        const { classes, cx, css } = useStyles();

        return (
            <>
                {description !== undefined && (
                    <Text typo="label 1" className={classes.tabDescription}>
                        {capitalize(description).split(".")[0]}
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
                                            "gridColumn": "span 3"
                                        }
                                )}
                            >
                                {(() => {
                                    const label = capitalize(formField.title);
                                    let hasError = false;
                                    const helperText =
                                        (() => {
                                            const formFieldIsWellFormed =
                                                formFieldsIsWellFormed.find(({ path }) =>
                                                    same(path, formField.path)
                                                );

                                            assert(formFieldIsWellFormed !== undefined);

                                            if (formFieldIsWellFormed.isWellFormed) {
                                                return undefined;
                                            }

                                            hasError = true;

                                            switch (formFieldIsWellFormed.message) {
                                                case "mismatching pattern":
                                                    return t(
                                                        formFieldIsWellFormed.message,
                                                        {
                                                            "pattern":
                                                                formFieldIsWellFormed.pattern
                                                        }
                                                    );
                                                default: {
                                                    return t(
                                                        formFieldIsWellFormed.message
                                                    );
                                                }
                                            }
                                        })() ??
                                        (formField.description === undefined
                                            ? undefined
                                            : capitalize(formField.description));

                                    switch (formField.type) {
                                        case "object":
                                        case "array":
                                            return (
                                                <TextField
                                                    doIndentOnTab={true}
                                                    doRenderAsTextArea={true}
                                                    className={classes.textField}
                                                    label={label}
                                                    defaultValue={formField.value.yamlStr}
                                                    inputProps_aria-invalid={hasError}
                                                    helperText={helperText}
                                                    disabled={formField.isReadonly}
                                                    selectAllTextOnFocus={false}
                                                    onValueBeingTypedChange={onYamlValueBeingChangeFactory(
                                                        JSON.stringify(formField.path)
                                                    )}
                                                    inputProps_spellCheck={false}
                                                    autoComplete="off"
                                                    onEscapeKeyDown={onEscapeKeyDownFactory(
                                                        JSON.stringify(formField.path),
                                                        formField.defaultValue
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
                                                                    JSON.stringify(
                                                                        formField.path
                                                                    )
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
                                                            JSON.stringify(formField.path)
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
                                        case "password":
                                        case "text":
                                            return (
                                                <TextField
                                                    type={formField.type}
                                                    doRenderAsTextArea={
                                                        formField.doRenderAsTextArea
                                                    }
                                                    className={classes.textField}
                                                    label={label}
                                                    defaultValue={formField.value}
                                                    inputProps_aria-invalid={hasError}
                                                    helperText={helperText}
                                                    disabled={formField.isReadonly}
                                                    onValueBeingTypedChange={onValueBeingChangeFactory(
                                                        JSON.stringify(formField.path)
                                                    )}
                                                    inputProps_spellCheck={false}
                                                    autoComplete="off"
                                                    selectAllTextOnFocus={true}
                                                    onEscapeKeyDown={onEscapeKeyDownFactory(
                                                        JSON.stringify(formField.path),
                                                        formField.defaultValue
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
                                                        JSON.stringify(formField.path)
                                                    )}
                                                    inputProps={{
                                                        "min": formField.minimum
                                                    }}
                                                    label={label}
                                                    type="number"
                                                    InputLabelProps={{
                                                        "shrink": true
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
                                                            formField.sliderUnit
                                                        )[0]
                                                    )}
                                                    onValueChange={onSimpleSliderValueChange(
                                                        JSON.stringify(formField.path),
                                                        formField.sliderUnit
                                                    )}
                                                    extraInfo={formField.description}
                                                />
                                            );
                                    }

                                    assert<Equals<(typeof formField)["type"], never>>(
                                        false
                                    );
                                })()}
                            </div>
                        )),
                        ...assembledSliderRangeFormFields.map(
                            assembledSliderRangeFormField => (
                                <RangeSlider
                                    key={assembledSliderRangeFormField.title}
                                    label={capitalize(
                                        assembledSliderRangeFormField.title
                                    )}
                                    max={assembledSliderRangeFormField.sliderMax}
                                    min={assembledSliderRangeFormField.sliderMin}
                                    step={assembledSliderRangeFormField.sliderStep}
                                    unit={assembledSliderRangeFormField.sliderUnit}
                                    valueHigh={Number.parseFloat(
                                        assembledSliderRangeFormField.extremities.up.value.split(
                                            assembledSliderRangeFormField.sliderUnit
                                        )[0]
                                    )}
                                    valueLow={Number.parseFloat(
                                        assembledSliderRangeFormField.extremities.down.value.split(
                                            assembledSliderRangeFormField.sliderUnit
                                        )[0]
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
                                        JSON.stringify(
                                            assembledSliderRangeFormField.extremities.down
                                                .path
                                        ),
                                        JSON.stringify(
                                            assembledSliderRangeFormField.extremities.up
                                                .path
                                        ),
                                        assembledSliderRangeFormField.sliderUnit
                                    )}
                                />
                            )
                        )
                    ]}
                </div>
            </>
        );
    });

    const useStyles = tss.withName({ TabContent }).create(({ theme }) => ({
        "root": {
            "display": "grid",
            "gridTemplateColumns": "repeat(3, 1fr)",
            "gap": theme.spacing(5)
        },
        "textField": {
            //Hacky... to accommodate the helper text
            //"marginBottom": 32,
            "width": "100%"
        },
        "tabDescription": {
            "marginTop": theme.spacing(2),
            "marginBottom": theme.spacing(5)
        }
    }));

    return { TabContent };
})();

const useStyles = tss.withName({ LauncherConfigurationCard }).create(({ theme }) => ({
    "root": {
        "borderRadius": 8,
        "overflow": "hidden",
        "boxShadow": theme.shadows[1]
    },
    // eslint-disable-next-line tss-unused-classes/unused-classes
    "collapsedPanel": {
        "maxHeight": 0,
        "transform": "scaleY(0)"
    },
    // eslint-disable-next-line tss-unused-classes/unused-classes
    "expandedPanel": {
        "transition": "transform 150ms cubic-bezier(0.4, 0, 0.2, 1)",
        "transform": "scaleY(1)",
        "transformOrigin": "top"
    }
}));
