import Grid from "@mui/material/Grid2";
import { S3EntryCard } from "./S3EntryCard";

type S3Entry = {
    type: "personal" | "project" | "admin bookmark";
    directoryPath: string;
    title: string;
    description: string | undefined;
};

type Props = {
    entries: S3Entry[];
};

export function S3Entries(props: Props) {
    const { entries } = props;

    return (
        <Grid container spacing={2}>
            {entries.map(entry => (
                <Grid size={{ xs: 12, sm: 6 }} key={entry.title}>
                    <S3EntryCard
                        title={entry.title}
                        description={entry.description}
                        path={entry.directoryPath}
                        type={entry.type}
                        onCardClick={
                            () => console.log(`Navigating to ${entry.directoryPath}`)
                            //routes[route.name]({ path: "ddecrulle/" }).push()
                        }
                    />
                </Grid>
            ))}
        </Grid>
    );
}
