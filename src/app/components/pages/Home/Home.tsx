
import { useEffect, useRef, useMemo, memo } from "react";
import { Button } from "app/theme";
import { createGroup } from "type-route";
import { routes } from "app/routes/router";
import { createUseClassNames, useTheme } from "app/theme";
import { cx } from "tss-react";
import { css } from "tss-react";
import { Typography } from "onyxia-ui";
import { ReactComponent as OnyxiaLogoSvg } from "app/assets/svg/OnyxiaLogo.svg";
import { useAppConstants } from "app/interfaceWithLib/hooks";
import { useTranslation } from "app/i18n/useTranslations";
import { useConstCallback } from "powerhooks";
import { ReactComponent as IconCommunitySvg } from "app/assets/svg/IconCommunity.svg"
import { ReactComponent as IconServiceSvg } from "app/assets/svg/IconService.svg"
import { ReactComponent as IconStorageSvg } from "app/assets/svg/IconStorage.svg"
import { Paper } from "onyxia-ui"
import { assert } from "tsafe/assert";
import type { Link } from "type-route";
import onyxiaNeumorphismDarkModeUrl from "app/assets/svg/OnyxiaNeumorphismDarkMode.svg";
import onyxiaNeumorphismLightModeUrl from "app/assets/svg/OnyxiaNeumorphismLightMode.svg";
import homeIllustrationImgUrl from "app/assets/img/homeIllustration.png"

Home.routeGroup = createGroup([
	routes.home
]);

Home.requireUserLoggedIn = () => false;

const { useClassNames } = createUseClassNames()(
	theme => ({
		"root": {
			"backgroundColor": "transparent",
			"display": "flex",
			"flexDirection": "column",
			"paddingRight": theme.spacing(3),
		},
		"hero": {
			"flex": 1,
			"backgroundImage": `url(${homeIllustrationImgUrl}), url(${theme.isDarkModeEnabled ?
				onyxiaNeumorphismDarkModeUrl :
				onyxiaNeumorphismLightModeUrl
				})`,
			"backgroundPosition": "171% 38%, 100% 0%",
			"backgroundRepeat": "no-repeat, no-repeat",
			"backgroundSize": "76%, 80%",
		},
		"heroTextWrapper": {
			"paddingLeft": theme.spacing(2),
			"maxWidth": "42%",
			"& > *": {
				"marginBottom": theme.spacing(3)
			},
		},
		"heroSubtitle": {
			"marginBottom": theme.spacing(4)
		},
		"cardsWrapper": {
			"borderTop": `1px solid ${theme.colors.useCases.typography.textPrimary}`,
			"display": "flex",
			"padding": theme.spacing(3, 0),
			"& > *": {
				"flex": 1
			}
		},
		"middleCard": {
			"margin": theme.spacing(0, 2)
		},
		"svg": {
			"fill": theme.colors.palette.focus.main,
			"width": 122
		}
	})
)

type Props ={
	className?: string;
};

export function Home(props: Props) {

	const { className } = props;

	const { classNames } = useClassNames({});

	const appConstants = useAppConstants();

	const { t } = useTranslation("Home");

	const onHeroButtonClick = useConstCallback(() => {
		assert(!appConstants.isUserLoggedIn);
		appConstants.login();
	});

	const myBucketsLink = useMemo(() => routes.myBuckets().link, []);
	const catalogExplorerLink = useMemo(() => routes.catalogExplorer().link, []);

	return (
		<div className={cx(classNames.root, className)}>
			<div className={classNames.hero} >
				<div className={classNames.heroTextWrapper}>

					<OnyxiaLogoSvg className={classNames.svg} />
					<Typography variant="h1">
						{
							appConstants.isUserLoggedIn ?
								t("welcome", { "who": appConstants.parsedJwt.given_name }) :
								t("title")
						}
					</Typography>
					<Typography 
					variant="h3"
					className={classNames.heroSubtitle}
					>
						{t("subtitle")}
					</Typography>
					{
						!appConstants.isUserLoggedIn ?
							<Button onClick={onHeroButtonClick}>
								{t("login")}
							</Button>
							:
							<Button href="https://docs.sspcloud.fr/" >
								{t("new user")}
							</Button>
					}
				</div>

			</div>
			<div className={classNames.cardsWrapper}>
				<Card
					Icon={IconServiceSvg}
					title={t("cardTitle1")}
					text={t("cardText1")}
					buttonText={t("cardButton1")}
					link={catalogExplorerLink}
				/>
				<Card
					className={classNames.middleCard}
					Icon={IconCommunitySvg}
					title={t("cardTitle2")}
					text={t("cardText2")}
					buttonText={t("cardButton2")}
					link={"https://tchap.gouv.fr/#/room/#SSPCloudXDpAw6v:agent.finances.tchap.gouv.fr"}
				/>
				<Card
					Icon={IconStorageSvg}
					title={t("cardTitle3")}
					text={t("cardText3")}
					buttonText={t("cardButton3")}
					link={myBucketsLink}
				/>
			</div>



		</div>
	);
}

export declare namespace Home {

	export type I18nScheme = {
		welcome: { who: string; };
		login: undefined;
		'new user': undefined;
		title: undefined;
		subtitle: undefined;
		cardTitle1: undefined;
		cardTitle2: undefined;
		cardTitle3: undefined;
		cardText1: undefined;
		cardText2: undefined;
		cardText3: undefined;
		cardButton1: undefined;
		cardButton2: undefined;
		cardButton3: undefined;
	};

}



const { Card } = (() => {

	type Props = {
		className?: string;
		title: string;
		text: string;
		buttonText: string;
		Icon: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
		link: Link | string;
	};


	const Card = memo((props: Props) => {

		const { title, text, buttonText, Icon, className, link } = props;

		const theme = useTheme();

		const iconRef = useRef<SVGSVGElement>(null);

		useEffect(
			() => {
				iconRef.current!
					.querySelectorAll("g")
					.forEach(g =>
						g.setAttribute("fill",
							g.classList.contains("colorPrimary") ?
								theme.colors.palette.focus.main :
								theme.colors.useCases.typography.textPrimary
						)
					);
			},
			[theme]
		);

		return (
			<Paper className={cx(css({
				"display": "flex",
				"flexDirection": "column",
				"padding": theme.spacing(3),
				"backgroundColor": theme.isDarkModeEnabled ? "#383E50" : undefined
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
						<Typography variant="body1">{text}</Typography>
					</div>
					<div className={css({ 
						"marginTop": theme.spacing(4),
						"display": "flex"
					})} >
						<div style={{ "flex": 1 }} />
						<Button
							color="secondary"
							{...(typeof link === "string" ? { "href": link } : link)}
						>
							{buttonText}
						</Button>
					</div>
				</div>

			</Paper>
		);

	});

	return { Card };

})();
