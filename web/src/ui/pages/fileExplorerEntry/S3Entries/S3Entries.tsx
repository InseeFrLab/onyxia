import Grid from "@mui/material/Grid2";
import { S3EntryCard } from "./S3EntryCard";
import { routes } from "ui/routes";

type S3Entry = {
    type: "personal" | "project" | "admin bookmark";
    directoryPath: string;
    title: string;
    description: string | undefined;
};

type Props = {
    className?: string;
    entries: S3Entry[];
};

export function S3Entries(props: Props) {
    const { entries, className } = props;

    return (
        <Grid container spacing={2} className={className}>
            {entries.map(entry => (
                <Grid size={{ xs: 12, sm: 6 }} key={entry.title}>
                    <S3EntryCard
                        title={entry.title}
                        description={entry.description}
                        path={entry.directoryPath}
                        type={entry.type}
                        onCardClick={() =>
                            routes.myFiles({ path: entry.directoryPath }).push()
                        }
                    />
                </Grid>
            ))}
        </Grid>
    );
}
