import React, { useState, useCallback, useRef, useEffect } from 'react';
import Paper from '@material-ui/core/Paper';
import Fade from '@material-ui/core/Fade';
import classnames from 'classnames';
import "./style.scss";
import { Evt } from "evt";
import { useEvt } from "evt/hooks";




export const HidablePane: React.FC<{
	post?: () => boolean;
	anchor?: HTMLElement;
	className: string;
}> = props => {

	const { post, anchor, className } = props;
	const [isDisplayed, setIsDisplayed] = useState(false);
	const [isHidden, setIsHidden] = useState(true);
	const [requestShow, setRequestShow] = useState<undefined | "panel" | "anchor">(undefined);

	const wrapperRef = useRef<HTMLDivElement>(null);
	const [timer, setTimer] = useState(() => setTimeout(() => { }, 0));

	const checkPosition = useCallback(() => {

		if (!anchor || !wrapperRef.current) {
			return;
		}

		const rect = anchor.getBoundingClientRect();

		const { style } = wrapperRef.current;

		style.top = `${
			rect.top +
			parseInt(getComputedStyle(anchor).getPropertyValue("height"))
			}px`;
		style.left = `${rect.left}px`;
		style.width = `${rect.width}px`;


	}, [anchor]);


	const hide = useCallback(
		(who: "panel" | "anchor") => {

			if (requestShow === "panel" && who !== "panel") {
				return;
			}

			clearTimeout(timer);

			setTimer(
				setTimeout(
					() => {

						setIsDisplayed(false);
						setRequestShow(undefined);

					},
					300
				)
			);


		},
		[requestShow, timer]
	);

	const display = useCallback(
		(who: "panel" | "anchor") => {
			setRequestShow(who);
			clearTimeout(timer);
			setIsDisplayed(true);
			setIsHidden(false);
		},
		[timer]
	);

	useEvt(ctx => {

		Evt.from(
			ctx,
			window,
			"scroll",
			{ "passive": true }
		).attach(checkPosition);

	}, [checkPosition]);


	useEvt(ctx => {

		if (!anchor) {
			return;
		}

		for (const eventName of ["mouseenter", "mouseleave"] as const) {

			Evt.from(ctx, anchor, eventName)
				.attach(event => {
					event.stopImmediatePropagation();

					switch (eventName) {
						case "mouseenter": display("anchor"); break;
						case "mouseleave": hide("anchor"); break;
					}

				});
		}



	}, [anchor]);


	useEffect(() => {
		checkPosition();
		return () => { clearTimeout(timer); };
	});

	const postProcessing = useCallback(
		()=> setIsDisplayed(post?.() ?? true) , 
		[post]
		);

	return (
		<div
			className={classnames("hidable-pane", {
				"hide": isHidden,
				[className]: className
			})}
			onMouseEnter={useCallback(event => {
				event.stopPropagation();
				if (!isDisplayed){
					return;
				} 
				display("panel");
			},[isDisplayed, display])}
			onMouseLeave={useCallback(event => {
				event.stopPropagation();
				hide("panel");
			},[hide])}
			ref={wrapperRef}
		>
			<Fade
				in={isDisplayed}
				timeout={300}
				onExit={() => setIsHidden(true)}
			>
				<Paper
					elevation={1}
					classes={{ "root": "paper" }}
					onClick={postProcessing}
					onChange={postProcessing}
				>
					{props.children}
				</Paper>
			</Fade>
		</div>
	);


};
