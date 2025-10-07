import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { DatasetCard } from "./DatasetCard";
import { tss } from "tss";

type Props = {
    datasets: React.ComponentProps<typeof DatasetCard>["dataset"][];
};
export function DatasetListVirtualized(props: Props) {
    const { datasets } = props;
    const parentRef = useRef<HTMLDivElement>(null);

    const virtualizer = useVirtualizer({
        count: datasets.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 600,
        overscan: 10
    });

    const virtualItems = virtualizer.getVirtualItems();
    const { classes } = useStyles({
        relativeHeight: virtualizer.getTotalSize(),
        absoluteStart: virtualItems[0]?.start ?? 0
    });

    return (
        <div ref={parentRef} className={classes.scrollContainer}>
            <div className={classes.relativeContainer}>
                <div className={classes.absoluteContainer}>
                    {virtualItems.map(virtualRow => (
                        <DatasetCard
                            key={datasets[virtualRow.index].id}
                            data-index={virtualRow.index}
                            ref={virtualizer.measureElement}
                            dataset={datasets[virtualRow.index]}
                            className={classes.datasetCard}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

const useStyles = tss
    .withName({ DatasetListVirtualized })
    .withParams<{ relativeHeight: number; absoluteStart: number }>()
    .create(({ theme, relativeHeight, absoluteStart }) => ({
        scrollContainer: {
            flex: 1,
            overflow: "auto",
            contain: "strict"
        },
        relativeContainer: {
            height: relativeHeight,
            width: "100%",
            position: "relative"
        },
        absoluteContainer: {
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            transform: `translateY(${absoluteStart}px)`
        },
        datasetCard: {
            marginBottom: theme.spacing(3)
        }
    }));
