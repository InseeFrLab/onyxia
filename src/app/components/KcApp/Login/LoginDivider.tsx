import { memo } from "react";
import { createUseClassNames } from "app/theme";
import { Typography } from "onyxia-ui";
import { cx } from "tss-react";
import { useTranslation } from "app/i18n/useTranslations";

export type Props = {
	className?: string;
};

const { useClassNames } = createUseClassNames()(
	theme => ({
		"root": {
			"display": "flex",
			"alignItems": "center"
		},
		"separator": {
			"height": 1,
			"backgroundColor": theme.colors.useCases.typography.textSecondary,
			"flex": 1
		},
		"text": {
			"margin": theme.spacing(0, 1),
			"paddingBottom": 2
		}
	})
);

export const LoginDivider = memo(
	(props: Props) => {

		const { className } = props;

		const { classNames } = useClassNames({});

		const { t } = useTranslation("LoginDivider");

		const separator = <div role="separator" className={classNames.separator} />

		return (
			<div className={cx(classNames.root, className)}>
				{separator}
				<Typography
					variant="body2"
					color="secondary"
					className={classNames.text}
				>
					{t("or")}
				</Typography>
				{separator}
			</div>
		);

	}
);

export declare namespace LoginDivider {

	export type I18nScheme = {
		or: undefined;
	};

}
