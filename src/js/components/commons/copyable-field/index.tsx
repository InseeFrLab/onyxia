import React from "react";
import { InputAdornment, Input, InputLabel, Typography } from "@mui/material";
import FormControl from "@mui/material/FormControl";
import * as clipboard from "clipboard-polyfill";
import { IconButton, Icon } from "@mui/material";
import FileCopy from "@mui/icons-material/FileCopy";
import OpenInNew from "@mui/icons-material/OpenInNew";
import Delete from "@mui/icons-material/Delete";

export interface Props {
    value: string;
    onChange?: (newValue: string) => void;
    reset?: boolean;
    label?: string;
    description?: string;
    open?: boolean;
    copy: boolean;
    del?: boolean;
    type?: string;
    options?: object;
    onValidate?: (value: string) => void;
    onDelete?: () => void;
}

interface State {
    edit: boolean;
    value: string;
    reset: boolean;
    editable: boolean;
}

class CopyableField extends React.Component<Props, State> {
    domInput = null;
    state = {
        edit: false,
        value: null as any as string,
        reset: false,
        editable: false
    };
    constructor(props: Props) {
        super(props);
        this.state.value = props.value;
        this.state.editable = props.onChange !== undefined;
        this.state.reset = props.reset || false;
    }

    static getDerivedStateFromProps(props: any, state: any) {
        const ns = { ...state };
        ns.isEditable = props.onChange !== undefined;
        if (props.value !== state.value && !state.edit) {
            ns.value = props.value;
        }
        if (props.reset !== state.reset) {
            ns.edit = false;
            ns.reset = props.reset;
        }
        return ns;
    }

    copy = () => {
        clipboard.writeText(this.state.value);
        return false;
    };

    open = () => {
        window.open(this.props.value);
    };

    handleEdit = () => {
        this.setState((s, p) => {
            if (s.edit && p.onChange) {
                p.onChange(p.value);
            }
            return {
                value: p.value,
                edit: !this.state.edit
            };
        });
    };

    handleValidate = () => {
        this.setState((s, p) => {
            if (s.edit && p.onChange) {
                p.onChange(p.value);
                p.onValidate?.(p.value);
            }
            return {
                value: p.value,
                edit: !this.state.edit
            };
        });
    };

    handleChange = (e: any) => {
        const value =
            this.props.type === "number" ? Number(e.target.value) : e.target.value;
        this.setState({ value });
        this.props.onChange?.(value);
    };

    del = () => {
        if (this.props.onDelete) {
            this.props.onDelete();
        }
    };

    render() {
        const {
            label,
            description,
            open = false,
            copy = false,
            del = false,
            type = "string",
            options = {},
            onValidate
        } = this.props;
        return (
            <>
                {description && (
                    <Typography variant="body1" align="left">
                        {description}
                    </Typography>
                )}
                <FormControl className="copy-field" style={{ width: "100%" }}>
                    {label ? <InputLabel>{label}</InputLabel> : null}
                    <Input
                        inputProps={options}
                        inputRef={r => {
                            this.domInput = r;
                        }}
                        disabled={!this.state.editable || !this.state.edit}
                        type={type}
                        fullWidth
                        value={this.state.value}
                        onChange={this.handleChange}
                        endAdornment={
                            <InputAdornment position="end">
                                {this.state.editable && this.state.edit && !onValidate ? (
                                    <IconButton
                                        aria-label="éditer"
                                        onClick={this.handleEdit}
                                    >
                                        <Icon>clear</Icon>
                                    </IconButton>
                                ) : null}
                                {this.state.editable && !this.state.edit ? (
                                    <IconButton
                                        aria-label="éditer"
                                        onClick={this.handleEdit}
                                    >
                                        <Icon>edit</Icon>
                                    </IconButton>
                                ) : null}
                                {this.state.edit && onValidate ? (
                                    <IconButton
                                        aria-label="éditer"
                                        onClick={this.handleValidate}
                                    >
                                        <Icon>done</Icon>
                                    </IconButton>
                                ) : null}
                                {copy ? (
                                    <IconButton
                                        aria-label="copier dans le presse papier"
                                        onClick={this.copy}
                                    >
                                        <FileCopy />
                                    </IconButton>
                                ) : null}
                                {open ? (
                                    <IconButton aria-label="ouvrir" onClick={this.open}>
                                        <OpenInNew />
                                    </IconButton>
                                ) : null}
                                {del ? (
                                    <IconButton aria-label="supprimer" onClick={this.del}>
                                        <Delete />
                                    </IconButton>
                                ) : null}
                            </InputAdornment>
                        }
                    />
                </FormControl>
            </>
        );
    }
}

export default CopyableField;
