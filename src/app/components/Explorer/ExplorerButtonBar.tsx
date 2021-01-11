
import { useMemo } from "react";
import { Button } from "app/components/designSystem/Button";
import { useTranslation } from "app/i18n/useTranslations";
import memoize from "memoizee";
import { id } from "evt/tools/typeSafety/id";
import Box from "@material-ui/core/Box";
import { makeStyles, createStyles } from "@material-ui/core/styles";
import type { Props as IconProps } from "app/components/designSystem/Icon";

export type Action = "rename" | "create file" | "create directory" | "delete" | "copy path";

export type Props = {
    /** [HIGHER ORDER] */
    wordForFile: "file" | "secret";

    isThereAnItemSelected: boolean;
    isSelectedItemInEditingState: boolean;

    callback(params: { action: Action; }): void;

};

const useStyles = makeStyles(
    () => createStyles<
    "root" ,
        Props 
    >({
        "root": {
        },
    })
);

export function ExplorerButtonBar(props: Props) {



    const {
        wordForFile,
        callback,
        isThereAnItemSelected,
        isSelectedItemInEditingState
    } = props;

    const classes = useStyles(props);

    const { t } = useTranslation("ExplorerButtonBar");

    const onClickFactory = useMemo(
        () => memoize(
            (action: Action) =>
                () => callback({ action })
        ),
        [callback]
    );

    return (
        <Box className={classes.root}>
            { ([
                "rename",
                "create file",
                "create directory",
                "delete",
                "copy path"
            ] as const).map(action =>
                <CustomButton
                    startIcon={(() => {
                        switch (action) {
                            case "copy path": return "filterNone" as const;
                            case "create directory": return "add";
                            case "create file": return "add";
                            case "delete": return "delete";
                            case "rename": return "edit";
                        }
                    })()}
                    disabled={
                        (
                            !isThereAnItemSelected &&
                            id<Action[]>(["copy path", "delete", "rename"]).includes(action)
                        ) || (
                            isSelectedItemInEditingState &&
                            action === "rename"
                        )
                    }
                    key={action}
                    onClick={onClickFactory(action)}

                >
                    {
                        action === "create file" ?
                            t("create what", { "what": t(wordForFile) }) :
                            t(action)
                    }
                </CustomButton>
            )}
        </Box>
    );

}
export declare namespace ExplorerButtonBar {
    export type I18nScheme = Record<Exclude<Action, "create file">, undefined> & {
        "create what": { what: string; };
        secret: undefined;
        file: undefined;
    };
}

type CustomButtonProps={
    startIcon: IconProps["type"];
    disabled: boolean;
    onClick(): void;
    children: React.ReactNode;
};

const useCustomButtonStyles = makeStyles(
    theme => createStyles<
        "root",
        CustomButtonProps
    >({
        "root": {
            "&.Mui-disabled .MuiButton-label": {
                "color": theme.custom.colors.useCases.typography.textDisabled
            },
            "& .MuiButton-label": {
                "color": theme.custom.colors.useCases.typography.textPrimary
            },
            "&:active .MuiButton-label": {
                "color": theme.custom.colors.useCases.typography.textFocus
            },
            "& .MuiTouchRipple-root": {
                "display": "none"
            },
            "transition": "none",
            "& > *": {
                "transition": "none"
            },
            "borderRadius": "unset",
            "&:hover": {
                "borderBottom": `2px solid ${theme.custom.colors.useCases.buttons.actionActive}`,
                "marginBottom": "-2px",
                "boxSizing": "border-box",
                "backgroundColor": "unset",
            },
        },
    })
);


function CustomButton(props: CustomButtonProps) {

    const { startIcon, disabled, onClick, children } = props;

    const classes = useCustomButtonStyles(props);

    return (
        <Button
            className={classes.root}
            color="secondary"
            isRounded={false}
            startIcon={startIcon}
            {...{ disabled, onClick }}
        >
            {children}
        </Button>
    );

}