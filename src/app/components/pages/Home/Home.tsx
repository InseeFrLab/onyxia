
import React, { useMemo, memo } from "react";
import type { ReactNode } from "react";
//import { Link } from 'react-router-dom';
//import Button from '@material-ui/core/Button';
import { Button } from "app/components/designSystem/Button";
import { axiosURL } from "js/utils/axios-config";
import "./style.scss";
import { getEnv } from "app/env";
import { useAsync } from 'react-async-hook';
import { safeLoad as parseYaml } from 'js-yaml';
import { getScreenTypeFromWidth } from "js/model/ScreenType";
import { useWindowInnerSize } from "app/tools/hooks/useWindowInnerSize";
import { useTheme } from "app/theme/useClassNames";
import { createGroup } from "type-route";
import { routes } from "app/router";
import type { Route } from "type-route";
import { createUseClassNames, cx, css } from "app/theme/useClassNames";
import { Typography } from "app/components/designSystem/Typography";
import { ReactComponent as HeaderLogoSvg } from "app/assets/svg/OnyxiaLogo.svg";
import { useAppConstants } from "app/lib/hooks";
import { useTranslation } from "app/i18n/useTranslations";
import { useConstCallback } from "app/tools/hooks/useConstCallback";

const fetchContent = (): Promise<Content.Root> =>
	(axiosURL as any)(
		getEnv().CONTENT.HOMEPAGE_URL ?? "/pages-content/home.yaml"
	).then(parseYaml);

declare namespace Content {
	export interface Root {
		hero: Hero;
		papers: Paper[];
		project_history: Hero;
		service_highlight: Paper[];
		warning: Warning;
	}

	export interface Hero {
		smallerText: string;
		image: string;
		biggerText: string;
		button: Button;
	}

	export interface Button {
		url: string;
		label: string;
	}

	export interface Paper {
		title: string;
		image: string;
		button: Button;
		body: string;
	}

	export interface Warning {
		title: string;
		message: string;
	}
}

export type Props = {
	splashScreen: ReactNode;
	route?: Route<typeof Home.routeGroup>;
};

Home.routeGroup = createGroup([routes.home]);

Home.requireUserLoggedIn = false;

const { useClassNames } = createUseClassNames<{ heroBackgroundImageUrl: string; }>()(
	({ theme }, { heroBackgroundImageUrl }) => ({
		"root": {
			"backgroundColor": "transparent"
		},
		"hero": {
			"paddingBottom": theme.spacing(4),
			"backgroundImage": `url(${heroBackgroundImageUrl})`,

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
		"papers": {
			"borderTop": `1px solid ${theme.custom.colors.useCases.typography.textPrimary}`,
			"marginRight": theme.spacing(3),
		}
	})
)

export function Home(props: Props) {

	const { splashScreen } = props;

	const { windowInnerWidth } = useWindowInnerSize();
	const screenType = useMemo(() => getScreenTypeFromWidth(windowInnerWidth), [windowInnerWidth]);
	const theme = useTheme();

	const { result: contentRoot } = useAsync(fetchContent, []);

	const { classNames } = useClassNames({ "heroBackgroundImageUrl": contentRoot?.hero.image ?? "" });

	const appConstants = useAppConstants();

	const { t } = useTranslation("Home");

	const onHeroButtonClick = useConstCallback(() => {

		if (!appConstants.isUserLoggedIn) {
			appConstants.login();
			return;
		}

		window.location.href = contentRoot!.hero.button.url;

	});


	return !contentRoot || !screenType ?
		<>{splashScreen}</>
		:
		<div className={cx("home", classNames.root)}>
			<div className={classNames.hero} >
				<div className={classNames.heroTextWrapper}>

					<HeaderLogoSvg width={122} height={80} />
					<Typography variant="h2">
						{
							appConstants.isUserLoggedIn ?
								t("welcome", { "who": appConstants.userProfile.nomComplet }) :
								contentRoot.hero.smallerText
						}
					</Typography>
					<Typography variant="h3">{contentRoot.hero.biggerText}</Typography>

					<Button onClick={onHeroButtonClick}>
						{
							appConstants.isUserLoggedIn ?
								contentRoot.hero.button.label :
								t("logIn")
						}
					</Button>

				</div>

			</div>
			<div>
				<Card
					title="foo"
					text="lorem ipsum"
					buttonText="button text"
					onClick={() => { }}
				/>

			</div>
			<div className={cx("papers", classNames.papers)}>
				{contentRoot.papers.map((paper, i) => (
					<div key={i}>
						<section>
							<div>
								<img src={paper.image} alt="logo" />
							</div>
							<h1>{paper.title}</h1>
						</section>
						<p>{paper.body}</p>
						<ButtonLinked
							label={paper.button.label}
							target={paper.button.url}
						/>
					</div>
				))}
			</div>
			<div className="project_history">
				<section>
					<Typography variant="h1">
						{contentRoot.project_history.smallerText}
					</Typography>
					<p>{contentRoot.project_history.biggerText}</p>
					<ButtonLinked
						label={contentRoot.project_history.button.label}
						target={contentRoot.project_history.button.url}
					/>
				</section>
				{screenType === "LARGE" && (
					<div className="imageContainer">
						<img src={contentRoot.project_history.image} alt="Logo INSEEFrLab" />
					</div>
				)}
			</div>
			<div className="service_highlight">
				{contentRoot.service_highlight.map((o, i) => (
					<div key={i}>
						<img src={o.image} alt={o.title} />
						<h1>{o.title}</h1>
						<p>{o.body}</p>
						<ButtonLinked label={o.button.label} target={o.button.url} />
					</div>
				))}
			</div>
			<div className="warning">
				<div style={{ "backgroundColor": theme.palette.primary.main }}>
					<h1>{contentRoot.warning.title}</h1>
					<p>{contentRoot.warning.message}</p>
				</div>
			</div>
		</div>
		;
}

export declare namespace Home {

	export type I18nScheme = {
		welcome: { who: string; };
		logIn: undefined;
		'subtitle':undefined;
		'cardTitle1':undefined;
		'cardTitle2':undefined;
		'cardTitle3':undefined;
		'cardText1':undefined;
		'cardText2':undefined;
		'cardText3':undefined;
		'cardButton1':undefined;
		'cardButton2':undefined;
		'cardButton3':undefined;
		'projectTitle':undefined;
		'projectText':undefined;
		'projectButton':undefined;
		'warningTitle':undefined;
		'warningText':undefined;
	};

}

const ButtonLinked: React.FC<{ label: string; target: string; }> =
	({ label, target, }) => {


		const InternalOrExternalLink: React.FC = ({ children }) =>
			target?.startsWith('http') ?
				(
					<a href={target} target="_blank" rel="noopener noreferrer">
						{children}
					</a>
				) : (
					<a href={target}>
						{children}
					</a>
				);

		return <InternalOrExternalLink> <Button onClick={() => { }}>{label}</Button> </InternalOrExternalLink>;


	};


const { Card } = (() => {

	type Props = {
		title: string;
		text: string;
		buttonText: string;
		onClick(): void;
	};

	const { useClassNames } = createUseClassNames<Props>()(
		() => ({
			"root": {}
		})
	);

	const Card = memo((props: Props) => {

		const { title, text, buttonText, onClick } = props;

		const { classNames } = useClassNames(props);

		return (
			<div className={classNames.root}>
				<div className={css({ "display": "flex", })}>
					<div>SVG</div>
					<div className={css({ "flex": 1, })}>
						<Typography>{title}</Typography>
					</div>
				</div>
				<div className={css({ "display": "flex", "flexDirection": "column" })}>
					<div className={css({ "flex": 1, })}>
						<Typography>{text}</Typography>
					</div>
					<Button onClick={onClick}>{buttonText}</Button>
				</div>

			</div>
		);





	});

	return { Card };


})();
