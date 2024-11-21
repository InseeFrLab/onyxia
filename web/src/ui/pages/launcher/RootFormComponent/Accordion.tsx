import { useId, useState, useEffect } from "react";
import type {
    FormField,
    FormFieldGroup
} from "core/usecases/launcher/decoupledLogic/formTypes";
import MuiAccordion from "@mui/material/Accordion";
import MuiAccordionSummary from "@mui/material/AccordionSummary";
import MuiAccordionDetails from "@mui/material/AccordionDetails";
import { tss } from "tss";
import { Icon } from "onyxia-ui/Icon";
import { Text } from "onyxia-ui/Text";
import { FormFieldGroupComponent } from "./FormFieldGroupComponent";
import type { FormCallbacks } from "./FormCallbacks";
import { capitalize } from "tsafe/capitalize";
import { assert } from "tsafe/assert";
import { getScrollableParent } from "powerhooks/getScrollableParent";
import { useConst } from "powerhooks/useConst";
import { Evt } from "evt";
import { getIconUrlByName } from "lazy-icons";

type Props = {
    className?: string;
    helmValuesPath: (string | number)[];
    description: string | undefined;
    title: string | undefined;
    nodes: (FormFieldGroup | FormField)[];
    canAdd: boolean;
    canRemove: boolean;
    callbacks: FormCallbacks;
};

export function Accordion(props: Props) {
    const {
        className,
        helmValuesPath,
        description,
        title,
        nodes,
        canAdd,
        canRemove,
        callbacks
    } = props;

    const { classes, cx } = useStyles();

    const contentId = useId();

    const [isExpanded, setIsExpanded] = useState(false);

    const [rootElement, setRootElement] = useState<HTMLElement | null>(null);

    const evtAnimationEnd = useConst(() => Evt.create());

    useEffect(() => {
        if (rootElement === null) {
            return;
        }

        const scrollableParent = getScrollableParent({
            element: rootElement,
            doReturnElementIfScrollable: false
        });

        if (!isExpanded) {
            scrollableParent.style.scrollBehavior = "smooth";
            scrollableParent.scrollTop -= 30;
            return;
        }

        let isActive = true;

        (async () => {
            let isAnimationEnded = false;

            const ctx = Evt.newCtx();

            evtAnimationEnd.attachOnce(ctx, () => {
                isAnimationEnded = true;
            });

            scrollableParent.style.scrollBehavior = "unset";

            while (!isAnimationEnded && isActive) {
                const scrollableParentRect = scrollableParent.getBoundingClientRect();
                const rootElementRect = rootElement.getBoundingClientRect();

                const dSpaceLeft = rootElementRect.top - scrollableParentRect.top;
                const dOutOfView =
                    rootElementRect.bottom - scrollableParentRect.bottom + 10;

                if (dOutOfView > 0) {
                    if (dOutOfView >= dSpaceLeft) {
                        scrollableParent.style.scrollBehavior = "smooth";
                        scrollableParent.scrollTop += dSpaceLeft;
                        break;
                    }

                    scrollableParent.scrollTop += dOutOfView;
                }

                await new Promise(resolve => setTimeout(resolve, 5));
            }

            ctx.done();
        })();

        return () => {
            isActive = false;
        };
    }, [isExpanded]);

    return (
        <MuiAccordion
            ref={setRootElement}
            className={cx(classes.root, className)}
            expanded={isExpanded}
            onChange={(...[, isExpanded]) => setIsExpanded(isExpanded)}
            slotProps={{
                transition: {
                    onEntered: () => {
                        evtAnimationEnd.post();
                    }
                    //timeout: 5_000
                }
            }}
        >
            <MuiAccordionSummary
                classes={{
                    root: classes.summary,
                    content: classes.summaryContent,
                    expanded: classes.summaryExpanded,
                    expandIconWrapper: classes.summaryExpandIconWrapper
                }}
                expandIcon={<Icon icon={getIconUrlByName("ExpandMore")} />}
                aria-controls={contentId}
            >
                <Text typo="label 1" componentProps={{ lang: "und" }}>
                    {(() => {
                        if (title !== undefined) {
                            return title;
                        }

                        const lastSegment = helmValuesPath[helmValuesPath.length - 1];

                        assert(typeof lastSegment === "string");

                        return capitalize(lastSegment);
                    })()}
                </Text>
                <Text typo="caption" color="secondary" componentProps={{ lang: "und" }}>
                    {description}
                </Text>
            </MuiAccordionSummary>
            <MuiAccordionDetails id={contentId} className={classes.details}>
                <FormFieldGroupComponent
                    className={classes.group}
                    nodes={nodes}
                    helmValuesPath={helmValuesPath}
                    canAdd={canAdd}
                    canRemove={canRemove}
                    callbacks={callbacks}
                />
            </MuiAccordionDetails>
        </MuiAccordion>
    );
}

const useStyles = tss
    .withName({ Accordion })
    .withNestedSelectors<"summary" | "summaryExpanded">()
    .create(({ theme, classes }) => ({
        root: {
            backgroundColor: theme.colors.useCases.surfaces.surface1
        },
        summaryExpanded: {},
        summary: {
            backgroundColor: theme.colors.useCases.surfaces.surface1,
            [`&.${classes.summaryExpanded}`]: {
                borderBottom: `1px solid ${theme.colors.useCases.typography.textDisabled}`
            }
        },
        summaryContent: {
            display: "flex",
            alignItems: "baseline",
            gap: theme.spacing(2),
            paddingLeft: theme.spacing(4)
        },
        summaryExpandIconWrapper: {
            color: theme.colors.useCases.typography.textPrimary,
            [`.${classes.summary}:hover &`]: {
                color: theme.colors.useCases.typography.textFocus
            }
        },
        details: {
            paddingTop: theme.spacing(4),
            backgroundColor: theme.colors.useCases.surfaces.surface1,
            paddingLeft: theme.spacing(4)
        },
        group: {
            padding: theme.spacing(2)
        }
    }));
