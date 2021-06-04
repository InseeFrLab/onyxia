
import { memo } from "react";
import type { ReactNode } from "react";
import { Typography } from "onyxia-ui";
import { Tooltip } from "onyxia-ui";
import { Icon } from "onyxia-ui";
import { createUseClassNames } from "app/theme";
import { cx } from "tss-react";

export type Props = {
    className?: string;
    title: string;
    helperText?: ReactNode;
    tooltipText?: string;
};

const { useClassNames } = createUseClassNames()(
    theme => ({
        "root": {
            "marginBottom": theme.spacing(3)
        },
        "title": {
            "display": "inline-block",
        },
        "helperText": {
            "marginTop": theme.spacing(1)
        },
        "helpIcon": {
            "marginLeft": theme.spacing(1)
        }
    })
);

export const AccountSectionHeader = memo((props: Props) => {

    const { title, helperText, tooltipText, className } = props;

    const { classNames } = useClassNames({});

    return (
        <div className={cx(classNames.root, className)}>

            <Typography
                variant="h5"
                className={classNames.title}
            >
                {title}
            </Typography>
            {
                tooltipText &&
                <Tooltip title={tooltipText}>
                    <Icon 
                        className={classNames.helpIcon} 
                        type="help" 
                        fontSize="small" 
                    />
                </Tooltip>
            }
            {
                helperText &&
                <Typography
                    variant="body2"
                    className={classNames.helperText}
                >
                    {helperText}
                </Typography>
            }

        </div>
    );

});