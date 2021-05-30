
import { createUseClassNames } from "onyxia-design";
import { cx } from "tss-react";
import { memo } from "react";
import { Typography } from "app/components/designSystem/Typography";
import { Props as AppIconProps } from "../designSystem/Icon";
import { Icon } from "../designSystem/Icon";
import type { PickOptionals } from "tsafe";
import { noUndefined } from "app/tools/noUndefined";

export type Props = {
    icon: AppIconProps["type"];
    text1: NonNullable<React.ReactNode>;
    text2: NonNullable<React.ReactNode>;
    text3: NonNullable<React.ReactNode>;
    className?: string | null;

};

export const defaultProps: PickOptionals<Props> = {
    "className": null
};

const { useClassNames } = createUseClassNames<Required<Props>>()(
    theme => ({
        "root": {
            "backgroundColor": "inherit",
            //"paddingTop": theme.spacing(3),
            "paddingBottom": theme.spacing(4)
        },
        "text1": {
            "marginBottom": theme.spacing(2),
            "display": "flex",
            "alignItems": "center"
        },
        "icon": {
            "marginRight": theme.spacing(2),
            "position": "relative",
            "fontSize": 40
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
                <Icon type={icon} className={classNames.icon} />
                {text1}
            </Typography>
            <Typography variant="h5" className={classNames.text2}>{text2}</Typography>
            <Typography variant="body1">{text3}</Typography>
        </div>
    );

});

