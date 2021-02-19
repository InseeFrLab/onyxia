
import React, { useEffect, useRef, memo } from "react";
import { Button } from "app/components/designSystem/Button";
import "./style.scss";
import { useTheme } from "app/theme/useClassNames";
import { createGroup } from "type-route";
import { routes } from "app/router";
import { createUseClassNames, cx, css } from "app/theme/useClassNames";
import { Typography } from "app/components/designSystem/Typography";
import { ReactComponent as HeaderLogoSvg } from "app/assets/svg/OnyxiaLogo.svg";
import { useAppConstants } from "app/lib/hooks";
import { useTranslation } from "app/i18n/useTranslations";
import { useConstCallback } from "app/tools/hooks/useConstCallback";
import { ReactComponent as IconCommunitySvg } from "app/assets/svg/IconCommunity.svg"
import { ReactComponent as IconServiceSvg } from "app/assets/svg/IconService.svg"
import { ReactComponent as IconStorageSvg } from "app/assets/svg/IconStorage.svg"
import dotsDarkSvgUrl from "app/assets/svg/dotsDark.svg";
import dotsLightSvgUrl from "app/assets/svg/dotsLight.svg";
import serverHomeImageUrl from "app/assets/img/serverHomeImage.jpg";
import { Paper } from "app/components/designSystem/Paper"

Home.routeGroup = createGroup([routes.home]);

Home.requireUserLoggedIn = false;

const { useClassNames } = createUseClassNames()(
	({ theme }) => ({
		"root": {
			"backgroundColor": "transparent"
		},
		"hero": {
			"paddingBottom": theme.spacing(4),
			"backgroundImage": `url(${(() => {
					switch (theme.palette.type) {
						case "dark": return dotsDarkSvgUrl;
						case "light": return dotsLightSvgUrl;
					}
				})()})`,
			"backgroundPosition": "right",
			"backgroundRepeat": "no-repeat",
			"backgroundSize": "50%",

			"paddingTop": 50

		},
		"heroTextWrapper": {
			"maxWidth": "35%",
			"& > *": {
				"marginBottom": theme.spacing(3)
			},
		},
		"cardsWrapper": {
			"borderTop": `1px solid ${theme.custom.colors.useCases.typography.textPrimary}`,
			"borderBottom": `1px solid ${theme.custom.colors.useCases.typography.textPrimary}`,
			"marginRight": theme.spacing(3),
			"display": "flex",
			"padding": theme.spacing(3, 0),
			"& > *": {
				"flex": 1
			}
		},
		"middleCard": {
			"margin": theme.spacing(0, 2)
		}
	})
)

export function Home() {


	const theme = useTheme();

	const { classNames } = useClassNames({});

	const appConstants = useAppConstants();

	const { t } = useTranslation("Home");

	const onHeroButtonClick = useConstCallback(() => {

		if (!appConstants.isUserLoggedIn) {
			appConstants.login();
			return;
		}

		alert('Use { routes } from "app/routes" to redirect to assisted tour');

	});


	return (
		<div className={cx("home", classNames.root)}>
			<div className={classNames.hero} >
				<div className={classNames.heroTextWrapper}>

					<HeaderLogoSvg width={122} height={80} />
					<Typography variant="h2">
						{
							appConstants.isUserLoggedIn ?
								t("welcome", { "who": appConstants.userProfile.nomComplet }) :
								t("title")
						}
					</Typography>
					<Typography variant="h3">
						{t("subtitle")}
					</Typography>

					<Button onClick={onHeroButtonClick}>
						{
							appConstants.isUserLoggedIn ?
								t("start tour") :
								t("logIn")
						}
					</Button>

				</div>

			</div>
			<div className={classNames.cardsWrapper}>
				<Card
					Icon={IconServiceSvg}
					title={t("cardTitle1")}
					text={t("cardText1")}
					buttonText={t("cardButton1")}
					onClick={() => { }}
				/>
				<Card
					className={classNames.middleCard}
					Icon={IconCommunitySvg}
					title={t("cardTitle2")}
					text={t("cardText2")}
					buttonText={t("cardButton2")}
					onClick={() => { }}
				/>
				<Card
					Icon={IconStorageSvg}
					title={t("cardTitle3")}
					text={t("cardText3")}
					buttonText={t("cardButton3")}
					onClick={() => { }}
				/>





			</div>

			<div className={css({
				"display": "flex",
				"marginRight": theme.spacing(3),
			})}>
				<section className={css({ "flex": 1, "display": "flex", "alignItems": "center" })}>
					<div className={css({ "width": "60%" })}>
						<Typography
							variant="h4"
							className={css({ "marginBottom": theme.spacing(3) })}
						>
							{t("projectTitle")}
						</Typography>
						<Typography>{t("projectText")}</Typography>
						<Button
							onClick={() => { }}
							color="secondary"
							className={css({ "marginTop": theme.spacing(3) })}
						>
							{t("projectButton")}
						</Button>
					</div>
				</section>
				<div className={css({ "flex": 1 })}>
					<img src={serverHomeImageUrl} alt="Logo INSEEFrLab" className={css({
						"width": "100%",
						"height": 410,
						"objectFit": "cover"
					})} />
				</div>
			</div>


			<div className="warning">
				<div style={{ "backgroundColor": theme.palette.primary.main }}>
					<h1>{t("warningTitle")}</h1>
					<p>{t("warningText")}</p>
				</div>
			</div>
		</div>
	);
}

export declare namespace Home {

	export type I18nScheme = {
		welcome: { who: string; };
		logIn: undefined;
		title: undefined;
		subtitle: undefined;
		'start tour': undefined;
		cardTitle1: undefined;
		cardTitle2: undefined;
		cardTitle3: undefined;
		cardText1: undefined;
		cardText2: undefined;
		cardText3: undefined;
		cardButton1: undefined;
		cardButton2: undefined;
		cardButton3: undefined;
		projectTitle: undefined;
		projectText: undefined;
		projectButton: undefined;
		warningTitle: undefined;
		warningText: undefined;
	};

}



const { Card } = (() => {

	type Props = {
		className?: string;
		title: string;
		text: string;
		buttonText: string;
		Icon: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
		onClick(): void;
	};


	const Card = memo((props: Props) => {

		const { title, text, buttonText, Icon, className, onClick } = props;

		const theme = useTheme();

		const iconRef = useRef<SVGSVGElement>(null);

		useEffect(
			() => {
				iconRef.current!
					.querySelectorAll("g")
					.forEach(g =>
						g.setAttribute("fill",
							g.classList.contains("colorPrimary") ?
								theme.custom.colors.palette.exuberantOrange.main :
								theme.custom.colors.useCases.typography.textPrimary
						)
					);
			},
			[theme]
		);

		return (
			<Paper className={cx(css({
				"display": "flex",
				"flexDirection": "column",
				"padding": theme.spacing(2),
				"backgroundColor": (() => {
					switch (theme.palette.type) {
						case "dark": return "#383E50";
						case "light": return undefined;
					}
				})()
			}), className)}>
				<div className={css({ "display": "flex", })}>
					<Icon ref={iconRef} width={120} height={120} />
					<div className={css({
						"flex": 1,
						"display": "flex",
						"alignItems": "center",
						"padding": theme.spacing(0, 3)
					})}>
						<Typography variant="h4">{title}</Typography>
					</div>
				</div>
				<div className={css({
					"flex": 1,
					"display": "flex",
					"flexDirection": "column",
					"paddingTop": theme.spacing(2)
				})}>
					<div className={css({ "flex": 1, })}>
						<Typography>{text}</Typography>
					</div>
					<div className={css({ "marginTop": theme.spacing(4) })} >
						<Button onClick={onClick}>{buttonText}</Button>
					</div>
				</div>

			</Paper>
		);

	});

	return { Card };

})();
