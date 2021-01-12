import { useState, useReducer } from "react";
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
		"white" | "circularLoading" | "expandedPanel" | "header" | "dollar",
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
					"rotate(0)"
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
		"expandedPanel": ({ maxHeight, headerHeight }) => ({
			"maxHeight": maxHeight - headerHeight
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

	const [isExpended, toggleIsExpended] = useReducer(isExpended => !isExpended, false);

	const classes = useStyles({ ...props, headerHeight, isExpended });


	return (
		<div className={className}>
			<div style={{ "display": "flex", "alignItems": "center", "border": "1px solid white" }} ref={headerRef} className={classes.header}>

				<div style={{ "width": 40, "textAlign": "center", "border": "1px solid white",   }} className={classes.limeGreen}>
					<Icon type="attachMoney" color="limeGreen" className={classes.dollar} />


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

			{ isExpended &&
				<div className={classes.expandedPanel}>

					{translationHistory.map(
						({ cmdId, cmd, resp }) =>
							<div key={cmdId}>
								<pre className={classes.limeGreen}>
									$ {cmd}
								</pre>
								<pre className={classes.white}>
									{"  "}{resp === undefined ?
										<MuiCircularProgress
											classes={{ "root": classes.circularLoading }}
											size={10}
										/>
										: resp}
								</pre>
							</div>
					)}

				</div>
			}




		</div>
	);


}




