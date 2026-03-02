import type { CSSProperties } from "react";

export type BookmarkPinButtonProps = {
    onClick?: () => void;
    disabled?: boolean;
};

const buttonStyle: CSSProperties = {
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    borderRadius: 6,
    padding: "6px 10px",
    fontSize: 13,
    cursor: "pointer"
};

export function BookmarkPinButton(props: BookmarkPinButtonProps) {
    const { onClick, disabled } = props;

    return (
        <button type="button" onClick={onClick} disabled={disabled} style={buttonStyle}>
            Pin / Add bookmark
        </button>
    );
}

// TODO: Replace with icon button and design system styling.
