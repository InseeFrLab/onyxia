/* eslint-disable react-refresh/only-export-components */
import { useMemo } from "react";
import { env } from "env";
import { Text } from "onyxia-ui/Text";
import type { Link } from "type-route";
import { tss } from "tss";
import { ThemedImage } from "onyxia-ui/ThemedImage";
import { useWindowInnerSize } from "powerhooks/useWindowInnerSize";

export type Props = {
    className?: string;
    doShowOnyxia: boolean;
    link: Link;
};

export function BrandHeaderSection(props: Props) {
    const { className, doShowOnyxia, link } = props;

    const { windowInnerWidth } = useWindowInnerSize();

    const { logoContainerWidth } = useLogoContainerWidth();

    const { cx, classes } = useStyles({
        logoContainerWidth,
        doShowOnyxia,
        hasBoldText: env.HEADER_TEXT_BOLD !== undefined
    });

    return (
        <a className={cx(classes.root, className)} {...link}>
            <div className={classes.logoContainer}>
                <ThemedImage className={classes.logo} url={env.HEADER_LOGO} />
            </div>
            <div className={classes.textContainer}>
                {doShowOnyxia && (
                    <Text typo="section heading" className={classes.text_onyxia}>
                        Onyxia -
                    </Text>
                )}
                {env.HEADER_TEXT_BOLD !== undefined && (
                    <Text typo="section heading" className={classes.text_organization}>
                        {env.HEADER_TEXT_BOLD}
                    </Text>
                )}
                {windowInnerWidth > 450 && (
                    <Text
                        typo="section heading"
                        className={classes.text_usecase}
                        color="focus"
                    >
                        {env.HEADER_TEXT_FOCUS}
                    </Text>
                )}
            </div>
        </a>
    );
}

const useStyles = tss
    .withName({ BrandHeaderSection })
    .withParams<{
        logoContainerWidth: number;
        doShowOnyxia: boolean;
        hasBoldText: boolean;
    }>()
    .create(({ logoContainerWidth, doShowOnyxia, hasBoldText, theme }) => ({
        root: {
            textDecoration: "none",
            color: "unset",
            display: "flex",
            alignItems: "center"
        },
        logoContainer: {
            width: logoContainerWidth,
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
        },
        logo: {
            width: "60%"
        },
        textContainer: {
            "& > *": {
                display: "inline-block"
            }
        },
        text_onyxia: {
            fontWeight: 600
        },
        text_organization: {
            ...theme.spacing.rightLeft("margin", 2),
            ...(doShowOnyxia ? {} : { marginLeft: 0 })
        },
        text_usecase: {
            fontWeight: 500,
            marginLeft: hasBoldText ? undefined : theme.spacing(2)
        }
    }));

export function useLogoContainerWidth() {
    const { windowInnerWidth } = useWindowInnerSize();

    const logoContainerWidth = useMemo(
        () =>
            Math.max(
                Math.floor(
                    (Math.min(windowInnerWidth, 1920) *
                        4) /* logo container width in percent */ /
                        100
                ),
                45
            ),
        [windowInnerWidth]
    );

    return { logoContainerWidth };
}
