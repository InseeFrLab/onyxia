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
import { makeStyles, IconButton, Text } from "app/theme";
import { useConstCallback } from "powerhooks/useConstCallback";
import type { FormField } from "lib/useCases/launcher";
import type { FormFieldValue } from "lib/useCases/sharedDataModel/FormFieldValue";
import { useCallbackFactory } from "powerhooks/useCallbackFactory";
import { capitalize } from "tsafe/capitalize";
import { Icon } from "app/theme";
import { useTranslation } from "app/i18n/useTranslations";
import type { IndexedFormFields } from "lib/useCases/launcher";

export type Props = {
    className?: string;
    dependencyNamePackageNameOrGlobal: string;
    meta: IndexedFormFields[string]["meta"];
    formFieldsByTabName: IndexedFormFields[string]["formFieldsByTabName"];
    onFormValueChange(params: FormFieldValue): void;
};

const useStyles = makeStyles()(theme => ({
    "root": {
        "borderRadius": 8,
        "overflow": "hidden",
        "boxShadow": theme.shadows[1],
    },
    "collapsedPanel": {
        "maxHeight": 0,
        "transform": "scaleY(0)",
    },
    "expandedPanel": {
        "transition": "transform 150ms cubic-bezier(0.4, 0, 0.2, 1)",
        "transform": "scaleY(1)",
        "transformOrigin": "top",
    },
}));

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
            "padding": theme.spacing(0, 4),
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
            "margin": theme.spacing(3, 0),
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

        const { t } = useTranslation("CatalogLauncherConfigurationCard");

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
        formFields: FormField[];
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
        const { className, formFields, onFormValueChange, description } = props;

        const onTextFieldChangeFactory = useCallbackFactory(
            (
                [path]: [string[]],
                [{ target }]: [React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>],
            ) => onFormValueChange({ path, "value": target.value }),
        );

        const onTextFieldFocus = useConstCallback(
            ({ target }: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                target.setSelectionRange(0, target.value.length),
        );

        const onCheckboxChangeFactory = useCallbackFactory(([path]: [string[]]) =>
            onFormValueChange({
                path,
                "value": !formFields.find(formField => same(formField.path, path))!.value,
            }),
        );

        const onSelectChangeFactory = useCallbackFactory(
            ([path]: [string[]], [event]: [React.ChangeEvent<{ value: unknown }>]) =>
                onFormValueChange({
                    path,
                    "value": event.target.value as string,
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

        const { classes, cx } = useStyles();

        return (
            <>
                {description !== undefined && (
                    <Text typo="label 1" className={classes.tabDescription}>
                        {capitalize(description)}
                    </Text>
                )}
                <div className={cx(classes.root, className)}>
                    {formFields.map((formField, i) => (
                        <div key={i}>
                            {(() => {
                                const label = capitalize(formField.title);
                                const helperText =
                                    formField.description === undefined
                                        ? undefined
                                        : capitalize(formField.description);

                                switch (typeof formField.value) {
                                    case "string":
                                        return formField.enum !== undefined ? (
                                            (() => {
                                                const labelId = `select_label_${i}`;

                                                return (
                                                    <FormControl>
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
                                            })()
                                        ) : (
                                            <MuiTextField
                                                className={classes.textField}
                                                label={label}
                                                value={formField.value}
                                                helperText={helperText}
                                                disabled={formField.isReadonly}
                                                onChange={onTextFieldChangeFactory(
                                                    formField.path,
                                                )}
                                                autoComplete="off"
                                                inputProps={{
                                                    "spellCheck": false,
                                                }}
                                                onFocus={onTextFieldFocus}
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
                                    case "number":
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
                                }
                            })()}
                        </div>
                    ))}
                </div>
            </>
        );
    });

    return { TabContent };
})();
