
import { memo } from "react";
import agentConnectImgUrl from "app/assets/img/agentConnect.png";
import { createUseClassNames } from "app/theme";
import { cx } from "tss-react";
import { useTranslation } from "app/i18n/useTranslations";

export type Props = {
	className?: string;
	url: string;
};

const { useClassNames } = createUseClassNames()(
	theme => ({
		"root": {
			"padding": theme.spacing(0, 4),
			"alignItems": "center",
			"display": "flex",
			"borderRadius": 30,
			"borderWidth": 2,
			"borderStyle": "solid",
			"borderColor":
				theme.isDarkModeEnabled ?
					theme.colors.useCases.typography.textPrimary :
					theme.colors.palette.agentConnect.blueMain,
			"backgroundColor": "transparent",
			"&:hover": {
				"backgroundColor":
					theme.isDarkModeEnabled ?
						theme.colors.palette.light.main :
						theme.colors.palette.agentConnect.blueMain,
				"borderColor": theme.isDarkModeEnabled ?
					theme.colors.palette.light.main :
					undefined,
				"& > span": {
					"color": theme.colors.palette[theme.isDarkModeEnabled ? "dark" : "light"].main,
				}
			},
			"&:active": {
				"backgroundColor":
					theme.isDarkModeEnabled ?
						theme.colors.palette.light.greyVariant1 :
						undefined
			},
			"& .MuiTouchRipple-root": {
				"color": "red"
			},
		},
		"label": {
			...theme.typography.button,
			"color": theme.isDarkModeEnabled ?
				theme.colors.useCases.typography.textPrimary :
				theme.colors.palette.agentConnect.blueMain,
		},
		"img": {
			"width": 32,
			"margin": (()=>{

				const topBottom = "8px";

				return `${topBottom} ${theme.spacing(2)}px ${topBottom} 0`;

			})()
		}

	})
);

export const AgentConnectButton = memo(
	(props: Props) => {

		const { className, url } = props;

		const { classNames } = useClassNames({});

		const { t } = useTranslation("AgentConnectButton");

		return (
			<a className={cx(classNames.root, className)} href={url}>
				<img src={agentConnectImgUrl} alt="" className={classNames.img} />
				<span className={classNames.label} >{t("sign in with AgentConnect")}</span>
			</a>
		);

	}
);

export declare namespace AgentConnectButton {

	export type I18nScheme = {
		'sign in with AgentConnect': undefined;
	};
}