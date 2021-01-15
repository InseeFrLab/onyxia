import { useState, useReducer, useRef, useEffect } from "react";
import { createStyles, makeStyles } from "@material-ui/core/styles";
//TODO: Refactor this: find a more meaningfully name and detach from SecretManager
import type { NonPostableEvt } from "evt";
import { useEvt } from "evt/hooks";
import { id } from "evt/tools/typeSafety/id";
import memoize from "memoizee";
import { useDOMRect } from "app/utils/hooks/useDOMRect";
import MuiCircularProgress from "@material-ui/core/CircularProgress";
import { IconButton } from "app/components/designSystem/IconButton";
import { Icon } from "app/components/designSystem/Icon";



export type Props = {
	className: string;
	evtTranslation: NonPostableEvt<{
		type: "cmd" | "result";
		cmdId: number;
		translation: string;
	}>;
	/** In pixel */
	maxHeight: number;
};



const useStyles = makeStyles(
	theme => createStyles<
		"root" | "iconButton" | "limeGreen" |
		"white" | "circularLoading" | "collapsedPanel" | "expandedPanel" | "header" | "dollar",
		Props & { headerHeight: number; isExpended: boolean; }
	>({
		"root": {
		},
		"iconButton": ({ isExpended }) => ({
			"& svg": {
				"color": theme.custom.colors.palette.limeGreen.main,
				"transition": theme.transitions.create(
					["transform"],
					{ "duration": theme.transitions.duration.short }
				),
				"transform": isExpended ?
					"rotate(-180deg)" :
					"rotate(0)",
			},
			"&:hover": {
				"& svg": {
					"color": theme.custom.colors.palette.whiteSnow.white,
				}
			}
		}),
		"limeGreen": {
			"color": theme.custom.colors.palette.limeGreen.main
		},
		"white": {
			"color": theme.custom.colors.palette.whiteSnow.white
		},
		"circularLoading": {
			"color": theme.custom.colors.palette.whiteSnow.main
		},
		"collapsedPanel": {
			"maxHeight": 0,
			"overflow": "hidden",
			"transform": "scaleY(0)",
			"transition": [
				"all 150ms cubic-bezier(0.4, 0, 0.2, 1)", 
				"all 150ms cubic-bezier(0.4, 0, 0.2, 1)"
			].join(", "),
		},
		"expandedPanel": ({ maxHeight, headerHeight }) => ({
			"maxHeight": maxHeight - headerHeight,
			"backgroundColor": theme.custom.colors.palette.midnightBlue.light,
			"overflow": "scroll",
			"transition": "transform 150ms cubic-bezier(0.4, 0, 0.2, 1)",
			"& pre": {
				"whiteSpace": "pre-wrap",
				"wordBreak": "break-all"
			},
			"transform": "scaleY(1)",
			"transformOrigin":"top"
		}),
		"header": {
			"backgroundColor": theme.custom.colors.palette.midnightBlue.main
		},
		"dollar": {
			"border": "1px solid white",
		}

	})
);
export function CmdTranslation(props: Props) {

	const { className, evtTranslation } = props;

	const [lastTranslatedCmd, setLastTranslatedCmd] = useState("");

	const [getTranslationHistory] = useState(
		() => memoize(
			(_evtTranslation: Props["evtTranslation"]) =>
				id<{
					cmdId: number;
					cmd: string;
					resp: string | undefined;
				}[]>([])
		)
	);

	const translationHistory = getTranslationHistory(evtTranslation);

	const [, forceUpdate] = useReducer(x => x + 1, 0);

	useEvt(
		ctx => {

			evtTranslation.attach(
				({ type }) => type === "cmd",
				ctx,
				({ cmdId, translation }) => {

					setLastTranslatedCmd(
						translation
							.replace(/\\\n/g, " ")
					);

					translationHistory.push({
						cmdId,
						"cmd": translation,
						"resp": undefined
					});

					forceUpdate();

					evtTranslation.attach(
						translation => translation.cmdId === cmdId,
						ctx,
						({ translation }) => {

							translationHistory
								.find(entry => entry.cmdId === cmdId)!
								.resp = translation;

							forceUpdate();

						}
					);

				}
			);

		},
		[evtTranslation, translationHistory]
	);

	const { domRect: { height: headerHeight }, ref: headerRef } = useDOMRect();

	const bottomRef = useRef<HTMLDivElement>(null);

	const [isExpended, toggleIsExpended] = useReducer(
		isExpended => !isExpended,
		false
	);

	useEffect(
		() => {

			if (!isExpended) {
				return;
			}

			bottomRef.current?.scrollIntoView();

		},
		[isExpended, evtTranslation.postCount]
	);

	const classes = useStyles({ ...props, headerHeight, isExpended });

	return (
		<div className={className}>
			<div style={{ "display": "flex", "alignItems": "center", "border": "1px solid white" }} ref={headerRef} className={classes.header}>

				<div style={{ "width": 50, /*"textAlign": "center",*/ "border": "1px solid white", "textAlign": "end", "paddingRight": 10 }} className={classes.limeGreen}>
					<Icon type="attachMoney" color="limeGreen" className={classes.dollar} fontSize="small" />


					{/*<code className={classes.limeGreen}>$</code>*/}

				</div>

				<div className={classes.limeGreen} style={{
					"flex": 1,
					"whiteSpace": "nowrap",
					"overflow": "hidden",
					"textOverflow": "ellipsis",
					"fontFamily": "monospace",
					"border": "1px solid white"
				}}>
					{lastTranslatedCmd}
				</div>

				{/* inline block */}
				<IconButton
					onClick={toggleIsExpended}
					type="expandMore"
					className={classes.iconButton}
				/>

			</div>

			<div className={
				isExpended ?
					classes.expandedPanel :
					classes.collapsedPanel
			} >

				{translationHistory.map(
					({ cmdId, cmd, resp }) =>
						<div key={cmdId} style={{ "display": "flex", "border": "1px solid white" }}>

							<div style={{ "width": 50, "border": "1px solid white", "textAlign": "end", "paddingRight": 10 }}>

								<Icon type="attachMoney" color="limeGreen" className={classes.dollar} fontSize="small" />

							</div>
							<div style={{ "flex": 1 }}>
								<pre className={classes.limeGreen} style={{ "marginTop": 4 }}>
									{cmd}
								</pre>
								<pre className={classes.white}>
									{resp === undefined ?
										<MuiCircularProgress
											classes={{ "root": classes.circularLoading }}
											size={10}
										/>
										: resp}
								</pre>
							</div>

						</div>
				)}
				<div style={{ "float": "left", "clear": "both" }} ref={bottomRef} />

			</div>




		</div>
	);


}




