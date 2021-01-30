
import { createUseClassNames, cx } from "app/theme/useClassNames";
import { memo } from "react";
import { Typography } from "app/components/designSystem/Typography";
import { Props as AppIconProps } from "../designSystem/Icon";
import { Icon } from "../designSystem/Icon";
import type { Optional } from "evt/tools/typeSafety";
import { noUndefined } from "app/tools/noUndefined";

export type Props = {
    icon: AppIconProps["type"];
    text1: NonNullable<React.ReactNode>;
    text2: NonNullable<React.ReactNode>;
    text3: NonNullable<React.ReactNode>;
    className?: string | null;

};

export const defaultProps: Optional<Props> = {
    "className": null
};

const { useClassNames } = createUseClassNames<Required<Props>>()(
    ({ theme }) => ({
        "root": {
            "backgroundColor": "inherit",
            "padding": theme.spacing(5),
            "paddingLeft": theme.spacing(3)
        },
        "text1": {
            "marginBottom": theme.spacing(3),
            //"border": "1px solid black",
            "display": "flex",
            "alignItems": "center"
        },
        "icon": {
            "marginRight": theme.spacing(2),
            "position": "relative",
            //"border": "1px solid black",
            "fontSize": 46
        },
        "text2": {
            "marginBottom": theme.spacing(1)
        }
    })
);


export const PageHeader = memo((props: Props) => {

    const completedProps = { ...defaultProps, ...noUndefined(props) };

    const { icon, text1, text2, text3, className } = completedProps;

    const { classNames } = useClassNames(completedProps);

    return (
        <div className={cx(classNames.root, className)}>
            <Typography variant="h2" className={classNames.text1}>
                <Icon type={icon} fontSize="large" className={classNames.icon} />
                {/* //TODO: Address the fact that our font does not have the same box size*/}
                <span style={{ "paddingTop": "6px", /*"border": "1px solid black"*/ }}>{text1}</span>
            </Typography>
            <Typography variant="h5" className={classNames.text2}>{text2}</Typography>
            <Typography variant="body1">{text3}</Typography>
        </div>
    );

});

