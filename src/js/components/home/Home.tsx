
import React from 'react';
import Loader from 'js/components/commons/loader';
import { Link } from 'react-router-dom';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import { axiosURL } from 'js/utils';
import './style.scss';
import { env } from 'js/env';
import createTheme from 'js/components/material-ui-theme';
import { useAsync } from 'react-async-hook';
import { safeLoad as parseYaml } from 'js-yaml';
import { getScreenTypeFromWidth, getScreenTypeBreakpoint } from "js/model/ScreenType";
import { useSelector } from "js/redux/store";
const theme = createTheme();

const fetchContent = (): Promise<Content.Root> =>
	(axiosURL as any)(
		env.CONTENT.HOMEPAGE_URL || '/pages-content/home.yaml'
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

export const Home: React.FC = () => {

	const screenWidth = useSelector(state => state.app.screenWidth);
	const screenType = getScreenTypeFromWidth(screenWidth);

	const { result: contentRoot } = useAsync(fetchContent, []);

	return !contentRoot || !screenType ? (
		<Loader em={30} />
	) : (
		<div className="home">
			<div
				className="hero"
				style={{
					backgroundImage:
						screenType === "LARGE"
							? `url(${contentRoot.hero.image})`
							: undefined,
				}}
			>
				{screenWidth > getScreenTypeBreakpoint("SMALL") && (
					<Typography variant="h1">{contentRoot.hero.smallerText}</Typography>
				)}
				<Typography variant="h2">{contentRoot.hero.biggerText}</Typography>

				<ButtonLinked
					label={contentRoot.hero.button.label}
					target={contentRoot.hero.button.url}
				/>
			</div>
			<div className="papers">
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
				{contentRoot.service_highlight.map((o,i) => (
					<div key={i}>
						<img src={o.image} alt={o.title} />
						<h1>{o.title}</h1>
						<p>{o.body}</p>
						<ButtonLinked label={o.button.label} target={o.button.url} />
					</div>
				))}
			</div>
			<div className="warning">
				<div style={{ backgroundColor: theme.palette.primary.main }}>
					<h1>{contentRoot.warning.title}</h1>
					<p>{contentRoot.warning.message}</p>
				</div>
			</div>
		</div>
	);
};

const ButtonLinked: React.FC<{ label: string; target: string; }> = ({
	label,
	target,
}) => {

	const Child = ()=> <Button>{label}</Button>;

	return target?.startsWith('http') ? (
		<a href={target} target="_blank" rel="noopener noreferrer">
			<Child />
		</a>
	) : (
		<Link to={target}>
			<Child />
		</Link>
	);

}