
import { createGroup } from "type-route";
import { routes } from "app/router";
import { cx } from "tss-react";
import { Paper } from "app/components/designSystem/Paper";
import { useTranslation } from "app/i18n/useTranslations";
import { useSelector, useDispatch } from "app/interfaceWithLib/hooks";
import { createUseClassNames } from "app/theme/useClassNames";
import { useTheme } from "@material-ui/core/styles";
import { css } from "tss-react";
import { useState, memo } from "react";
import { TextField } from "app/components/designSystem/TextField";
import type { TextFieldProps } from "app/components/designSystem/TextField";
import { Evt } from "evt";
import type { UnpackEvt } from "evt";
import { smartTrim } from "app/tools/smartTrim";
import { Typography } from "app/components/designSystem/Typography";
import { IconButton } from "app/components/designSystem/IconButton";
import { useConstCallback } from "powerhooks";
import TableRow from "@material-ui/core/TableRow";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import { thunks } from "lib/setup";
import { copyToClipboard } from "app/tools/copyToClipboard";
import { useCallbackFactory } from "powerhooks";
import type { UserConfigs } from "lib/useCases/userConfigs";
import  { doExtends } from "evt/tools/typeSafety/doExtends";
import type { ReturnType, Params } from "evt/tools/typeSafety";

Account.routeGroup = createGroup([routes.account]);

Account.requireUserLoggedIn = true;

const { useClassNames } = createUseClassNames()(
    theme => ({
        "root": {
            "backgroundColor": theme.custom.colors.useCases.surfaces.background
        }
    })
)

export type Props = {
    className?: string;
};

type Target = "userServicePassword" | "gitName" | "gitEmail" |
    "githubPersonalAccessToken" | "kaggleApiToken";

doExtends<Target, keyof UserConfigs>();

export function Account(props: Props) {

    const { className } = props;

    const { classNames } = useClassNames({});

    const { t } = useTranslation("Account");

    const userConfigsState = useSelector(state => state.userConfigs);

    const dispatch = useDispatch();

    const onCopyFactory = useCallbackFactory(
        ([target]: [Target]) =>
            copyToClipboard(userConfigsState[target].value!)
    );

    const onEditFactory = useCallbackFactory(
        (
            [target]: [Exclude<Target, "userServicePassword">],
            [{ editedValue }]: [{ editedValue: string; }]
        ) =>
            dispatch((() => {
                switch (target) {
                    case "gitName":
                    case "gitEmail":
                    case "kaggleApiToken":
                    case "githubPersonalAccessToken":
                        return thunks.userConfigs.changeValue({
                            "key": target,
                            "value": editedValue
                        })
                }
            })())
    );

    const getIsValidValueFactory = useCallbackFactory(
        (
            [_target]: [Exclude<Target, "userServicePassword">],
            [_value]: [string]
        ): ReturnType<NonNullable<TextFieldProps["getIsValidValue"]>> =>
            ({ "isValidValue": true })
    );

    const onServicesPasswordRenew =
        useConstCallback(() => dispatch(thunks.userConfigs.renewUserServicePassword()));

    let isDarker: boolean;

    return (
        <section className={cx(classNames.root, className)} >

            <Paper>
                <Typography variant="h5">{t("user info")}</Typography>
                <TableContainer>
                    <ServicesPasswordRow
                        isDarker={isDarker = false}
                        password={userConfigsState.userServicePassword.value}
                        onCopy={onCopyFactory("userServicePassword")}
                        onRenew={onServicesPasswordRenew}
                        isLocked={userConfigsState.userServicePassword.isBeingChanged}
                    />

                    {(["gitName", "gitEmail", "kaggleApiToken"] as const).map(target =>
                        <EditableRow
                            rowKey={t(target)}
                            isDarker={isDarker = !isDarker}
                            getIsValidValue={getIsValidValueFactory(target)}
                            isCopyable={true}
                            isEditable={true}
                            isLocked={userConfigsState[target].isBeingChanged}
                            value={userConfigsState[target].value ?? ""}
                            onCopy={onCopyFactory(target)}
                            onEdit={onEditFactory(target)}
                        />
                    )}
                </TableContainer>
            </Paper>

        </section>
    );

}

export declare namespace Account {

    export type I18nScheme = {
        'user info': undefined;
        'onyxia info': undefined;
    } & Record<Target, undefined>;

}


const { ServicesPasswordRow } = (() => {


    type Props = {
        password: string;
        onCopy(): void;
        onRenew(): void;
        isDarker: boolean;
        isLocked: boolean;
    };

    const { useClassNames } = createUseClassNames<Props>()(
        (theme, { isDarker }) => ({
            "root": {
                "backgroundColor": isDarker ?
                    theme.custom.colors.useCases.surfaces.background :
                    "transparent",
            },
            "value": {
                "padding": theme.spacing(2, 1),
                "wordBreak": "break-all"
            }
        })
    );

    const ServicesPasswordRow = memo((props: Props) => {

        const {
            password,
            onCopy,
            onRenew,
            isLocked
        } = props;

        const { t } = useTranslation("Account");

        const { classNames } = useClassNames(props);

        const theme = useTheme();

        return (
            <TableRow className={classNames.root}>
                <TableCell>
                    {
                        <Typography
                            variant="body1"
                            className={css({ "padding": theme.spacing(2, 1) })}
                        >
                            {t("userServicePassword")}
                        </Typography>
                    }</TableCell>
                <TableCell>{
                    <Typography className={classNames.value}>{
                        smartTrim({
                            "maxLength": 70,
                            "minCharAtTheEnd": 10,
                            "text": password
                        })
                    }</Typography>
                }</TableCell>
                <TableCell align="right">
                    <div className={css({ "display": "flex" })}>
                        <IconButton
                            type="attachMoney"
                            onClick={onRenew}
                            fontSize="small"
                            disabled={isLocked}
                        />
                        <IconButton
                            type="filterNone"
                            onClick={onCopy}
                            fontSize="small"
                        />
                    </div>
                </TableCell>
            </TableRow>
        );

    });

    return { ServicesPasswordRow };

})();




const { EditableRow } = (() => {


    type Props = {
        rowKey: string;
        value: string;
        isEditable: boolean;
        isCopyable: boolean;
        isDarker: boolean;
        onCopy(): void;
        onEdit?: (
            props: {
                editedValue: string;
            }
        )=> void;
        getIsValidValue?: TextFieldProps["getIsValidValue"];

        isLocked: boolean;
    };

    const { useClassNames } = createUseClassNames<Props & { isInEditingState: boolean; }>()(
        (theme, { isInEditingState, isDarker }) => ({
            "root": {
                "backgroundColor": isDarker ?
                    theme.custom.colors.useCases.surfaces.background :
                    "transparent",
            },
            "value": {
                "padding": theme.spacing(2, 1),
                "wordBreak": "break-all"
            },
            "keyAndValueTableCells": {
                "padding": isInEditingState ? theme.spacing(0, 2) : undefined
            }
        })
    );

    const getIsValidValueDefault = ()=> ({ "isValidValue": true } as const);

    const EditableRow = memo((props: Props) => {

        const {
            rowKey,
            value,
            isEditable,
            isCopyable,
            onCopy,
            onEdit,
            getIsValidValue = getIsValidValueDefault,
            isLocked
        } = props;


        const theme = useTheme();

        const [isInEditingState, setIsInEditingState] = useState(false);
        const [isValidValue, setIsValidValue] = useState(false);

        const { classNames } = useClassNames({ ...props, isInEditingState });

        const [evtInputAction] = useState(
            () => Evt.create<UnpackEvt<NonNullable<TextFieldProps["evtAction"]>>>()
        );

        const onValueBeingTypedChange_strValue = useConstCallback(
            ({ isValidValue }: Params<TextFieldProps["onValueBeingTypedChange"]>) =>
                setIsValidValue(isValidValue)
        );

        const onSubmit = useConstCallback((params: Params<TextFieldProps["onSubmit"]>) => {

            const { value } = params;

            setIsInEditingState(false);

            onEdit?.({ "editedValue": value });

        });


        const onSubmitButtonClick = useConstCallback(
            () => {
                evtInputAction.post("TRIGGER SUBMIT");
                setIsInEditingState(false);
            }
        );

        const onEscapeKeyDown = useConstCallback<TextFieldProps["onEscapeKeyDown"]>(
            ({ preventDefaultAndStopPropagation }) => {
                preventDefaultAndStopPropagation();
                evtInputAction.post("RESTORE DEFAULT VALUE");
            }
        );

        const isSubmitButtonDisabled = isLocked || !isValidValue;
        const onEnterKeyDown = isSubmitButtonDisabled ? undefined : onSubmitButtonClick;

        const onEditButtonClick = useConstCallback(
            () => setIsInEditingState(true)
        );

        return (
            <TableRow className={classNames.root}>
                <TableCell className={classNames.keyAndValueTableCells}>
                    {
                        <Typography
                            variant="body1"
                            className={css({ "padding": theme.spacing(2, 1) })}
                        >
                            {rowKey}
                        </Typography>
                    }</TableCell>
                <TableCell className={classNames.keyAndValueTableCells}>{
                    !isInEditingState ?
                        <Typography className={classNames.value}>{
                            smartTrim({
                                "maxLength": 70,
                                "minCharAtTheEnd": 10,
                                "text": value
                            })
                        }</Typography>
                        :
                        <TextField
                            defaultValue={value}
                            inputProps_aria-label={`value of ${rowKey}`}
                            onEscapeKeyDown={onEscapeKeyDown}
                            onEnterKeyDown={onEnterKeyDown}
                            evtAction={evtInputAction}
                            onSubmit={onSubmit}
                            getIsValidValue={getIsValidValue}
                            onValueBeingTypedChange={onValueBeingTypedChange_strValue}
                        />
                }</TableCell>
                <TableCell align="right">
                    <div className={css({ "display": "flex" })}>
                        {!isEditable ? null :
                            <IconButton
                                type={isInEditingState ? "check" : "edit"}
                                disabled={isInEditingState ? isSubmitButtonDisabled : isLocked}
                                onClick={isInEditingState ? onSubmitButtonClick : onEditButtonClick}
                                fontSize="small"
                            />
                        }
                        {!isCopyable ? null :
                            <IconButton
                                disabled={value === ""}
                                type="filterNone"
                                onClick={onCopy}
                                fontSize="small"
                            />
                        }
                    </div>
                </TableCell>
            </TableRow>
        );

    });

    return { EditableRow };

})();

