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
import { assert } from "evt/tools/typeSafety/assert";

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
	theme => {

		const borderRadius = `0 0 0 30px`;

		return createStyles<
			"iconButton" | "circularLoading" | "collapsedPanel" | "expandedPanel" | 
			"header" | "lastTranslatedCmd" | "dollarContainer" | "entryRoot" | "preWrapper",
			Props & { headerHeight: number; isExpended: boolean; }>({
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
					},
					"& .MuiTouchRipple-root": {
						"color": theme.custom.colors.palette.limeGreen.main,
					},
				}),
				"circularLoading": {
					"color": theme.custom.colors.palette.whiteSnow.main
				},
				"collapsedPanel": {
					"maxHeight": 0,
					"overflow": "hidden",
					"transform": "scaleY(0)",
					"transition": "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
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
					"transformOrigin": "top",
					borderRadius
				}),
				"header": ({ isExpended }) => ({
					"backgroundColor": theme.custom.colors.palette.midnightBlue.main,
					...(!isExpended ? {} : { borderRadius }),
					"borderRadius": `0 0 0 ${isExpended ? 0 : 30}px`,
					"display": "flex",
					"alignItems": "center",
					//"border": "1px solid white"

				}),
				"lastTranslatedCmd": {
					"flex": 1,
					"whiteSpace": "nowrap",
					"overflow": "hidden",
					"textOverflow": "ellipsis",
					"fontFamily": "monospace",
					//"border": "1px solid white",
					"color": theme.custom.colors.palette.limeGreen.main
				},
				"dollarContainer": {

					"width": 70,
					//"border": "1px solid white",
					"textAlign": "end",
					"paddingRight": 10,

					"& svg": {
						//"border": "1px solid white",
					}
				},
				"entryRoot": {
					"display": "flex",
					//"border": "1px solid white"
				},
				"preWrapper": {
					"flex": 1,
					"& pre:nth-of-type(1)": {
						"color": theme.custom.colors.palette.limeGreen.main,
						"marginTop": 2
					},
					"& pre:nth-of-type(2)": {
						"color": theme.custom.colors.palette.whiteSnow.white
					}

				}
			});

	}
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

	const panelRef = useRef<HTMLDivElement>(null);

	const [isExpended, toggleIsExpended] = useReducer(
		isExpended => !isExpended,
		false
	);

	useEffect(
		() => {

			if (!isExpended) {
				return;
			}

			const { current: element }= panelRef!;

			assert(element !== null );

			element.scroll({ 
				"top": element.scrollHeight, 
				"behavior": "smooth" 
			});

		},
		[isExpended, evtTranslation.postCount]
	);

	//TODO: see if classes are recomputed every time because ref object changes
	const classes = useStyles({ ...props, headerHeight, isExpended });

	return (
		<div className={className}>
			<div ref={headerRef} className={classes.header}>

				<div className={classes.dollarContainer} >
					<Icon type="attachMoney" color="limeGreen" fontSize="small" />
				</div>

				<div className={classes.lastTranslatedCmd}>
					{lastTranslatedCmd}
				</div>

				<IconButton
					onClick={toggleIsExpended}
					type="expandMore"
					className={classes.iconButton}
				/>

			</div>
			<div 
			ref={panelRef}
			className={
				isExpended ?
					classes.expandedPanel :
					classes.collapsedPanel
			} 
			>
				{translationHistory.map(
					({ cmdId, cmd, resp }) =>
						<div key={cmdId} className={classes.entryRoot}>

							<div className={classes.dollarContainer}>
								<Icon type="attachMoney" color="limeGreen" fontSize="small" />
							</div>
							<div className={classes.preWrapper}>
								<pre>
									{cmd}
								</pre>
								<pre>
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

			</div>




		</div>
	);


}




