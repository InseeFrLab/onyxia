import type { ReactNode } from "react";
import { tss } from "tss";
import { Text } from "onyxia-ui/Text";
import { capitalize } from "tsafe/capitalize";
import { useBackgroundColor } from "ui/tools/useBackgroundColor";
import { IconButton } from "onyxia-ui/IconButton";
import { getIconUrlByName } from "lazy-icons";
import { Markdown } from "onyxia-ui/Markdown";
import { AutoInjectSwitch } from "./AutoInjectSwitch";

export function FormFieldGroupComponentWrapper(props: {
    className?: string;
    title: string | undefined;
    description: string | undefined;
    onRemove: (() => void) | undefined;
    autoInjection:
        | {
              isAutoInjected: boolean;
              onIsAutoInjectedChange: (isAutoInjected: boolean) => void;
          }
        | undefined;
    children: ReactNode;
}) {
    const { className, title, description, onRemove, autoInjection, children } = props;

    const { backgroundColor, setElement: setRootElement } = useBackgroundColor();

    const { cx, classes } = useStyles({
        headingWrapperBackgroundColor: backgroundColor,
        isAutoInjected: autoInjection?.isAutoInjected ?? true
    });

    return (
        <fieldset ref={setRootElement} className={cx(classes.root, className)}>
            {title !== undefined && (
                <div className={classes.headingWrapper}>
                    <Text
                        typo="label 1"
                        componentProps={{ lang: "und" }}
                        className={classes.headingTexts}
                    >
                        {capitalize(title)}
                    </Text>
                    {description !== undefined && (
                        <Text
                            typo="caption"
                            componentProps={{ lang: "und" }}
                            className={classes.headingTexts}
                        >
                            <Markdown inline={true} lang="und">
                                {capitalize(description)}
                            </Markdown>
                        </Text>
                    )}
                    {autoInjection !== undefined && (
                        <AutoInjectSwitch
                            isAutoInjected={autoInjection.isAutoInjected}
                            onChange={autoInjection.onIsAutoInjectedChange}
                        />
                    )}
                </div>
            )}
            {onRemove !== undefined && (
                <IconButton
                    className={classes.removeButton}
                    iconClassName={classes.removeButtonIcon}
                    onClick={onRemove}
                    icon={getIconUrlByName("RemoveCircleOutline")}
                />
            )}
            <div>{children}</div>
        </fieldset>
    );
}

const useStyles = tss
    .withName({ FormFieldGroupComponentWrapper })
    .withParams<{ headingWrapperBackgroundColor: string; isAutoInjected: boolean }>()
    .create(({ theme, headingWrapperBackgroundColor, isAutoInjected }) => ({
        root: {
            border: `1px ${isAutoInjected ? "solid" : "dashed"} ${theme.colors.useCases.typography.textTertiary}`,
            borderRadius: theme.spacing(3),

            position: "relative"
        },
        headingWrapper: {
            marginBottom: theme.spacing(2),
            display: "inline-flex",
            alignItems: "center",
            gap: theme.spacing(2),
            position: "relative",
            top: -theme.typography.rootFontSizePx * 1.1,
            left: theme.spacing(4),
            backgroundColor: headingWrapperBackgroundColor,
            borderRadius: theme.spacing(3),
            ...theme.spacing.rightLeft("padding", 2)
        },
        headingTexts: {
            color: isAutoInjected
                ? undefined
                : theme.colors.useCases.typography.textDisabled
        },
        removeButton: {
            position: "absolute",
            left: -theme.typography.rootFontSizePx * 2.35,
            top: -theme.typography.rootFontSizePx * 0.1
        },
        removeButtonIcon: {
            color: theme.colors.useCases.alertSeverity.error.main
        }
    }));
