import { useState, useReducer } from "react";
import { createStyles, makeStyles } from "@material-ui/core/styles";
import Accordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
//TODO: Refactor this: find a more meaningfully name and detach from SecretManager
import type { NonPostableEvt } from "evt";
import { useEvt } from "evt/hooks";
import { id } from "evt/tools/typeSafety/id";
import memoize from "memoizee";
import { useDOMRect } from "app/utils/hooks/useDOMRect";
import clsx from "clsx";
import MuiCircularProgress from "@material-ui/core/CircularProgress";

export type Props = {
	className: string;
	evtTranslation: NonPostableEvt<{
		type: "cmd" | "result";
		cmdId: number;
		translation: string;
	}>;
};



const useStyles = makeStyles(
	theme => {

		const limeGreen = theme.custom.colors.palette.limeGreen.main;

		return createStyles<
			"root" | 
			"lastCmdCode" | "accordionSummary" | "accordionExpanded" |
			"limeGreen" | "white" | "accordionDetails" | "circularLoading",
			Props & { detailsHeight: number; }
		>({
			"root": {
				// To prevent command to be displayed outside
				// during the transition
				"overflow": "hidden"
			},
			"accordionExpanded": ({ detailsHeight }) => ({
				"& .MuiAccordionDetails-root": {
					"height": detailsHeight,
					"& > *": {
						"position": "absolute", 
						"bottom": 20
					}
				}
			}),
			"accordionSummary": {
				"backgroundColor": theme.custom.colors.palette.midnightBlue.main,
				"zIndex": 1000
			},
			"lastCmdCode": {
				"whiteSpace": "nowrap",
				"overflow": "hidden",
				"textOverflow": "ellipsis",
				"color": limeGreen
			},
			"limeGreen": {
				"color": limeGreen
			},
			"white": {
				"color": theme.custom.colors.palette.whiteSnow.white
			},
			"accordionDetails": {
				"backgroundColor": theme.custom.colors.palette.midnightBlue.light,
				"overflow": "auto"
			},
			"circularLoading": {
				"color": theme.custom.colors.palette.whiteSnow.main
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
							.replace("/ \n/g", " ")
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

	const { domRect: { height: totalHeight }, ref: rootRef } = useDOMRect();
	const { domRect: { height: accordionSummaryHeight }, ref: accordionSummaryRef } = useDOMRect();

	const classes = useStyles({ ...props, "detailsHeight": totalHeight - accordionSummaryHeight });

	return (
		<div ref={rootRef} className={clsx(classes.root, className)}>
			<Accordion
				square={true}
				classes={{
					"expanded": classes.accordionExpanded
				}}
			>
				<AccordionSummary
					ref={accordionSummaryRef}
					classes={{
						"root": classes.accordionSummary,
						"expandIcon": classes.limeGreen
					}}
					expandIcon={<ExpandMoreIcon />}
				>
					<code className={classes.lastCmdCode}>
						$ {lastTranslatedCmd}
					</code>

				</AccordionSummary>
				<AccordionDetails
					classes={{ "root": classes.accordionDetails }}
				>
					<div> {/* div positioned at the bottom*/}
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
				</AccordionDetails>
			</Accordion>
		</div>
	);

}




